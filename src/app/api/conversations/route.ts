import { NextRequest, NextResponse } from 'next/server';
import {  fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract query parameters
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'desc';
  const sortBy = searchParams.get('sortBy') || 'last_message_date';
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }
 
  const data = await fetchWithErrorHandling(() => getMockConversations(locationId, status, sort, sortBy));
   return NextResponse.json(data);
} 

const getMockConversations = async (
  locationId: string,
  status: string,
  sort: string,
  sortBy: string
) => {

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
 