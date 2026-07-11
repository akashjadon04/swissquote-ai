import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('sq_clients')
    .update({
      name: body.name,
      address: body.address || null,
      postal: body.postal || null,
      city: body.city || null,
      contact_person: body.contact_person || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Erreur de mise à jour.' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerSupabase();
  await supabase.from('sq_clients').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
