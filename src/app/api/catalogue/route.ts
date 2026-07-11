import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// /api/catalogue — Catalogue Articles CRUD
// ═══════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const supplierId = url.searchParams.get('supplierId');
    const supplierCode = url.searchParams.get('supplierCode');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

    const supabase = getServerSupabase();

    let query = supabase
      .from('sq_catalogue_articles')
      .select('*, supplier:sq_suppliers(*)', { count: 'exact' })
      .eq('active', true);

    if (supplierId) query = query.eq('supplier_id', supplierId);
    if (category) query = query.eq('category', category);
    if (search) {
      query = query.or(
        `reference.ilike.%${search}%,description.ilike.%${search}%,specification.ilike.%${search}%`
      );
    }

    if (supplierCode) {
      const { data: supplier } = await supabase
        .from('sq_suppliers')
        .select('id')
        .eq('code', supplierCode)
        .single();
      if (supplier?.id) {
        query = query.eq('supplier_id', supplier.id);
      }
    }

    query = query.order('category').order('specification');

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Erreur de base de données.' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
