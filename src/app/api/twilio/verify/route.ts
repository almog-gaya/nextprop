import { NextRequest, NextResponse } from 'next/server';

// Use environment variables instead of hardcoded credentials
// These should be set in your .env.local file
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * API handler to perform phone number lookup and validation via Twilio Lookups API
 */
export async function POST(request: NextRequest) {
  try {
    // Check if credentials are configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json({ 
        error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.' 
      }, { status: 500 });
    }
    
    const data = await request.json();
    
    // Validate phone number
    if (!data.phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format the phone number (ensure it has a + prefix)
    let phoneNumber = data.phone;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }

    // Make request to Twilio Lookups API
    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Twilio lookup error:', responseData);
      return NextResponse.json(
        { error: 'Failed to lookup phone number', details: responseData }, 
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Phone number validated successfully',
      data: responseData
    });
    
  } catch (error) {
    console.error('Error validating phone number:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 