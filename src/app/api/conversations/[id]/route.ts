import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'conversation id is required' }, { status: 400 });
  }

  const data = await fetchWithErrorHandling(() => getConversation(id));
  return NextResponse.json(data);
}

const getConversation = async (
  id: string
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token');

  const response = await fetch(
    `https://services.leadconnectorhq.com/conversations/${id}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token?.value}`,
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