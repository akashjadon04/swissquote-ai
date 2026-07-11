import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const supabase = getServerSupabase();

  let query = supabase.from('sq_clients').select('*', { count: 'exact' }).order('name');
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 });
  return NextResponse.json({ data: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }
  const supabase = getServerSupabase();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sq_clients')
    .insert({
      name: body.name.trim(),
      address: body.address || null,
      postal: body.postal || null,
      city: body.city || null,
      contact_person: body.contact_person || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Erreur de création.' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
