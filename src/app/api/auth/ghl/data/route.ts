import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserDataAPI } from '@/app/api/locations/route';
import { isTokenExpired, refreshAccessToken, refreshTokenIdBackend, setAuthCookies } from '@/utils/authUtils';
import { getAuthHeaders } from '@/lib/enhancedApi';


interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  locationId?: string;
  name?: string;
  phone?: string;
}

const log = (message: string) => {
  if (process.env.NODE_ENV !== 'production') console.log(`[Auth] ${message}`);
};

const logError = (message: string) => {
  if (process.env.NODE_ENV !== 'production') console.error(`[Auth] ${message}`);
};

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('ghl_access_token')?.value;
  const refreshToken = cookieStore.get('ghl_refresh_token')?.value;
  const tokenTimestamp = cookieStore.get('ghl_token_timestamp')?.value;
  const locationId = cookieStore.get('ghl_location_id');

  if (!accessToken) {
    log('No access token found');
    return NextResponse.json({ authenticated: false, user: null, locationData: null });
  }

  if (!tokenTimestamp || isTokenExpired(tokenTimestamp)) {
    if (!refreshToken) {
      log('Token expired/missing timestamp and no refresh token');
      return NextResponse.json({ authenticated: false, user: null, locationData: null });
    }

    try {
      log('Attempting token refresh');
      const newTokens = await refreshAccessToken(refreshToken);
      log('Token refresh successful');
      setAuthCookies(cookieStore, newTokens);

      const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 12,
      };

      const userData = await getUserData();
      const response = NextResponse.json({
        authenticated: true,
        user: userData
      });

      response.cookies.set('ghl_access_token', newTokens.access_token, cookieOptions);
      response.cookies.set('ghl_token_timestamp', Date.now().toString(), cookieOptions);
      if (newTokens.refresh_token) {
        response.cookies.set('ghl_refresh_token', newTokens.refresh_token, cookieOptions);
      }

      return response;
    } catch (error) {
      logError(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      return NextResponse.json({ authenticated: false, user: null, locationData: null });
    }
  }

  const userData = await getUserData();
  return NextResponse.json({
    authenticated: true,
    user: userData,
    locationData: { locationId: locationId?.value },
  });
}


const getUserData = async () => {
  const { locationId } = await getAuthHeaders();
  const userData = await getUserDataAPI(); 
  let numbers = [];
  try {
    numbers = await loadPhoneNumbers(locationId!);

  } catch (_) {
    console.log(`Error occured, catched at getUserData `, _);
  }
  return {
    ...userData,
    numbers,
  }

}

/// returns list of numbers!
const loadPhoneNumbers = async (locationId: string) => {
  const responseTokenId = (await refreshTokenIdBackend()).id_token;
  const loadPhoneURL = `https://backend.leadconnectorhq.com/phone-system/numbers/location/${locationId}`;
  const response = await fetch(
    loadPhoneURL,
    {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        channel: "APP",
        origin: "https://app.gohighlevel.com",
        priority: "u=1, i",
        referer: "https://app.gohighlevel.com/",
        source: "WEB_USER",
        "token-id": responseTokenId,
        Version: "2021-04-15",
      },
      redirect: "follow",
    }
  );

  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(`${responseBody ?? 'Something went wrong on fetching numbers'}`);
  }

  return responseBody.numbers;
}
 
