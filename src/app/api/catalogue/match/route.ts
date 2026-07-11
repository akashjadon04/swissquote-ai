import { NextRequest, NextResponse } from 'next/server';
import { matchArticles } from '@/lib/catalogue-matcher';
import type { AIArticle, CatalogueArticle, SupplierCode } from '@/types/database.types';
import { MOCK_CATALOGUE } from '@/lib/catalogueData';

// ═══════════════════════════════════════════
// POST /api/catalogue/match — Catalogue Matching Endpoint
// ═══════════════════════════════════════════

// Adapt MOCK_CATALOGUE's field names (base_price, name) to the
// CatalogueArticle interface (unit_price, description) expected by the matcher.
// This is the only place we need to adapt — the matcher always reads unit_price + description.
const CATALOGUE_ADAPTED: CatalogueArticle[] = (MOCK_CATALOGUE as any[]).map((a) => ({
  ...a,
  description: a.description ?? a.name ?? '',
  unit_price: typeof a.unit_price === 'number' ? a.unit_price : (a.base_price ?? 0),
  supplier_id: a.supplier_id ?? a.supplier?.code ?? '',
  created_at: a.created_at ?? '',
  updated_at: a.updated_at ?? '',
}));

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }
    const { articles, preferredSupplier } = body as {
      articles: AIArticle[];
      preferredSupplier?: SupplierCode;
    };

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'Articles requis (tableau non vide).' },
        { status: 400 }
      );
    }

    // Run matching against adapted catalogue
    const result = matchArticles(articles, CATALOGUE_ADAPTED, preferredSupplier);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[API /catalogue/match] Error:', message);
    return NextResponse.json(
      { error: `Correspondance échouée: ${message}` },
      { status: 500 }
    );
  }
}
