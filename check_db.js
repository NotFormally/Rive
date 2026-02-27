require('dotenv').config({ path: '/Users/nassim/Shore/.env.local' });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: members, error } = await supabase.from("restaurant_members").select("*");
  if (error) console.error("Error:", error);
  console.log("Members count:", members ? members.length : 0);
  console.log("Members data:", JSON.stringify(members, null, 2));
}
run();
