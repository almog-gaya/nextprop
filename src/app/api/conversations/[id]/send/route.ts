import { NextResponse } from 'next/server';
import { sendSMS } from '../../../../../lib/twilio';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // The conversation ID is the contact's phone number
    const contactNumber = params.id;
    
    if (!contactNumber) {
      return NextResponse.json(
        { error: 'Missing conversation ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { message, businessId } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }
    
    // Send the message
    const twilioMessage = await sendSMS(contactNumber, message, businessId);
    
    return NextResponse.json({
      success: true,
      message: twilioMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 