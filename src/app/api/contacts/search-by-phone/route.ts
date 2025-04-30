import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
import { NextResponse } from "next/server";

/**
 * Search for contacts by name or pipeline/stage
 */
export async function GET(request: Request) {
    try {
        const tokenId = (await refreshTokenIdBackend()).id_token;
        if (!tokenId) {
            console.error('Failed to get auth token');
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const { locationId } = await getAuthHeaders();
        if (!locationId) {
            console.error('Failed to get location ID');
            return NextResponse.json({ error: 'Location ID not found' }, { status: 400 });
        }

        const url = new URL(request.url);
        const phone = url.searchParams.get('phone') || ''; 

 
        const result = await searchByName(phone, locationId, tokenId);


        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in contacts search API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Search contacts by name
 */
async function searchByName(
    phone: string,
    locationId: string,
    tokenId: string
) { 
    const payload = {
        "locationId": locationId,
        "page": 1,
        "pageLimit": 1,
        "sort": [],
        "filters": [
            {
                "group": "OR",
                "filters": [
                    {
                        "group": "AND",
                        "filters": [
                            {
                                "id": "1",
                                "filterName": "Phone",
                                "filterName_lc": "phone",
                                "extras": {},
                                "selectedOption": {
                                    "filterName": "Phone",
                                    "filterName_lc": "phone",
                                    "condition": "is",
                                    "firstValue": phone,
                                    "secondValue": "US"
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }

    try {
        const headers = buildHeaders(tokenId);
        const response = await fetch("https://backend.leadconnectorhq.com/contacts/search/2", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`Name search returned ${data.contacts?.length || 0} contacts, total: ${data.total || 'unknown'}`);
        return data;
    } catch (error) {
        console.error('Error searching contacts by name:', error);
        throw error;
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