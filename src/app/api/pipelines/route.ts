import { NextRequest, NextResponse } from 'next/server';
import { getPipelines } from '@/lib/crm';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('X-Business-Id')!;
    const pipelines = await getPipelines(businessId);
    
    return NextResponse.json({
      pipelines,
      meta: {
        total: pipelines.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching pipelines:', error);
    
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
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
 