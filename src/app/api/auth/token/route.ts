import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { GHL_AUTH_CONFIG } from '@/lib/ghlAuth';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    console.log('CODE: ', code);

    const data = new URLSearchParams({
      client_id: GHL_AUTH_CONFIG.clientId,
      client_secret: GHL_AUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      redirect_uri: GHL_AUTH_CONFIG.redirectUri
    });

    const response = await fetch(GHL_AUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message }, { status: response.status });
    }

    const tokenData = await response.json();
    const cookieStore = await cookies();
    
    cookieStore.set('ghl_access_token', tokenData.access_token, {
      path: '/',
      maxAge: 86400,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    });

    if (tokenData.location_id) {
      cookieStore.set('ghl_location_id', tokenData.location_id, {
        path: '/',
        maxAge: 86400,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}