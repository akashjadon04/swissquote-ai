import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────
// SwissQuote AI — Supabase Client Singletons
// Using `any` for Database generic to avoid generated-types coupling.
// All table access is via runtime string names (sq_*).
// ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serverClient: SupabaseClient<any> | null = null;

/** Server-side client — uses service role key when available (API routes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getServerSupabase(): SupabaseClient<any> {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error('Supabase URL / key not configured in environment variables.');
  }

  serverClient = createClient<any>(url, key, { // eslint-disable-line @typescript-eslint/no-explicit-any
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: SupabaseClient<any> | null = null;

/** Browser-side client — uses anon key (client components). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBrowserSupabase(): SupabaseClient<any> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error('Supabase public URL / anon key not configured.');
  }

  browserClient = createClient<any>(url, key); // eslint-disable-line @typescript-eslint/no-explicit-any
  return browserClient;
}
