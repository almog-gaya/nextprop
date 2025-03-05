import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = false;

const log = (message: string, data?: any) => {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Only show actual errors in console
const logError = (message: string, error?: any) => {
  console.error(message, error);
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ghl_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication error: No access token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'desc';
    const sortBy = searchParams.get('sortBy') || 'last_message_date';

    log('Fetching conversations from GHL API');
    // Try to get real data
    let data = await getConversations(status, sort, sortBy);
    
    // Check if there's an error and fall back to mock data
    if (data.statusCode === 401 || data.error) {
      log("Falling back to mock data due to API error:", data);
      data = await getMockConversations(status, sort, sortBy);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    logError("Error fetching conversations:", error);
    // Fallback to mock data
    const mockData = await getMockConversations('all', 'desc', 'last_message_date');
    return NextResponse.json(mockData);
  }
}

const getMockConversations = async (
  status: string,
  sort: string,
  sortBy: string
) => {
  // Simulate a mock API response with more realistic data
  return {
    conversations: [
      {
        id: "mock-conv-1",
        contactId: "mock-contact-1",
        locationId: "mock-location-1",
        lastMessageBody: "Hello, I'm interested in scheduling a viewing for the property on Oak Street.",
        lastMessageType: "text",
        type: "direct",
        unreadCount: 2,
        fullName: "John Doe",
        contactName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        dateAdded: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
      },
      {
        id: "mock-conv-2",
        contactId: "mock-contact-2",
        locationId: "mock-location-1",
        lastMessageBody: "What are the dimensions of the master bedroom?",
        lastMessageType: "text",
        type: "direct",
        unreadCount: 0,
        fullName: "Jane Smith",
        contactName: "Jane Smith",
        email: "jane@example.com",
        phone: "+1987654321",
        dateAdded: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      },
      {
        id: "mock-conv-3",
        contactId: "mock-contact-3",
        locationId: "mock-location-1",
        lastMessageBody: "Is the property still available for the asking price?",
        lastMessageType: "text",
        type: "direct",
        unreadCount: 1,
        fullName: "Robert Johnson",
        contactName: "Robert Johnson",
        email: "robert@example.com",
        phone: "+1567891234",
        dateAdded: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        id: "mock-conv-4",
        contactId: "mock-contact-4",
        locationId: "mock-location-1",
        lastMessageBody: "Thank you for your quick response. I'll get back to you soon.",
        lastMessageType: "text",
        type: "direct",
        unreadCount: 0,
        fullName: "Alice Williams",
        contactName: "Alice Williams",
        email: "alice@example.com",
        phone: "+1456789012",
        dateAdded: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
      },
      {
        id: "mock-conv-5",
        contactId: "mock-contact-5",
        locationId: "mock-location-1",
        lastMessageBody: "Can we schedule a viewing for this weekend?",
        lastMessageType: "text",
        type: "direct",
        unreadCount: 3,
        fullName: "Michael Brown",
        contactName: "Michael Brown",
        email: "michael@example.com",
        phone: "+1321654987",
        dateAdded: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
      }
    ],
    pagination: {
      total: 5,
      count: 5,
      per_page: 20,
      current_page: 1,
      total_pages: 1
    }
  };
};

const getConversations = async (
  status: string = "all",
  sort: string = "desc",
  sortBy: string = "last_message_date"
) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token')?.value;
    
    if (!token) {
      return { error: 'No access token available' };
    }

    const locationId = cookieStore.get('ghl_location_id')?.value;
    
    if (!locationId) {
      return { error: 'No location ID available' };
    }

    const url = `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&status=${status}&sort=${sort}&sortBy=${sortBy}`;
    
    log(`url: `, url);
    log(`header:`, JSON.stringify({ Authorization: `Bearer ${token}`, Version: '2021-04-15', Accept: 'application/json' }));
    
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-04-15',
        Accept: 'application/json'
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`Error fetching conversations: ${response.status} - ${errorText}`);
      return { error: `API Error: ${response.status}`, message: errorText };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    logError("Error fetching conversations:", error);
    return { error: "Failed to fetch conversations", details: error };
  }
};