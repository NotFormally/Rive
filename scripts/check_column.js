const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  const { data, error } = await supabase
    .from('restaurant_profiles')
    .select('id, logo_url')
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}

checkColumn();
