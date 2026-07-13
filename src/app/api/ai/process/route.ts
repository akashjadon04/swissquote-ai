import { NextRequest, NextResponse } from "next/server";
import { extractFromDescription } from "@/lib/gemini";
import { matchArticles } from "@/lib/catalogue-matcher";
import { calculateLabourFromItems, complexityMultiplier } from "@/lib/financial";
import type { AIArticle, CatalogueArticle, SupplierCode } from "@/types/database.types";
import { MOCK_CATALOGUE } from "@/lib/catalogueData";

// POST /api/ai/process — Unified AI + Catalogue Match + Labour Endpoint
// Does AI extraction + catalogue matching + labour calc server-side in one call.

export const maxDuration = 60;
export const runtime = 'edge';

// Adapt catalogue data once at module load (base_price -> unit_price, name -> description)
const CATALOGUE_ADAPTED: CatalogueArticle[] = (MOCK_CATALOGUE as any[]).map((a) => ({
  ...a,
  description: a.description ?? a.name ?? "",
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

    try {
      // Step 1: AI Extraction identifies what materials/work is needed
      const aiResult = await extractFromDescription(description.trim());

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
      
      const totalValidItems = allArticles.filter(a => a.category !== 'autre' && a.category !== 'depose').length;
      const matchedCount = matchResult.matched.length;
      const realMatchRate = totalValidItems > 0 ? (matchedCount / totalValidItems) * 100 : 0;

      const responsePayload = {
        extraction: aiResult.extraction,
        provider: aiResult.provider,
        matchResult,
        labourHours: calculatedLabourHours,
        labourComplexity: complexity,
        labourMultiplier: multiplier,
        realMatchRate
      };

      return NextResponse.json(responsePayload);
    } catch (error: any) {
      console.error("[API] AI Extraction failed:", error);
      return NextResponse.json(
        { error: error.message || "Erreur interne de l'IA" },
        { status: 500 }
      );
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("[API /ai/process] ERROR:", message, error);
    return NextResponse.json(
      { error: "Le traitement par l'IA a échoué. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
