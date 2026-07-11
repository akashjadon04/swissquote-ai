import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// /api/quotes/[id] — Get, Update, Delete
// ═══════════════════════════════════════════

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('sq_quotes')
    .select('*, sections:sq_quote_sections(*, items:sq_quote_items(*))')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = getServerSupabase();

  const allowedFields = [
    'status', 'client_name', 'client_address', 'client_postal', 'client_city',
    'client_contact', 'building_address', 'apartment_zone', 'subject_line',
    'preferred_supplier', 'canton', 'materials_margin_pct', 'labour_hours',
    'labour_rate', 'travel_fee', 'exclusions', 'technician_name',
    'materials_subtotal', 'materials_margin', 'labour_total', 'subtotal_excl_vat',
    'vat_amount', 'total_incl_vat', 'has_missing_items',
  ];

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  const { data, error } = await supabase
    .from('sq_quotes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/quotes/[id]]', error);
    return NextResponse.json({ error: 'Erreur de mise à jour.' }, { status: 500 });
  }

  await supabase.from('sq_audit_logs').insert({
    entity_type: 'quote',
    entity_id: id,
    action: 'update',
    meta: { fields: Object.keys(updateData) },
  });

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerSupabase();

  // Soft delete: mark as deleted instead of hard delete
  const { error } = await supabase
    .from('sq_quotes')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', id);

  // Hard delete items and sections first for proper cascade
  await supabase.from('sq_quote_items').delete().eq('quote_id', id);
  await supabase.from('sq_quote_sections').delete().eq('quote_id', id);
  await supabase.from('sq_quotes').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Erreur de suppression.' }, { status: 500 });
  }

  await supabase.from('sq_audit_logs').insert({
    entity_type: 'quote',
    entity_id: id,
    action: 'delete',
  });

  return NextResponse.json({ success: true });
}
