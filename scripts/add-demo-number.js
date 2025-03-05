require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// The demo user email
const DEMO_EMAIL = 'almog@gaya.app';

async function addDemoPhoneNumber() {
  console.log(`🔧 Adding demo phone number for ${DEMO_EMAIL}...`);
  
  try {
    // First, check if the user exists by trying to get their business
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('contact_email', DEMO_EMAIL);
    
    if (businessError) {
      console.error('Error checking for existing business:', businessError);
      process.exit(1);
    }
    
    if (businesses && businesses.length > 0) {
      // Update the existing business with the demo phone number
      console.log('Updating existing business with demo phone number...');
      
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({
          phone_number: '+15551234567',
          custom_twilio_number: '+15551234567'
        })
        .eq('id', businesses[0].id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating business:', updateError);
        process.exit(1);
      }
      
      console.log('✅ Demo phone number added successfully');
      console.log(updatedBusiness);
      return;
    }
    
    // If no business found, we'll need the user ID to create one
    console.log('No existing business found. Checking for user...');
    
    // Get the current session to find user ID
    // Note: This requires you to be signed in as the user when running the script
    const { data: session } = await supabase.auth.getSession();
    
    if (!session || !session.session || !session.session.user) {
      console.error('No active session. Please sign in first with the almog@gaya.app account.');
      process.exit(1);
    }
    
    const userId = session.session.user.id;
    
    // Create a new business for the user with a demo phone number
    console.log(`Creating new business for user ${userId}...`);
    
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: 'Demo Business',
        contact_email: DEMO_EMAIL,
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567',
        user_id: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating business:', insertError);
      process.exit(1);
    }
    
    console.log('✅ Demo business created successfully with phone number');
    console.log(newBusiness);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

addDemoPhoneNumber()
  .then(() => {
    console.log('✨ Demo phone number setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to add demo phone number:', err);
    process.exit(1);
  }); 