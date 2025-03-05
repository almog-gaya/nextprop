import { NextResponse } from 'next/server';
import { storeIncomingMessage, updateMessageStatus } from '../../../../lib/twilio';

// Handle incoming SMS messages and status callbacks from Twilio
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const messageType = formData.get('MessageStatus') ? 'status' : 'message';
    
    if (messageType === 'status') {
      // This is a status update webhook
      const messageSid = formData.get('MessageSid') as string;
      const messageStatus = formData.get('MessageStatus') as string;
      
      if (!messageSid || !messageStatus) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }
      
      await updateMessageStatus(messageSid, messageStatus);
      
      return NextResponse.json({ success: true });
    } else {
      // This is an incoming message webhook
      const messageSid = formData.get('MessageSid') as string;
      const from = formData.get('From') as string;
      const to = formData.get('To') as string;
      const body = formData.get('Body') as string;
      const status = formData.get('SmsStatus') as string;
      
      if (!messageSid || !from || !to || !body) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }
      
      const message = await storeIncomingMessage(
        messageSid,
        from,
        to,
        body,
        status || 'received'
      );
      
      return NextResponse.json({ success: true, message });
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 