import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';
import { refreshTokenIdBackend } from '@/utils/authUtils';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = false;

const log = (message: string, data?: any) => {
    if (ENABLE_VERBOSE_LOGGING) {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }
};
const logError = (message: string, error?: any) => {
    console.error(message, error);
};

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const messageId = searchParams.get('id');
        if (!messageId) throw new Error('Invalid message Id');
        log('Fetching conversations from GHL API');
        // Try to get real data
        const data = await getCallDetails(messageId);
        return NextResponse.json({ ...data });
    } catch (error) {
        logError("Error fetching conversations:", error);
        return NextResponse.json({})
    }
}
const getCallDetails = async (messageId: string) => {
    try {
        const { locationId } = await getAuthHeaders();

        const tokenId = (await refreshTokenIdBackend()).id_token;
        if (!tokenId) {
            return NextResponse.json({ error: 'Authentication error: No access token' }, { status: 401 });
        }

        const url = `https://services.leadconnectorhq.com/phone-system/voice-call/location/${locationId}/call-details/${messageId}`;
        const headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "baggage": "sentry-environment=production,sentry-release=f2826d075248388b7b6107346b6ed9175fb01709,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=d9884ac9a5ea4f96aef6fca6cf7a50d1",
            "channel": "APP",
            "developer_version": "",
            "dnt": "1",
            "origin": "https://app.gohighlevel.com",
            "priority": "u=1, i",
            "referer": "https://app.gohighlevel.com/",
            "sec-ch-ua": `"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"`,
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": `"macOS"`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sentry-trace": "d9884ac9a5ea4f96aef6fca6cf7a50d1-934a48adcea46c8a",
            "source": "WEB_USER",
            "token-id": tokenId,
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Version": "2021-07-28",
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