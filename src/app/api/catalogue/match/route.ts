import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { matchArticles } from '@/lib/catalogue-matcher';
import type { AIArticle, SupplierCode } from '@/types/database.types';

// ═══════════════════════════════════════════
// POST /api/catalogue/match — Catalogue Matching Endpoint
// ═══════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Fetch full catalogue with supplier data
    const supabase = getServerSupabase();
    const { data: catalogue, error } = await supabase
      .from('sq_catalogue_articles')
      .select('*, supplier:sq_suppliers(*)')
      .eq('active', true);

    if (error) {
      console.error('[API /catalogue/match] DB error:', error);
      return NextResponse.json(
        { error: 'Erreur de base de données.' },
        { status: 500 }
      );
    }

    // Run matching
    const result = matchArticles(articles, catalogue || [], preferredSupplier);

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
