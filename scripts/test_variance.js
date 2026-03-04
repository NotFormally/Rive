const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vjvvoabwtwnfwwqxhtfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqdnZvYWJ3dHduZnd3cXhodGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyOTkyOCwiZXhwIjoyMDg3MjA1OTI4fQ.Qkew5i2jg4BBJb_lUspUIOFbKPr31f43usQZY7MmWBM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
      .from('variance_logs')
      .select('*, ingredients(name, category, unit)')
      .limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
