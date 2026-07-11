import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// /api/config — Configuration CRUD
// ═══════════════════════════════════════════

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('sq_configurations')
      .select('*')
      .order('key');

    if (error) {
      return NextResponse.json({ error: 'Erreur de base de données.' }, { status: 500 });
    }

    const configMap: Record<string, unknown> = {};
    for (const item of data || []) {
      configMap[item.key] = item.value;
    }

    return NextResponse.json({ config: configMap, raw: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Clé et valeur requises.' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('sq_configurations')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erreur de mise à jour.' }, { status: 500 });
    }

    await supabase.from('sq_audit_logs').insert({
      entity_type: 'config',
      entity_id: data.id,
      action: 'update',
      meta: { key, value },
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
