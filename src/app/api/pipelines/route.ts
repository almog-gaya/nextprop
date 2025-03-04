import { NextResponse } from 'next/server';
import { getPipelines, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET() {
  // const data = await fetchWithErrorHandling(getPipelines);
  const data = await fetchWithErrorHandling(getMockPipeLines);
  return NextResponse.json(data);
} 
/**
 curl --request GET \
  --url 'https://stoplight.io/mocks/highlevel/integrations/39582852/opportunities/pipelines?locationId=ve9EPM428h8vShlRW1KT' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer 123' \
  --header 'Version: 2021-07-28'
 */
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
 