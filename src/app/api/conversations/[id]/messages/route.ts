import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const conversationId = params.id;

    if (!conversationId) {
        return NextResponse.json({ error: 'conversation id is required' }, { status: 400 });
    }

    const data = await fetchWithErrorHandling(() => getMockMessagesByConversationId(conversationId));
    return NextResponse.json(data);
}

const getMockMessagesByConversationId = async (conversationId: string) => {
    const url = `https://stoplight.io/mocks/highlevel/integrations/39582856/conversations/${conversationId}/messages`;
    const options = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer 123',
            Version: '2021-04-15',
            Prefer: 'code=200',
            Accept: 'application/json'
        }
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
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
