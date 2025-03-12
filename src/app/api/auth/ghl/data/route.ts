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

// not in use
const _makeRefreshOAuth = async (locationId: string) => {
  try {
    const responseTokenId = await refreshTokenIdBackend();
    await fetch(`https://services.leadconnectorhq.com/oauth/2/login/signin/refresh?version=2&location_id=${locationId}`, {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "baggage": "sentry-environment=production,sentry-release=86dd6da2d904e841613a262a22a5a8e48c10f0d8,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=bba9f2137db64d27af1ec9da6e59b21f,sentry-sample_rate=0.1,sentry-transaction=conversations-id-v2,sentry-sampled=false",
        "channel": "APP",
        "developer_version": "",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sentry-trace": "bba9f2137db64d27af1ec9da6e59b21f-933c00777057c5d3-0",
        "source": "WEB_USER",
        "token-id": responseTokenId.id_token || "eyJhbGciOiJSUzI1NiIsImtpZCI6ImEwODA2N2Q4M2YwY2Y5YzcxNjQyNjUwYzUyMWQ0ZWZhNWI2YTNlMDkiLCJ0eXAiOiJKV1QifQ.eyJ1c2VyX2lkIjoiOWZRUXZCNkZkWXZ2YUFiazYxN24iLCJjb21wYW55X2lkIjoiYzE5dlgxc3BqbExKV1FLTVVXVkQiLCJyb2xlIjoiYWRtaW4iLCJ0eXBlIjoiYWdlbmN5IiwibG9jYXRpb25zIjpbInMzbU5IckZ1RHlHaUk3b1VWaXNVIiwicmhKYmE0cVpEeEx6YTY1V1l2blciXSwidmVyc2lvbiI6MiwicGVybWlzc2lvbnMiOnsid29ya2Zsb3dzX2VuYWJsZWQiOnRydWUsIndvcmtmbG93c19yZWFkX29ubHkiOmZhbHNlfSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2hpZ2hsZXZlbC1iYWNrZW5kIiwiYXVkIjoiaGlnaGxldmVsLWJhY2tlbmQiLCJhdXRoX3RpbWUiOjE3NDE2OTgyNzksInN1YiI6IjlmUVF2QjZGZFl2dmFBYms2MTduIiwiaWF0IjoxNzQxNzU0Mjc2LCJleHAiOjE3NDE3NTc4NzYsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnt9LCJzaWduX2luX3Byb3ZpZGVyIjoiY3VzdG9tIn19.EER7S3ldTkURDR-Pn-neDD84ctFHrs9QYiUn_Vw2d9ttBEREjKS4P6Hs6bzE94VdjX_JPDk2-jUuVBZWxYWbHBrzS1Lr6d4HG-0mF47yixouO7B20e_r4r9XBqatdetaOPl3_QjuLsHr4j6fsp88uCJI0IKNJPLgqtZ7-XUb4aWzqc98eV28gKMefUmnBCq1JEJf2F69COrD3u5tJYSELqZhWcjZpNjf6JOVk7pbgRmlHx67XylTaZeEnmCgzH6ZgLux7RvlCNXRSLh_fnArFnvfUN9VtH075EYPK9WbSX593XoQ-E_pKD4YgKi0h1aZVJqqYakaCCddMWBEU-Ek3Q",
        "Referer": "https://app.gohighlevel.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "POST"
    });
  } catch (e) { }
};
