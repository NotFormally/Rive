import { createClient } from '@supabase/supabase-js';

// Singleton admin client using SERVICE_ROLE key (server-side only, bypasses RLS)
let _admin: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env variable');
    _admin = createClient(url, serviceKey);
  }
  return _admin;
}

