import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';
import { refreshTokenIdBackend } from '@/utils/authUtils';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = true;

const log = (message: string, data?: any) => {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Only show actual errors in console
const logError = (message: string, error?: any) => {
  console.error(message, error);
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ghl_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication error: No access token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const sort = searchParams.get('sort') || 'desc';
    const sortBy = searchParams.get('sortBy') || 'last_message_date';

    log('Fetching conversations from GHL API'); 
    let data = await getConversations(status, sort, sortBy); 
    
    return NextResponse.json(data);
  } catch (error) {
    logError("Error fetching conversations:", error); 
    return NextResponse.json({
      "data" : [],
    })
  }
}
 

const getConversations = async (
  status: string = "all",
  sort: string = "desc",
  sortBy: string = "last_message_date"
) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token')?.value;
    
    if (!token) {
      return { error: 'No access token available' };
    }
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const locationId = cookieStore.get('ghl_location_id')?.value;
    
    if (!locationId) {
      return { error: 'No location ID available' };
    }

    const url = `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&status=${status}&sort=${sort}&sortBy=${sortBy}&type=SMS`;

    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      channel: "APP",
      "developer_version": "",
      dnt: "1",
      'token-id': tokenId,
      baggage: "sentry-environment=production,sentry-release=86dd6da2d904e841613a262a22a5a8e48c10f0d8,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=58e01ac401b5416fb7301d9f8fe6343c,sentry-sample_rate=0.1,sentry-transaction=conversations-id-v2,sentry-sampled=false",

      "if-none-match": 'W/"1ea5-Hr1V1mBae01Fj8XIZ+5BjH3ejlg"',
      origin: "https://app.gohighlevel.com",
      priority: "u=1, i",
      referer: "https://app.gohighlevel.com/",
      "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      source: "WEB_USER",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      Version: "2021-04-15",
  };
    const options = {
      method: 'GET',
      headers,
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`Error fetching conversations: ${response.status} - ${errorText}`);
      return { error: `API Error: ${response.status}`, message: errorText };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    logError("Error fetching conversations:", error);
    return { error: "Failed to fetch conversations", details: error };
  }
};