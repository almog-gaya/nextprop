import { NextRequest, NextResponse } from 'next/server';
import { getBusinessById } from '@/lib/business-verify';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/businesses/[id] - Get a business by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const business = await getBusinessById(businessId);
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/businesses/[id] - Update a business
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const data = await request.json();
    
    // Check if business exists
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Update the business
    const { data: updatedBusiness, error } = await supabase
      .from('twilio.businesses')
      .update({
        name: data.name,
        contact_email: data.contact_email,
        phone_number: data.phone_number,
        active: data.active
      })
      .eq('id', businessId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update business: ${error.message}`);
    }
    
    return NextResponse.json({ business: updatedBusiness });
  } catch (error: any) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update business' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/businesses/[id] - Delete a business
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    
    // Check if business exists
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Delete the business
    const { error } = await supabase
      .from('twilio.businesses')
      .delete()
      .eq('id', businessId);
    
    if (error) {
      throw new Error(`Failed to delete business: ${error.message}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete business' },
      { status: 500 }
    );
  }
}

// In a real implementation, you would also add PUT and DELETE endpoints
// for updating and deleting businesses 