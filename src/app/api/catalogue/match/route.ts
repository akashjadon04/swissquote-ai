import { NextRequest, NextResponse } from 'next/server';
import { matchArticles } from '@/lib/catalogue-matcher';
import type { AIArticle, SupplierCode } from '@/types/database.types';
import { MOCK_CATALOGUE } from '@/lib/catalogueData';

// ═══════════════════════════════════════════
// POST /api/catalogue/match — Catalogue Matching Endpoint
// ═══════════════════════════════════════════

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

    // Run matching
    const result = matchArticles(articles, MOCK_CATALOGUE as any, preferredSupplier);

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
