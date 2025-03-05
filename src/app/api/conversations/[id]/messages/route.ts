import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/messaging-dashboard';

/**
 * GET /api/conversations/[id]/messages
 * Get all messages for a specific conversation from Supabase
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const conversationId = params.id;
        
        if (!conversationId) {
            return NextResponse.json({ error: 'conversation id is required' }, { status: 400 });
        }

        // Get messages from Supabase
        const data = await getConversationMessages(conversationId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversation messages' },
            { status: 500 }
        );
    }
}

/**
 Response: 
        {
        "lastMessageId": "p1mRSHeLDhAms5q0LMr4",
        "nextPage": true,
        "messages": [
            {
            "id": "ve9EPM428h8vShlRW1KT",
            "type": 1,
            "messageType": "SMS",
            "locationId": "ve9EPM428h8vShlRW1KT",
            "contactId": "ve9EPM428h8vShlRW1KT",
            "conversationId": "ve9EPM428h8vShlRW1KT",
            "dateAdded": "2024-03-27T18:13:49.000Z",
            "body": "Hi there",
            "direction": "inbound",
            "status": "connected",
            "contentType": "text/plain",
            "attachments": [
                "string"
            ],
            "meta": {
                "callDuration": 120,
                "callStatus": "completed",
                "email": {
                "email": {
                    "messageIds": [
                    "ve9EPM428kjkvShlRW1KT",
                    "ve9EPs1028kjkvShlRW1KT"
                    ]
                }
                }
            },
            "source": "workflow",
            "userId": "ve9EPM428kjkvShlRW1KT",
            "conversationProviderId": "ve9EPM428kjkvShlRW1KT"
            }
        ]
        }
    
 */
