import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("Marking conversation as read:", id);
    
    if (!id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Call the function to mark the conversation as read
    const response = await markConversationAsRead(id);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return NextResponse.json({ error: 'Failed to mark conversation as read' }, { status: 500 });
  }
}

const markConversationAsRead = async (conversationId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token');
  
  if (!token?.value) {
    console.error("No access token found in cookies");
    return { error: "Authentication error: No access token" };
  }
  
  // GoHighLevel API endpoint to update conversation
  const url = `https://services.leadconnectorhq.com/conversations/${conversationId}`;
  console.log("Calling API to mark conversation as read:", url);
  
  const headers = {
    'Authorization': `Bearer ${token.value}`,
    'Version': '2021-04-15',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // Send a PATCH request to update the conversation
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        unreadCount: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error marking conversation as read: ${response.status} - ${errorText}`);
      return { error: `API Error: ${response.status}`, message: errorText };
    }

    const data = await response.json();
    console.log("Successfully marked conversation as read:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    return { error: "Failed to mark conversation as read", details: error };
  }
} 