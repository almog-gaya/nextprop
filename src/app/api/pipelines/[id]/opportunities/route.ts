import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchWithErrorHandling(() => getOpportunitiesById(id));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}


const getMockOpportunitiesById = async (id: String) => {
  const url = `https://stoplight.io/mocks/highlevel/integrations/39582852/opportunities/search?location_id=location_id=${id}`;
  const options = {
    method: 'GET',
    headers: { Authorization: 'Bearer 123', Version: '2021-07-28', Accept: 'application/json' }
  };
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}

const getOpportunitiesById = async (id: string) => {
  const { token, locationId } = await getAuthHeaders();
  const url = `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      Accept: 'application/json'
    }
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}