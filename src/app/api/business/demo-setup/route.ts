import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// A simple endpoint to set up a demo business for almog@gaya.app
// This doesn't rely on RPC or admin permissions
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    
    // First check if user already has a business
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);
    
    if (businessError) {
      console.error('Error checking for business:', businessError);
      return NextResponse.json(
        { error: "Failed to check for existing business" },
        { status: 500 }
      );
    }
    
    // If user already has a business, update it
    if (businesses && businesses.length > 0) {
      console.log(`Updating existing business for user ${userId}`);
      
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({
          phone_number: '+15551234567',
          custom_twilio_number: '+15551234567'
        })
        .eq('id', businesses[0].id)
        .select();
      
      if (updateError) {
        console.error('Error updating business:', updateError);
        return NextResponse.json(
          { error: "Failed to update business" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Demo business updated',
        business: updatedBusiness
      });
    }
    
    // Create new business for user
    console.log(`Creating new business for user ${userId}`);
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        id: randomUUID(),
        user_id: userId,
        name: 'Demo Business',
        contact_email: 'almog@gaya.app',
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567'
      })
      .select();
    
    if (insertError) {
      console.error('Error creating business:', insertError);
      return NextResponse.json(
        { error: "Failed to create business" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demo business created',
      business: newBusiness
    });
  } catch (error: any) {
    console.error('Error in demo-setup:', error);
    return NextResponse.json(
      { error: error.message || "Failed to set up demo business" },
      { status: 500 }
    );
  }
} 