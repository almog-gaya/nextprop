import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get('ghl_access_token');
  const locationData = (await cookieStore).get('ghl_location_data');

  return NextResponse.json({
    authenticated: !!accessToken,
    locationData: locationData ? JSON.parse(locationData.value) : null,
    timestamp: new Date().toISOString()
  });
}