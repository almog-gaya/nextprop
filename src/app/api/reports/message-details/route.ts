import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
import { NextResponse } from "next/server";


//  can we make another get request to get the message details?
export async function GET(request: Request) {
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const { locationId } = await getAuthHeaders();
    const { searchParams } = new URL(request.url);  
    const qp = searchParams.toString() + `&locationId=${locationId}`;

    const url = `https://backend.leadconnectorhq.com/conversations-reporting/messages?${qp}`;

    const response = await fetch(url, {
        headers: {
            'token-id': tokenId,
            'sec-ch-ua-platform': '"Android"',
            'Referer': 'https://app.gohighlevel.com/',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?1',
            'baggage': 'sentry-environment=production,sentry-release=999e88d7a7b7c61d87dd30f3898b826f1869d5c6,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=bf1e1e98298a416ea44f43e97044f8ff',
            'sentry-trace': 'bf1e1e98298a416ea44f43e97044f8ff-aedb6b02a98b58f4',
            'source': 'WEB_USER',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'channel': 'APP',
            'Content-Type': 'application/json',
            'DNT': '1',
            'Version': '2021-04-15'
        }, 
    })  

    const data = await response.json(); 

    return NextResponse.json(data);
}