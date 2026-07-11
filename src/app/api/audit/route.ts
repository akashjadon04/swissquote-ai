import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '30');
  const supabase = getServerSupabase();

  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from('sq_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 });
  return NextResponse.json({ data: data || [], total: count || 0, page, pageSize });
}
