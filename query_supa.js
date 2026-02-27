const { createClient } = require("@supabase/supabase-js");

// Read SUPABASE_SERVICE_ROLE_KEY from .env.local
const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf-8");
let supabaseUrl = "";
let serviceRoleKey = "";

for (const line of envContent.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].replace(/"/g, "").trim();
  }
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceRoleKey = line.split("=")[1].replace(/"/g, "").trim();
  }
}

// Fallback if SERVICE_ROLE_KEY is not in .env.local, use Vercel CLI via child_process
if (!serviceRoleKey) {
  const { execSync } = require("child_process");
  try {
    const output = execSync('npx vercel env pull .env.local > /dev/null 2>&1 && grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d "=" -f2').toString().trim();
    if (output) {
        serviceRoleKey = output.replace(/"/g, "");
    }
  } catch(e) {}
}


if (!serviceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: members, error: err1 } = await supabase.from("restaurant_members").select("*");
  if (err1) console.error("Error members:", err1);
  console.log("Restaurant Members data:", members);

  const { data: profiles, error: err2 } = await supabase.from("restaurant_profiles").select("*");
  if (err2) console.error("Error profiles:", err2);
  console.log("Restaurant Profiles data:", profiles);
}
run();
