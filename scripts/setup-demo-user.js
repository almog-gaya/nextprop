require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDemoUser() {
  console.log('🔧 Setting up demo user...');
  
  try {
    // Find the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error finding users:', userError);
      process.exit(1);
    }
    
    const demoUser = users.find(u => u.email === 'almog@gaya.app');
    
    if (!demoUser) {
      console.log('Demo user not found. Creating a new user...');
      
      // Create a new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'almog@gaya.app',
        password: 'demo123456',
        email_confirm: true
      });
      
      if (createError) {
        console.error('Error creating demo user:', createError);
        process.exit(1);
      }
      
      console.log('✅ Demo user created successfully');
      demoUser = newUser;
    } else {
      console.log('✅ Demo user found');
    }
    
    // Check if the user already has a business
    const { data: existingBusiness, error: queryError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', demoUser.id)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error checking for existing business:', queryError);
      process.exit(1);
    }
    
    // If business exists but doesn't have a phone number, update it
    if (existingBusiness) {
      if (!existingBusiness.phone_number || !existingBusiness.custom_twilio_number) {
        console.log('Updating existing business with demo phone number...');
        
        const { data: updatedBusiness, error: updateError } = await supabase
          .from('businesses')
          .update({
            phone_number: '+15551234567',
            custom_twilio_number: '+15551234567'
          })
          .eq('id', existingBusiness.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating business:', updateError);
          process.exit(1);
        }
        
        console.log('✅ Demo business updated successfully');
        console.log(updatedBusiness);
        return;
      }
      
      console.log('✅ Demo business already exists with phone number');
      console.log(existingBusiness);
      return;
    }
    
    // Create a new business for the user with a demo phone number
    console.log('Creating new business for demo user...');
    
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: 'Demo Business',
        contact_email: 'almog@gaya.app',
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567',
        user_id: demoUser.id
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating business:', insertError);
      process.exit(1);
    }
    
    console.log('✅ Demo business created successfully');
    console.log(newBusiness);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupDemoUser()
  .then(() => {
    console.log('✨ Demo setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to set up demo user:', err);
    process.exit(1);
  }); 