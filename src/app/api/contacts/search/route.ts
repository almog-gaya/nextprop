import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
import { NextResponse } from "next/server";
/**
 *  Search for a contact by name
 */
export async function GET(request: Request) {
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const { locationId } = await getAuthHeaders();
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';

    try {
        const payload = {
            "locationId": locationId,
            "page": 1,
            "pageLimit": 20,
            "sort": [],
            "filters": [
                {
                    "group": "OR",
                    "filters": [
                        {
                            "group": "AND",
                            "filters": [
                                {
                                    "id": "0599a5f6-cabf-4bec-b973-46922aa4edef",
                                    "filterName": "generic",
                                    "filterName_lc": "generic",
                                    "extras": {},
                                    "selectedOption": {
                                        "filterName": "generic",
                                        "filterName_lc": "generic",
                                        "condition": "is",
                                        "firstValue": name,
                                        "secondValue": "US"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        const result = await fetch("https://backend.leadconnectorhq.com/contacts/search/2", {
            "method": "POST",
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "baggage": "sentry-environment=production,sentry-release=4327cfe1b659907f78c72b18830c9f249c943742,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=a1eb4012312345fa8d6e37b912a89cd5",
                "channel": "APP",
                "content-type": "application/json",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sentry-trace": "a1eb4012312345fa8d6e37b912a89cd5-a616ab67f67fcaa6",
                "source": "WEB_USER",
                "token-id": tokenId,
                "Referer": "https://app.gohighlevel.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Version": "2021-07-28"
            },
            "body": JSON.stringify(payload),
        });
        const res = await result.json();
        return NextResponse.json(res);
    } catch (error) {
        return NextResponse.json({ error: error });
    }
}