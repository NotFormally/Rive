const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }
  
  const user = users.users.find(u => u.email === 'nassim@rivehub.com') || users.users[0];
  console.log("Checking for user:", user?.email, user?.id);
  
  if (!user) return;

  const { data: membership, error: memError } = await supabase
    .from('restaurant_members')
    .select('*')
    .eq('user_id', user.id);
    
  console.log("Memberships:", membership);

  if (membership && membership.length > 0) {
    const { data: profile, error: profError } = await supabase
      .from('restaurant_profiles')
      .select('*')
      .eq('id', membership[0].restaurant_id);
    console.log("Profile:", profile);
  }
}

checkProfile();
