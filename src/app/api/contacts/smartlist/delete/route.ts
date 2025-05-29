import { NextResponse } from 'next/server'; 
import { refreshTokenIdBackend } from '@/utils/authUtils';

export async function POST(request: Request) { 

    try {
        const body = await request.json();

        const tokenId = (await refreshTokenIdBackend()).id_token;
        const headers = buildHeaders(tokenId);
        const url = `https://api.leadconnectorhq.com/smartlist/delete`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                smartlist_id: body.id,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Delete smart list error:', errorData);
            return NextResponse.json({ error: 'Failed to delete smart list' }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
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