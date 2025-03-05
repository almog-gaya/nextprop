// Debug script to check business records
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBusinessRecords() {
  try {
    console.log('🔍 Checking business records in the database...');
    
    // Query for the specific user's businesses
    const userId = '1fba1611-fdc5-438b-8575-34670faafe05';
    const { data: userBusinesses, error: userError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);
    
    if (userError) {
      console.error('Error querying user businesses:', userError);
      return;
    }
    
    console.log(`Found ${userBusinesses.length} businesses for user ${userId}:`);
    console.log(JSON.stringify(userBusinesses, null, 2));
    
    // Query for all businesses with email almog@gaya.app
    const { data: emailBusinesses, error: emailError } = await supabase
      .from('businesses')
      .select('*')
      .eq('contact_email', 'almog@gaya.app');
    
    if (emailError) {
      console.error('Error querying email businesses:', emailError);
      return;
    }
    
    console.log(`Found ${emailBusinesses.length} businesses with contact_email almog@gaya.app:`);
    console.log(JSON.stringify(emailBusinesses, null, 2));
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugBusinessRecords(); 