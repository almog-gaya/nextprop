import { NextRequest, NextResponse } from 'next/server';
import { sendBusinessVerification } from '@/lib/business-verify';

/**
 * POST /api/businesses/[id]/verify/send
 * Send a verification code for a business
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const { phoneNumber, channel = 'sms' } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    const result = await sendBusinessVerification(businessId, phoneNumber, channel);
    
    return NextResponse.json({
      success: true,
      status: result.status,
      sid: result.sid
    });
  } catch (error: any) {
    console.error('Error sending verification:', error);
    
    // Handle specific errors
    if (error.message === 'Business not found') {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send verification' },
      { status: 500 }
    );
  }
} 