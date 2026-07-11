const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to insert a supplier
  const { data, error } = await supabase.from('sq_suppliers').upsert({ code: 'NSB', name: 'Nussbaum', active: true }).select();
  if (error) {
    console.error('Supabase RLS error:', error.message);
  } else {
    console.log('Success!', data);
  }
}
run();
