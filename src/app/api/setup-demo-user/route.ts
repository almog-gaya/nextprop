import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This API route is used to set up a demo business for testing
export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json();
    
    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
    }
    
    // Check if this is the demo user
    if (email !== 'almog@gaya.app') {
      return NextResponse.json(
        { error: "Not authorized to create demo accounts" },
        { status: 403 }
      );
    }
    
    // Check if the user already has a business
    const { data: existingBusiness, error: queryError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error checking for existing business:', queryError);
      return NextResponse.json(
        { error: "Failed to check for existing business" },
        { status: 500 }
      );
    }
    
    // If business exists but doesn't have a phone number, update it
    if (existingBusiness) {
      if (!existingBusiness.phone_number || !existingBusiness.custom_twilio_number) {
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
          return NextResponse.json(
            { error: "Failed to update business" },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "Demo business updated", 
          business: updatedBusiness 
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Demo business already exists", 
        business: existingBusiness 
      });
    }
    
    // Create a new business for the user with a demo phone number
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: 'Demo Business',
        contact_email: email,
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567',
        user_id: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating business:', insertError);
      return NextResponse.json(
        { error: "Failed to create business" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Demo business created", 
      business: newBusiness 
    });
  } catch (error: any) {
    console.error('Error creating demo business:', error);
    return NextResponse.json(
      { error: error.message || "Failed to create demo business" },
      { status: 500 }
    );
  }
} 