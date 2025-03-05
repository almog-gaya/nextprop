import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }
    
    // Create a direct Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query for almog@gaya.app businesses directly
    const { data: emailBusinesses, error: emailError } = await supabase
      .from('businesses')
      .select('*')
      .eq('contact_email', 'almog@gaya.app');
    
    if (emailError) {
      console.error('Error querying businesses by email:', emailError);
      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      );
    }
    
    // Query for user ID 1fba1611-fdc5-438b-8575-34670faafe05
    const userId = '1fba1611-fdc5-438b-8575-34670faafe05';
    const { data: userBusinesses, error: userError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);
    
    if (userError) {
      console.error('Error querying businesses by user ID:', userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }
    
    // Return both sets of businesses
    return NextResponse.json({ 
      byEmail: emailBusinesses, 
      byUserId: userBusinesses,
      message: "If either array is empty, your application can't find the business records"
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to debug businesses" },
      { status: 500 }
    );
  }
} 