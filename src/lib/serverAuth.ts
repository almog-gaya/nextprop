import { cookies } from 'next/headers';
import { GHL_AUTH_CONFIG } from './ghlAuth';

export async function handleTokenExchange(code: string) {
  try {
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
      throw new Error(errorData.message || 'Failed to exchange code for tokens');
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

    return tokenData;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}