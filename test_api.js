require('dotenv').config({ path: '/Users/nassim/Shore/.env.local' });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

let srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!srk) {
   const envContent = fs.readFileSync("/Users/nassim/Shore/.env.local", "utf-8");
   for (const line of envContent.split("\n")) {
      if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) srk = line.split("=")[1].replace(/"/g, "").trim();
   }
}

if (!srk) {
  const { execSync } = require('child_process');
  try {
     const output = execSync('npx vercel env pull .env.local > /dev/null 2>&1 && grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d "=" -f2').toString().trim();
     srk = output.replace(/"/g, "");
  } catch(e) {}
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, srk);

async function run() {
  const { data: p } = await supabase.from('restaurant_profiles').select('*');
  console.log("Profiles count:", p ? p.length : 0);
  if (p && p.length > 0) {
    console.log("Inserting owner for user:", p[0].user_id, "restaurant:", p[0].id);
    const { data: insertData, error } = await supabase.from('restaurant_members').insert({
       restaurant_id: p[0].id,
       user_id: p[0].user_id,
       role: 'owner',
       accepted_at: new Date().toISOString()
    }).select();
    
    if(error) console.error("Insert error:", error);
    else console.log("Insert success:", insertData);
  }
}
run();
