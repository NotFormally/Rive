const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf-8");
let supabaseUrl = "";
let serviceRoleKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].replace(/"/g, "").trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) serviceRoleKey = line.split("=")[1].replace(/"/g, "").trim();
}

if (!serviceRoleKey) {
  const { execSync } = require("child_process");
  try {
    const output = execSync('npx vercel env pull .env.local > /dev/null 2>&1 && grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d "=" -f2', { stdio: 'pipe' }).toString().trim();
    if (output) serviceRoleKey = output.replace(/"/g, "");
  } catch(e) {}
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
async function run() {
  const { data: profiles } = await supabase.from("restaurant_profiles").select("id, user_id");
  const { data: members, error } = await supabase.from("restaurant_members").select("*");
  if (error) console.error("Error:", error);
  console.log("Profiles count:", profiles ? profiles.length : 0);
  console.log("Members count:", members ? members.length : 0);
  console.log("Members data:", JSON.stringify(members, null, 2));
}
run();
