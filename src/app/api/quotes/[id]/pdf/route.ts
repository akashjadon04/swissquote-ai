import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { generateQuotePDF } from '@/lib/pdf-generator';

// ═══════════════════════════════════════════
// GET /api/quotes/[id]/pdf — Generate & stream PDF
// ═══════════════════════════════════════════

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = getServerSupabase();

  const { data: quote, error } = await supabase
    .from('sq_quotes')
    .select('*, sections:sq_quote_sections(*, items:sq_quote_items(*))')
    .eq('id', id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 });
  }

  try {
    const pdfBuffer = await generateQuotePDF(quote);

    const filename = `Devis_${quote.quote_number.replace(/\//g, '-')}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur génération PDF';
    console.error('[PDF] Generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
