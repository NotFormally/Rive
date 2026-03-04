const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupLogoFeature() {
  console.log("Setting up logo feature...");
  
  // 1. Create storage bucket
  const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
  
  if (getBucketsError) {
    console.error("Error fetching buckets:", getBucketsError);
    return;
  }
  
  const bucketExists = buckets.find(b => b.name === 'restaurant-logos');
  
  if (!bucketExists) {
    const { data: bucketData, error: createBucketError } = await supabase.storage.createBucket('restaurant-logos', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (createBucketError) {
      console.error("Error creating bucket:", createBucketError);
    } else {
      console.log("Created bucket: restaurant-logos");
    }
  } else {
    console.log("Bucket already exists: restaurant-logos");
  }

  // 2. Add column since we can't run DDL easily via service role unless we use RPC
  // Wait, if we use the service role key, we can't run arbitrary SQL for DDL. We can only do DML or call RPCs.
  // Wait, RPC might not exist for executing query. But wait, can we update the profile via pg or postgres directly?
  // I'll print the SQL to verify.
}

setupLogoFeature();
