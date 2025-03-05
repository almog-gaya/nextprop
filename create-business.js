// Script to create a business record directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Uses service key to bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables. Make sure SUPABASE_SERVICE_ROLE_KEY is defined.');
  console.error('You can find this key in your Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Create a Supabase client with the service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBusinessRecord() {
  try {
    console.log('🔧 Creating business record...');
    
    const userId = '1fba1611-fdc5-438b-8575-34670faafe05';
    const businessId = '3a541cbd-2a17-4a28-b384-448f1ce8cf32'; // A fixed ID for reproducibility
    
    const businessData = {
      id: businessId,
      name: 'Almog Business',
      contact_email: 'almog@gaya.app',
      phone_number: '+15551234567',
      custom_twilio_number: '+15551234567',
      status: 'verified',
      verified_at: new Date().toISOString(),
      user_id: userId
    };
    
    // First check if the business already exists
    const { data: existingBusiness, error: checkError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .eq('id', businessId);
    
    if (checkError) {
      console.error('Error checking existing business:', checkError);
      return;
    }
    
    // If business exists, update it
    if (existingBusiness && existingBusiness.length > 0) {
      console.log(`Business with ID ${businessId} already exists, updating...`);
      
      const { data, error } = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', businessId)
        .select();
      
      if (error) {
        console.error('Error updating business:', error);
        return;
      }
      
      console.log('Business updated successfully:', data);
      return;
    }
    
    // Otherwise create a new business
    console.log(`Creating new business with ID ${businessId}...`);
    const { data, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select();
    
    if (error) {
      console.error('Error creating business:', error);
      console.log('This error might be related to Row Level Security (RLS). The script is attempting to use the service role key to bypass this.');
      return;
    }
    
    console.log('Business created successfully:', data);
  } catch (error) {
    console.error('Error in createBusinessRecord:', error);
  }
}

createBusinessRecord(); 