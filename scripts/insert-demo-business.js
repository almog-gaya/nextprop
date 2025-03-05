require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// The demo user ID - replace with the actual ID for almog@gaya.app
// You can find this by looking at the browser's network tab or the Supabase admin console
const USER_ID = '1fba1611-fdc5-438b-8575-34670faafe05'; // Replace with the actual user ID

async function insertDemoBusiness() {
  console.log(`🔧 Creating demo business for user ${USER_ID}...`);
  
  try {
    // First check if a business already exists for this user
    const { data: existingBusinesses, error: queryError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', USER_ID);
    
    if (queryError) {
      console.error('Error checking for existing business:', queryError);
      process.exit(1);
    }
    
    if (existingBusinesses && existingBusinesses.length > 0) {
      console.log('Business already exists for this user. Updating with demo phone number.');
      
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({
          phone_number: '+15551234567',
          custom_twilio_number: '+15551234567'
        })
        .eq('id', existingBusinesses[0].id)
        .select();
      
      if (updateError) {
        console.error('Error updating business:', updateError);
        process.exit(1);
      }
      
      console.log('✅ Business updated with demo phone number:');
      console.log(updatedBusiness);
      return;
    }
    
    // Generate a random UUID for the business ID
    const businessId = randomUUID();
    
    // Try regular insert since the RPC likely doesn't exist
    console.log(`Inserting business with ID ${businessId}...`);
    
    const { data: insertData, error: insertError } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        user_id: USER_ID,
        name: 'Demo Business',
        contact_email: 'almog@gaya.app',
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting business:', insertError);
      process.exit(1);
    }
    
    console.log('✅ Demo business created successfully:');
    console.log(insertData);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

insertDemoBusiness()
  .then(() => {
    console.log('✨ Demo business setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to set up demo business:', err);
    process.exit(1);
  }); 