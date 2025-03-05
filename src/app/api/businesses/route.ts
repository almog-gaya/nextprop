import { NextRequest, NextResponse } from 'next/server';
import { registerBusinessVerification, getAllBusinesses } from '@/lib/business-verify';

/**
 * GET /api/businesses - Get all businesses
 */
export async function GET() {
  try {
    const businesses = await getAllBusinesses();
    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/businesses - Create a new business
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.contact_email || !data.phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contact_email, and phone_number are required' },
        { status: 400 }
      );
    }

    // Register the business with verification capabilities
    const business = await registerBusinessVerification(data);
    
    return NextResponse.json({ business }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create business' },
      { status: 500 }
    );
  }
} 