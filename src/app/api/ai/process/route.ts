import { NextRequest, NextResponse } from 'next/server';
import { extractFromDescription } from '@/lib/gemini';
import { matchArticles } from '@/lib/catalogue-matcher';
import type { AIArticle, CatalogueArticle, SupplierCode } from '@/types/database.types';
import { MOCK_CATALOGUE } from '@/lib/catalogueData';

// ═══════════════════════════════════════════
// POST /api/ai/process — Unified AI + Match Endpoint
// Does AI extraction + catalogue matching server-side in one call.
// Eliminates 2→1 round trips from the client, saving 5-10s latency.
// ═══════════════════════════════════════════

export const maxDuration = 60;

// Adapt catalogue data once at module load (base_price → unit_price, name → description)
const CATALOGUE_ADAPTED: CatalogueArticle[] = (MOCK_CATALOGUE as any[]).map((a) => ({
  ...a,
  description: a.description ?? a.name ?? '',
  unit_price: typeof a.unit_price === 'number' ? a.unit_price : (a.base_price ?? 0),
  supplier_id: a.supplier_id ?? a.supplier?.code ?? '',
  created_at: a.created_at ?? '',
  updated_at: a.updated_at ?? '',
}));

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter.' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    const { description, preferredSupplier } = body as {
      description: string;
      preferredSupplier?: SupplierCode;
    };

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description requise (min 10 caractères).' }, { status: 400 });
    }
    if (description.length > 10_000) {
      return NextResponse.json({ error: 'Description trop longue (max 10 000 caractères).' }, { status: 400 });
    }

    const startTime = Date.now();

    // ── Step 1: AI Extraction ──
    // The AI identifies what materials/work is needed using plumbing knowledge.
    // It NEVER outputs references or prices — only semantic descriptions.
    const aiResult = await extractFromDescription(description.trim());

    // ── Step 2: Catalogue Matching (runs server-side, no extra round-trip) ──
    // Only a matched catalogue reference gets a price. No match = flagged missing.
    const allArticles: AIArticle[] = aiResult.extraction.sections.flatMap(s => s.articles);
    const matchResult = matchArticles(allArticles, CATALOGUE_ADAPTED, preferredSupplier);

    return NextResponse.json({
      extraction: aiResult.extraction,
      provider: aiResult.provider,
      matchResult,
      processingTimeMs: Date.now() - startTime,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[API /ai/process] ERROR:', message, error);
    return NextResponse.json(
      { error: 'Le traitement par l\'IA a échoué. Veuillez réessayer.' },
      { status: 502 }
    );
  }
}
