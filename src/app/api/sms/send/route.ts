import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

/**
 * POST /api/sms/send
 * Send an SMS message
 */
export async function POST(request: NextRequest) {
  try {
    const { to, body, businessId } = await request.json();
    
    if (!to || !body) {
      return NextResponse.json(
        { error: 'Both to and body parameters are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneNumberRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be E.164 format (e.g. +12345678900)' },
        { status: 400 }
      );
    }

    // Send the SMS via Twilio (this will also store it in Supabase)
    const message = await sendSMS(to, body, businessId);
    
    return NextResponse.json({
      success: true,
      sid: message.sid,
      status: message.status
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
    // Handle Twilio-specific errors
    if (error.code) {
      if (error.code === 21211) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      if (error.code === 21610) {
        return NextResponse.json(
          { error: 'Twilio cannot send to unverified numbers in trial mode' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 