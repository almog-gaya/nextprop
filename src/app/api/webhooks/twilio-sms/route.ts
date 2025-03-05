import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { storeIncomingMessage } from '@/lib/twilio';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/webhooks/twilio-sms
 * Webhook handler for incoming SMS messages from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const body = formData.get('Body') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    console.log('Received SMS:', { from, to, body, messageSid });

    // Production: Validate Twilio request signature
    // const twilioSignature = request.headers.get('X-Twilio-Signature');
    // const url = request.url;
    // const isValidRequest = validateRequest(twilioSignature, url, formData);
    // if (!isValidRequest) {
    //   return NextResponse.json({ error: 'Invalid request signature' }, { status: 403 });
    // }

    // Store the incoming message in Supabase
    await storeIncomingMessage(
      messageSid,
      from,
      to,
      body,
      'received'
    );
    
    // Try to find which business this message belongs to
    const { data: businessData } = await supabase
      .from('twilio.businesses')
      .select('id, name')
      .eq('custom_twilio_number', to)
      .single();

    // Create a TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    
    // Customize the response based on the business or content
    if (businessData) {
      // This message was for a specific business
      twiml.message(`Thank you for contacting ${businessData.name}. Your message has been received.`);
    } else {
      // Generic response
      twiml.message('Thank you for your message. We will get back to you shortly.');
    }

    // Return TwiML response
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 