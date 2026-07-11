import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// POST /api/quotes/[id]/duplicate
// ═══════════════════════════════════════════

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerSupabase();

  // Fetch original quote with all data
  const { data: original, error: fetchError } = await supabase
    .from('sq_quotes')
    .select('*, sections:sq_quote_sections(*, items:sq_quote_items(*))')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 });
  }

  const { data: quoteNumber, error: rpcError } = await supabase.rpc('generate_next_quote_number');
  if (rpcError || !quoteNumber) {
    return NextResponse.json({ error: 'Erreur de génération du numéro de devis' }, { status: 500 });
  }

  // Create duplicate
  const { id: _id, created_at, updated_at, ...quoteData } = original;

  const { data: newQuote, error: createError } = await supabase
    .from('sq_quotes')
    .insert({
      ...quoteData,
      quote_number: quoteNumber,
      status: 'draft',
    })
    .select()
    .single();

  if (createError || !newQuote) {
    return NextResponse.json({ error: 'Erreur de duplication.' }, { status: 500 });
  }

  // Duplicate sections and items
  for (const section of original.sections || []) {
    const { items, id: sectionId, ...sectionData } = section;

    const { data: newSection } = await supabase
      .from('sq_quote_sections')
      .insert({ ...sectionData, quote_id: newQuote.id })
      .select()
      .single();

    if (newSection && items) {
      const newItems = items.map(({ id: _itemId, ...item }: Record<string, unknown>) => ({
        ...item,
        quote_id: newQuote.id,
        section_id: newSection.id,
      }));
      await supabase.from('sq_quote_items').insert(newItems);
    }
  }

  await supabase.from('sq_audit_logs').insert({
    entity_type: 'quote',
    entity_id: newQuote.id,
    action: 'duplicate',
    meta: { original_id: id, quote_number: quoteNumber },
  });

  return NextResponse.json(newQuote, { status: 201 });
}
