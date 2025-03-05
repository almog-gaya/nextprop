import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }



    return await markMessageAsRead(id);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Failed to mark conversation as read' },
      { status: 500 }
    );
  }
}


const markMessageAsRead = async (messageId: string) => {
  const { locationId, token } = await getAuthHeaders();
  const url = `https://services.leadconnectorhq.com/conversations/${messageId}`;
 
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Version': '2021-04-15',
    },
    body: JSON.stringify({ "unreadCount": 0, "locationId": locationId }),
  });

  console.log(`Response from markMessageAsRead: ${JSON.stringify(response)}`);

  const data = await response.json();

  console.log(`Response from markMessageAsRead: ${JSON.stringify(data)}`);

  return NextResponse.json(data);

};

