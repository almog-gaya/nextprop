
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
    conversationId: string,
    conversationProviderId: string,
    altId: string,
    date: string,
    call: any) => {

    const url = 'https://stoplight.io/mocks/highlevel/integrations/39582856/conversations/messages/outbound';
    const options = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer 123',
            Version: '2021-04-15',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: '{"type":"Call","attachments":["string"],"conversationId":"ve9EPM428h8vShlRW1KT","conversationProviderId":"61d6d1f9cdac7612faf80753","altId":"61d6d1f9cdac7612faf80753","date":"2019-08-24T14:15:22Z","call":{"to":"+15037081210","from":"+15037081210","status":"completed"}}'
    };
    const response = await fetch(url, options);
    const data = await response.json();

    return data;
}