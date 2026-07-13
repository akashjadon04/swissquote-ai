import { NextRequest, NextResponse } from "next/server";
import { extractFromDescription } from "@/lib/gemini";
import { matchArticles } from "@/lib/catalogue-matcher";
import { calculateLabourFromItems, complexityMultiplier } from "@/lib/financial";
import type { AIArticle, CatalogueArticle, SupplierCode } from "@/types/database.types";
import { MOCK_CATALOGUE } from "@/lib/catalogueData";

// POST /api/ai/process — Unified AI + Catalogue Match + Labour Endpoint
// Does AI extraction + catalogue matching + labour calc server-side in one call.

// NOTE: Node.js runtime (not edge) so the 9MB catalogue module is loaded and
// CACHED once per warm Lambda instance rather than re-parsed on every cold start.
export const maxDuration = 60;

// Adapt catalogue data once at module load (base_price -> unit_price, name -> description)
// CRITICAL: use || not ?? because description is empty string "", not null/undefined
const CATALOGUE_ADAPTED: CatalogueArticle[] = (MOCK_CATALOGUE as any[]).map((a) => ({
  ...a,
  description: a.description || a.name || "",  // FIX: || falls back on empty string
  unit_price: typeof a.unit_price === "number" ? a.unit_price : (a.base_price ?? 0),
  supplier_id: a.supplier_id ?? a.supplier?.code ?? "",
  created_at: a.created_at ?? "",
  updated_at: a.updated_at ?? "",
}));

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 50; // Increased to 50 for testing purposes
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Limite de requêtes atteinte. Veuillez patienter un instant." }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Le traitement par l'IA a échoué. Veuillez réessayer." }, { status: 400 });
    }

    const { description, preferredSupplier } = body as {
      description: string;
      preferredSupplier?: SupplierCode;
    };

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Description vide." }, { status: 400 });
    }
    if (description.length > 10_000) {
      return NextResponse.json({ error: "Le traitement par l'IA a échoué. Veuillez réessayer." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onLog = (formattedMsg: string) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'log', message: formattedMsg }) + '\n'));
          } catch (e) {
            // Ignore if stream is closed
          }
        };

        // Send keep-alive newlines every 3 seconds to bypass Vercel's Edge timeout limit
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode('\n'));
          } catch (e) {
            clearInterval(keepAlive);
          }
        }, 3000);

        try {
          // Step 1: AI Extraction identifies what materials/work is needed
          const aiResult = await extractFromDescription(description.trim(), onLog);

          // Step 2: Catalogue Matching only matched references get prices
          const allArticles: AIArticle[] = aiResult.extraction.sections.flatMap(s => s.articles);
          const matchResult = matchArticles(allArticles, CATALOGUE_ADAPTED, preferredSupplier);

          // Step 3: Labour Calculation based on matched items with real categories
          const itemsForLabour = [
            ...matchResult.matched.map(m => ({
              category: m.catalogueArticle.category,
              quantity: m.aiArticle.quantity,
              unit: m.aiArticle.unit,
              isMissing: false,
            })),
            ...matchResult.missing.map(m => ({
              category: null,
              quantity: m.aiArticle.quantity,
              unit: m.aiArticle.unit,
              isMissing: true,
            })),
          ];

          const complexity = "standard"; // Default since AI is simplified
          const multiplier = complexityMultiplier(complexity);
          const calculatedLabourHours = calculateLabourFromItems(itemsForLabour, multiplier);
          
          const totalValidItems = allArticles.length;
          const matchedCount = matchResult.matched.length;
          const realMatchRate = totalValidItems > 0 ? (matchedCount / totalValidItems) : 0;

          const responsePayload = {
            type: 'result',
            extraction: aiResult.extraction,
            provider: aiResult.provider,
            matchResult,
            labourHours: calculatedLabourHours,
            labourComplexity: complexity,
            labourMultiplier: multiplier,
            realMatchRate,
            debugLogs: aiResult.debugLogs
          };

          clearInterval(keepAlive);
          controller.enqueue(encoder.encode(JSON.stringify(responsePayload) + '\n'));
          controller.close();
        } catch (error: any) {
          clearInterval(keepAlive);
          console.error("[API] AI Extraction failed:", error);
          try {
            controller.enqueue(encoder.encode(JSON.stringify({ error: error.message || "Erreur interne de l'IA" }) + '\n'));
          } catch (e) {}
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("[API /ai/process] ERROR:", message, error);
    return NextResponse.json(
      { error: "Le traitement par l'IA a échoué. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
