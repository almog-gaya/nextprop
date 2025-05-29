import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';
import { log } from '@/middleware';
import { refreshTokenIdBackend } from '@/utils/authUtils';
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

/// Get smart list
export async function GET(request: Request) {
    const { locationId, userId } = await getAuthHeaders();
    console.log(`userIduserIduserId: ${JSON.stringify(userId)}`)
    const tokenId = (await refreshTokenIdBackend()).id_token;

    const url = new URL(request.url);

    try {
        const headers = buildHeaders(tokenId);

        const url = `https://backend.leadconnectorhq.com/contacts/smartlist/search?locationId=${locationId}&userId=${userId}&globals=true`

        console.log(`Hitting: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Get smart list error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch smart list' }, { status: 500 });
        }
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in contacts API route:', error);
        return NextResponse.json({ error: 'Failed to fetch smart list' }, { status: 500 });
    }
}

/// create smart list
export async function POST(request: Request) {

    const body = await request.json();
    try {
        const { locationId, userId } = await getAuthHeaders();
        const payload = __buildCreateSmartListPayload(locationId!, body);
        const tokenId = (await refreshTokenIdBackend()).id_token;
        const headers = buildHeaders(tokenId);
        const url = `https://backend.leadconnectorhq.com/contacts/smartlist/`;
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Create smart list error:', data);
            return NextResponse.json({ error: 'Failed to create smart list' }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}



const __buildCreateSmartListPayload = (locationId: string, body: any) => {
    const listName = body.listName || 'New List';
    const filterSpecs = body.filterSpecs || [];
    const payload = {
        "locationId": locationId,
        "displayOrder": 10000,
        "listName": listName,
        "sortSpecs": [],
        "columns": [
            {
                "key": "name",
                "value": "Name",
                "order": 1,
                "isRequired": true
            },
            {
                "key": "phone",
                "value": "Phone",
                "order": 3,
                "isChecked": true
            },
            {
                "key": "email",
                "value": "Email",
                "order": 4,
                "isChecked": true
            },
            {
                "key": "dateAdded",
                "value": "Created",
                "order": 5,
                "isChecked": true
            },
            {
                "key": "lastActivity",
                "value": "Last Activity",
                "order": 7,
                "isChecked": true
            },
            {
                "key": "tags",
                "value": "Tags",
                "order": 10,
                "isChecked": true
            }
        ],
        "filterSpecs": filterSpecs,
    }

    return payload;

}