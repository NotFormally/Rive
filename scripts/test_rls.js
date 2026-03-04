const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Try to login as the user to test RLS
  const { data: { session }, error: signinError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com', // we don't have the user's password, we can't test RLS this easily
  });
}
