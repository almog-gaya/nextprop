import { NextRequest, NextResponse } from 'next/server';
import { checkBusinessVerification } from '@/lib/business-verify';

/**
 * POST /api/businesses/[id]/verify/check
 * Check a verification code for a business
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const { phoneNumber, code } = await request.json();
    
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }
    
    const result = await checkBusinessVerification(businessId, phoneNumber, code);
    
    return NextResponse.json({
      valid: result.valid,
      status: result.status
    });
  } catch (error: any) {
    console.error('Error checking verification:', error);
    
    // Handle specific errors
    if (error.message === 'Business not found') {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    if (error.message === 'No verification attempt found') {
      return NextResponse.json(
        { error: 'No verification attempt found for this phone number' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to check verification' },
      { status: 500 }
    );
  }
} 