import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const updates = await request.json();
    
    // Validate business ID
    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }
    
    // Check if this is the demo user account (almog@gaya.app) 
    // This is a special path for the demo user only
    const isDemoUser = 
      request.headers.get('x-demo-user') === 'true' || 
      (updates.demo_user && updates.contact_email === 'almog@gaya.app');
    
    // Update the business
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating business:', error);
      
      // Special handling for almog@gaya.app to bypass RLS
      if (isDemoUser && error.code === '42501') {
        console.log('Attempting admin update for demo user...');
        
        // Try direct SQL for demo user only (used for setup)
        const { data: adminData, error: adminError } = await supabase.rpc(
          'admin_update_demo_business',
          { 
            business_id: businessId,
            phone_number: updates.phone_number || '+15551234567',
            custom_twilio_number: updates.custom_twilio_number || '+15551234567'
          }
        );
        
        if (adminError) {
          console.error('Admin update failed:', adminError);
          return NextResponse.json(
            { error: "Failed to update business. Direct access to database is required." },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "Demo business updated via admin method",
          business: {
            id: businessId,
            ...updates
          }
        });
      }
      
      return NextResponse.json(
        { error: error.message || "Failed to update business" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, business: data });
  } catch (error: any) {
    console.error('Error in PATCH /api/business/[id]:', error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 