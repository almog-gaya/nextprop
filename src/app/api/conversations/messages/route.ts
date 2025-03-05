import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/messaging-dashboard';

/**
 * POST /api/conversations/messages
 * Send a message using Twilio and store in Supabase
 */
export async function POST(request: NextRequest) {
    try {
        const {
            message,
            fromNumber,
            toNumber,
            businessId
        } = await request.json();
        
        // Validate required fields
        if (!message || !fromNumber || !toNumber) {
            return NextResponse.json(
                { error: 'message, fromNumber, and toNumber are required' },
                { status: 400 }
            );
        }
        
        // Validate phone number format (E.164)
        const phoneNumberRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneNumberRegex.test(toNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Use E.164 format (e.g., +12025550123)' },
                { status: 400 }
            );
        }
        
        // Send the message using our Twilio service
        const result = await sendMessage({
            message,
            fromNumber,
            toNumber,
            businessId
        });
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Failed to send message:', error);
        
        // Return appropriate error response
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}


/**
 {
  "conversationId": "ABC12h2F6uBrIkfXYazb",
  "emailMessageId": "rnGyqh2F6uBrIkfhFo9A",
  "messageId": "t22c6DQcTDf3MjRhwf77",
  "messageIds": [
    "string"
  ],
  "msg": "Message queued successfully."
}
 */