import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'conversation id is required' }, { status: 400 });
  }

  const data = await fetchWithErrorHandling(() => getMockConversation(id));
  return NextResponse.json(data);
}

const getMockConversation = async (
  id: string
) => {
  const response = await fetch(
    `https://stoplight.io/mocks/highlevel/integrations/39582856/conversations/${id}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer 123',
        'Version': '2021-07-28',
      }
    }
  );
  return response.json();
}

/**
 Response:
          {
            "contactId": "ve9EPM428kjkvShlRW1KT",
            "locationId": "ve9EPM428kjkvShlRW1KT",
            "deleted": false,
            "inbox": true,
            "type": 0,
            "unreadCount": 1,
            "assignedTo": "ve9EPM428kjkvShlRW1KT",
            "id": "ve9EPM428kjkvShlRW1KT",
            "starred": true
          }
 */