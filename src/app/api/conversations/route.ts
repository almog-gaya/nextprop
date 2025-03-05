import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract query parameters
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'desc';
  const sortBy = searchParams.get('sortBy') || 'last_message_date';

  try {
    // Try to get real data
    let data = await getConversations(status, sort, sortBy);
    
    // Check if there's an error and fall back to mock data
    if (data.statusCode === 401 || data.error) {
      console.log("Falling back to mock data due to API error:", data);
      data = await getMockConversations(status, sort, sortBy);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    // Fallback to mock data
    const mockData = await getMockConversations(status, sort, sortBy);
    return NextResponse.json(mockData);
  }
}

const getMockConversations = async (
  status: string,
  sort: string,
  sortBy: string
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token');
  const locationId = cookieStore.get('ghl_location_id');

  const url = 'https://stoplight.io/mocks/highlevel/integrations/39582856/conversations/search?locationId=123';
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

const getConversations = async (
  status: string = "all",
  sort: string = "desc",
  sortBy: string = "last_message_date"
) => {
  const cookieStore = await cookies();
  const token = (cookieStore.get('ghl_access_token'))?.value;
  const locationId = (cookieStore.get('ghl_location_id'))?.value;
  const url = `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&status=${status}&sort=${sort}&sortBy=${sortBy}`;
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-04-15', Accept: 'application/json' }
  console.log(`url: `, url)
  console.log(`header:`, JSON.stringify(headers));
  const options = {
    method: 'GET',
    headers,
  };
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching conversations: ${response.status} - ${errorText}`);
      return { error: `API Error: ${response.status}`, message: errorText };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { error: "Failed to fetch conversations", details: error };
  }
}
