import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { locationId } = await getAuthHeaders();
    if (!locationId) {
        console.error('Failed to get location ID');
        return NextResponse.json({ error: 'Location ID not found' }, { status: 400 });
    }

    const body = await request.json();
    
    body.locationId = locationId;

    const result = await searchDynamically(body);
    return NextResponse.json(result);
}

const searchDynamically = async (payload: any) => {
    try { 
        payload.page = parseInt(payload.page) || 1;
        payload.pageLimit = parseInt(payload.pageLimit) || 10;

        console.log(`Request: ${JSON.stringify(payload)}`);
        delete payload.limit; 
        const tokenId = (await refreshTokenIdBackend()).id_token;
        const URL = `https://backend.leadconnectorhq.com/contacts/search/2`;
        const headers = buildHeaders(tokenId);
        const response = await fetch(URL, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Failed to fetch dynamic contacts:', response.statusText);
            return { error: 'Failed to fetch dynamic contacts' };
        }
        const data = await response.json();
        return data;
    } catch (e) { }
}

const buildHeaders = (tokenId: string) => {
    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "baggage": "sentry-environment=production,sentry-release=a9ea33ccf48e211966db91418cf5d9a866eee67c,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=1416625bc1fe4208886f7ebd4b84fc44",
        "channel": "APP",
        "content-type": "application/json",
        "dnt": "1",
        "origin": "https://app.gohighlevel.com",
        "priority": "u=1, i",
        "referer": "https://app.gohighlevel.com/",
        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sentry-trace": "1416625bc1fe4208886f7ebd4b84fc44-a81839fdd5d3bba1",
        "source": "WEB_USER",
        "token-id": tokenId,
        "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
        "Version": "2021-07-28"
    };
    return headers;
}