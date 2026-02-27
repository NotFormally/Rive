const { Client } = require("pg");
const fs = require("fs");

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.vjvvoabwtwnfwwqxhtfj:ShoreRive2025*!@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
  });
  
  await client.connect();
  console.log("Connected to DB");
  
  const sql = fs.readFileSync("/Users/nassim/Shore/supabase/migrations/migration_v16_team_members.sql", "utf8");
  await client.query(sql);
  
  console.log("Migration executed successfully!");
  await client.end();
}

run().catch(console.error);
