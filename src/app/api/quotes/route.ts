import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// /api/quotes — Quote List + Create
// ═══════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const supabase = getServerSupabase();

    let query = supabase
      .from('sq_quotes')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(
        `quote_number.ilike.%${search}%,client_name.ilike.%${search}%,building_address.ilike.%${search}%,original_description.ilike.%${search}%`
      );
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[API /quotes GET]', error);
      return NextResponse.json({ error: 'Erreur de base de données.' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServerSupabase();

    // Get next quote number
    const { data: config } = await supabase
      .from('sq_configurations')
      .select('value')
      .eq('key', 'quote_counter')
      .single();

    const counter = parseInt(String(config?.value || '21648')) + 1;
    const quoteNumber = `${counter}/AL/jf`;

    await supabase
      .from('sq_configurations')
      .update({ value: String(counter) })
      .eq('key', 'quote_counter');

    const { data: user } = await supabase
      .from('sq_users')
      .select('id')
      .eq('role', 'technician')
      .limit(1)
      .single();

    const { data: companyConfig } = await supabase
      .from('sq_configurations')
      .select('value')
      .eq('key', 'company_info')
      .single();

    const companyInfo = companyConfig?.value as Record<string, string> | null;

    const { data: quote, error } = await supabase
      .from('sq_quotes')
      .insert({
        quote_number: quoteNumber,
        status: body.status || 'draft',
        created_by: user?.id,
        client_id: body.clientId || null,
        client_name: body.clientName || null,
        client_address: body.clientAddress || null,
        client_postal: body.clientPostal || null,
        client_city: body.clientCity || null,
        client_contact: body.clientContact || null,
        building_address: body.buildingAddress || null,
        apartment_zone: body.apartmentZone || null,
        subject_line: body.subjectLine || null,
        original_description: body.description,
        ai_extraction: body.aiExtraction || null,
        ai_provider: body.aiProvider || null,
        intervention_type: body.interventionType || null,
        technical_summary: body.technicalSummary || null,
        ai_confidence: body.aiConfidence || null,
        preferred_supplier: body.preferredSupplier || 'NSB',
        materials_subtotal: body.materialsSubtotal || null,
        materials_margin_pct: body.materialsMarginPct || 15,
        materials_margin: body.materialsMargin || null,
        labour_hours: body.labourHours || null,
        labour_rate: body.labourRate || null,
        labour_total: body.labourTotal || null,
        travel_fee: body.travelFee || null,
        subtotal_excl_vat: body.subtotalExclVat || null,
        vat_rate: body.vatRate || 0.081,
        vat_amount: body.vatAmount || null,
        total_incl_vat: body.totalInclVat || null,
        canton: body.canton || 'Genève',
        has_missing_items: body.hasMissingItems || false,
        exclusions: body.exclusions || null,
        company_name: companyInfo?.name || 'SwissQuote AI',
        company_address: companyInfo?.address
          ? `${companyInfo.address}, ${companyInfo.postal} ${companyInfo.city}`
          : null,
        technician_name: body.technicianName || 'Alec Landenberg',
      })
      .select()
      .single();

    if (error) {
      console.error('[API /quotes POST]', error);
      return NextResponse.json({ error: 'Erreur de création du devis.' }, { status: 500 });
    }

    if (body.sections && Array.isArray(body.sections)) {
      for (const section of body.sections) {
        const { data: dbSection } = await supabase
          .from('sq_quote_sections')
          .insert({
            quote_id: quote.id,
            section_code: section.sectionCode || null,
            section_label: section.sectionLabel || null,
            description: section.description || null,
            sort_order: section.sortOrder || 0,
          })
          .select()
          .single();

        if (dbSection && section.items && Array.isArray(section.items)) {
          const items = section.items.map((item: Record<string, unknown>, idx: number) => ({
            quote_id: quote.id,
            section_id: dbSection.id,
            catalogue_article_id: item.catalogueArticleId || null,
            supplier_id: item.supplierId || null,
            reference: item.reference || null,
            description: item.description,
            specification: item.specification || null,
            quantity: item.quantity,
            unit: item.unit || 'p',
            unit_price: item.unitPrice || null,
            line_total: item.lineTotal || null,
            ai_label: item.aiLabel || null,
            ai_confidence: item.aiConfidence || null,
            is_missing: item.isMissing || false,
            is_manually_added: item.isManuallyAdded || false,
            sort_order: idx,
          }));
          await supabase.from('sq_quote_items').insert(items);
        }
      }
    }

    await supabase.from('sq_audit_logs').insert({
      entity_type: 'quote',
      entity_id: quote.id,
      action: 'create',
      actor_id: user?.id,
      meta: { quote_number: quoteNumber },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[API /quotes POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
