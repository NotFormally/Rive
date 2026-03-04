const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: users, error: ue } = await supabase.auth.admin ? await supabase.auth.admin.listUsers() : { data: { users: [] }, error: null };
  if(ue) console.log("User error", ue);
  
  // just search by email or whatever the user is
  // or query all restaurant settings
  const { data: settings, error: se } = await supabase.from('restaurant_settings').select('*').limit(5);
  console.log("Settings limit 5:", settings);
  if(se) console.log("Error:", se);
}
check();
