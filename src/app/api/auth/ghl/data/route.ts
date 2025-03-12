import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserDataAPI } from '@/app/api/locations/route';
import { isTokenExpired, refreshAccessToken, setAuthCookies } from '@/utils/authUtils';
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
  const responseTokenId = (await _refreshTokenId()).id_token;
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
    const responseTokenId = await _refreshTokenId();
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


/**
 returns:
    {
        access_token,
        expires_in,
        token_type,
        refresh_token,
        id_token,
        user_id,
        project_id, 
    }
 */
/**
 * Refreshes the authentication token only if the current token is older than 40 minutes
 * @returns {Promise<Object>} The token response data containing:
 *   - access_token
 *   - expires_in
 *   - token_type
 *   - refresh_token
 *   - id_token
 *   - user_id
 *   - project_id
 */
const _refreshTokenId = async () => {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('token_id')?.value;
    const refreshToken = cookieStore.get('token_id_refresh')?.value || 'AMf-vBwVv8zF2qFKjAxaeNX8hffkiGsLenYQQyzfaMCD5ZgldF0elrHBjwk_LPiJDSdEMRofwmR8l6FXjU2QpcZlPZqQXlzPpTbpFgqDcsKN_i17EwNGgqC3L0ZvVjHLjJ6CT-k5bdpqfrH3b0IilK1tXH0fjtHwpajPtc6bHPk5hXYBOWuX2fv3zUKRYV9pRjTeMEH8LPQuQ6776u8t1tJZ13Aj87xZfFF4kfUnmydUTWrt38Rmc5FFHzt79b_vNpX5fFOnRxGFIAWzbi-MPbksrFHANZx508VN0LYFrUYdKz_6siHJMIJgGBBgWDsBpTjnLZ7_9ueJ1KZDdR9rj7c05QKfvYESfp-5YUdXZy1nHLpWLKRbN-gjwXawLVE9nNKHxJsZKuOI2CH4C9a0F6ZnmFRrQ27jia55MDU4TuL7tW-VMn95gtIGfTIzqZVoxZGpFrEsGg9_JRcpcK-nyUUhCA1BPBuTQLJDoNXcJ0ouGzgU7Mh3x4uvkBiKsf81AZoKKl3XNA_i';
    const tokenTimestamp = cookieStore.get('token_id_timestamp')?.value;

    // Check if we have a valid refresh token
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      throw new Error('No valid refresh token found');
    }

    // Check if current token is still valid (less than 40 minutes old)
    const now = Date.now();
    const tokenAge = tokenTimestamp ? now - parseInt(tokenTimestamp, 10) : Infinity;
    const TOKEN_MAX_AGE = 40 * 60 * 1000; // 40 minutes in milliseconds

    // If token exists and is less than 40 minutes old, return cached token info
    if (currentToken && tokenAge < TOKEN_MAX_AGE) {
      console.log('[RefreshTokenId] Using cached token (age: ' + Math.round(tokenAge / 60000) + ' minutes)');

      // Return the cached complete token data if available
      const cachedTokenData = cookieStore.get('token_data')?.value;
      if (cachedTokenData) {
        try {
          const parsedData = JSON.parse(cachedTokenData);
          return { ...parsedData, cached: true };
        } catch (e) {
          console.log('[RefreshTokenId] Could not parse cached token data, will refresh');
          // If parsing fails, continue to refresh the token
        }
      }
    }

    // Token doesn't exist, is expired, or cache parsing failed - refresh it
    console.log('[RefreshTokenId] Token expired or missing, refreshing...');

    // Create form data (application/x-www-form-urlencoded format)
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

    const urlencoded = new URLSearchParams();
    urlencoded.append('grant_type', 'refresh_token');
    urlencoded.append('refresh_token', refreshToken);

    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      'https://securetoken.googleapis.com/v1/token?key=AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE',
      {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow',
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed with status ${response.status}: ${errorText}`);
    }

    const responseBody = await response.json();

    // Validate the response contains the expected fields
    const requiredFields = ['access_token', 'expires_in', 'refresh_token', 'id_token', 'user_id', 'project_id'];
    const missingFields = requiredFields.filter(field => !responseBody[field]);

    if (missingFields.length > 0) {
      console.warn(`[RefreshTokenId] Response missing fields: ${missingFields.join(', ')}`);
    }

    // Store all tokens and metadata
    cookieStore.set('token_id', responseBody.id_token);
    cookieStore.set('token_id_refresh', responseBody.refresh_token);
    cookieStore.set('token_id_timestamp', now.toString());

    // Store the complete token data as JSON for later use
    cookieStore.set('token_data', JSON.stringify({
      access_token: responseBody.access_token,
      expires_in: responseBody.expires_in,
      token_type: responseBody.token_type,
      refresh_token: responseBody.refresh_token,
      id_token: responseBody.id_token,
      user_id: responseBody.user_id,
      project_id: responseBody.project_id
    }));

    console.log('[RefreshTokenId] Token refreshed successfully');
    return {
      ...responseBody,
      cached: false
    };
  } catch (error) {
    console.error(`[RefreshTokenId] Error: ${error.message}`);

    if (error.name === 'AbortError') {
      throw new Error('Token refresh request timed out');
    }

    throw error;
  }
};