import { createClient } from '@supabase/supabase-js';

// Admin client using SERVICE_ROLE key (server-side only, bypasses RLS)
export function supabaseAdmin<Database = any>() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env variable');
  
  return createClient<Database>(url, serviceKey);
}

