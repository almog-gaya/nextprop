import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract query parameters
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'desc';
  const sortBy = searchParams.get('sortBy') || 'last_message_date';


  const data = await fetchWithErrorHandling(() => getMockConversations(status, sort, sortBy));
  return NextResponse.json(data);
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
  const header = { Authorization: `Bearer ${token}`, Version: '2021-04-15', Accept: 'application/json' }
  console.log(`url: `, url)
  console.log(`header:`, JSON.stringify(header));
  const options = {
    method: 'GET',
    header,
  };
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}
