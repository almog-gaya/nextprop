// This script directly inserts a business record for almog@gaya.app
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Initialize Supabase client with anon key (we'll use direct insert)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// The user ID we want to create the business for
const USER_ID = '1fba1611-fdc5-438b-8575-34670faafe05'; // User ID for almog@gaya.app

async function insertBusiness() {
  console.log(`🔧 Inserting business for user ${USER_ID}`);
  
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
      console.log('Business already exists for this user. Updating with required fields.');
      
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({
          name: 'almog',
          contact_email: 'almog@gaya.app',
          phone_number: '+15551234567',
          custom_twilio_number: '+15551234567',
          status: 'verified',
          verification_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBusinesses[0].id)
        .select();
      
      if (updateError) {
        console.error('Error updating business:', updateError);
        process.exit(1);
      }
      
      console.log('✅ Business updated with phone number:');
      console.log(updatedBusiness);
      return;
    }
    
    // If no business exists, create a new one
    const businessId = randomUUID();
    console.log(`Creating new business with ID ${businessId}`);
    
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        user_id: USER_ID,
        name: 'almog',
        contact_email: 'almog@gaya.app',
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567',
        status: 'verified',
        verification_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('Error creating business:', insertError);
      
      // If error is about permissions
      if (insertError.code === '42501') {
        console.error('This is a permissions error. You might need to disable Row Level Security (RLS) temporarily.');
        console.log('SQL to disable RLS: ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Business created successfully with phone number:');
    console.log(newBusiness);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

insertBusiness()
  .then(() => {
    console.log('✨ Business setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to set up business:', err);
    process.exit(1);
  }); 