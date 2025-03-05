import { NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function GET() {
  const data = await fetchWithErrorHandling(getPipelines);
  return NextResponse.json(data);
} 

const getMockPipeLines = async () => {
  const response = await fetch('https://stoplight.io/mocks/highlevel/integrations/39582852/opportunities/pipelines?locationId=ve9EPM428h8vShlRW1KT', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer 123',
      'Version': '2021-07-28', 
    }
  });
  return response.json();
}
 
const getPipelines = async () => {
  const {token, locationId} = await getAuthHeaders();
  const url = `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28'
    }
  });

  return response.json();

}