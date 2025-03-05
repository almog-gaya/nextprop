
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function POST(request: NextRequest) {
    const params = await request.json();

    const {
        type,
        attachments,
        conversationId,
        conversationProviderId,
        altId,
        date,
        call
    } = params;

    const data = await fetchWithErrorHandling(() => makeExternalOutboundCall(
        type,
        attachments,
        conversationId,
        conversationProviderId,
        altId,
        date,
        call
    ));

    return NextResponse.json(data);

}

const makeExternalOutboundCall = async (
    type: string,
    attachments: string[],
    conversationId: string,
    conversationProviderId: string,
    altId: string,
    date: string,
    call: any) => {

    const mockURL = 'https://stoplight.io/mocks/highlevel/integrations/39582856/conversations/messages/outbound';
    const prodURL = `https://services.leadconnectorhq.com/conversations/messages/outbound`;
    var body = {
        type,
        attachments,
        conversationId,
        conversationProviderId,
        altId,
        date,
        call
    };

    console.log('body', body);
    /// adding only that are not null 
    const bodyParam = Object.fromEntries(
        Object.entries(body).filter(([_, value]) => value !== null)
    );

    const options = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer 123',
            Version: '2021-04-15',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(bodyParam)
    };
    const response = await fetch(mockURL, options);
    const data = await response.json();

    return data;
}