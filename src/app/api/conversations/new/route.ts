import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';

export async function POST(request: Request) {
  try {
    console.log('POST /api/conversations/new called');
    
    // Get request data
    const body = await request.json();
    const { phoneNumber, message } = body;
    
    console.log('Request data:', { phoneNumber, message });
    
    // Validate input
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Make sure phone number is properly formatted
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Initialize Twilio client
    const twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    if (!process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json({ error: 'Twilio phone number not configured' }, { status: 500 });
    }
    
    // Send the message
    console.log('Sending message via Twilio:', {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
      body: message
    });
    
    const twilioResponse = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
      body: message
    });
    
    console.log('Twilio response:', twilioResponse);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      sid: twilioResponse.sid,
      status: twilioResponse.status
    });
    
  } catch (error) {
    console.error('Error in /api/conversations/new:', error);
    
    // Return error response
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500 
    });
  }
} 