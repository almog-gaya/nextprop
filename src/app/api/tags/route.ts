import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";

export async function GET(request: Request) {
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const {locationId} = await getAuthHeaders();
    const url = `https://services.leadconnectorhq.com/locations/${locationId}/tags/search?limit=50&skip=0&query=`;
    const response = await fetch(url, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "baggage": "sentry-environment=production,sentry-release=999e88d7a7b7c61d87dd30f3898b826f1869d5c6,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=f39bc52032ad442f81f0dec92673ff90",
            "channel": "APP",
            "if-none-match": "W/\"3b2-M4TveCc4YjLBBx7YcoieZW/sIo0\"",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sentry-trace": "f39bc52032ad442f81f0dec92673ff90-a0b15152e1470994",
            "source": "WEB_USER",
            "token-id": tokenId,
            "Referer": "https://app.gohighlevel.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Version" : "2021-04-15",
        },
        "body": null,
        "method": "GET"
    });

    const data = await response.json();
    return Response.json(data);
}