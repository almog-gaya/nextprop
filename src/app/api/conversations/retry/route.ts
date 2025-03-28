import { getAuthHeaders } from "@/lib/enhancedApi"
import { NextRequest, NextResponse } from "next/server"


export async function POST(request: NextRequest) {
    const { messageId } = await request.json();
    const response = await retryMessage(messageId);
    const updatedMessage = await fetchAMessage(messageId);
    return NextResponse.json({
        retry: response,
        message: updatedMessage
    });

}

const retryMessage = async (messageId: string) => {
    const { locationId } = await getAuthHeaders();
    const URL = `https://highlevel-backend.appspot.com/message/resend/text/${messageId}?location_id=${locationId}`;
    const response = await fetch(URL, {
        method: 'POST',
        headers: {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://app.gohighlevel.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    });
    return await response.json();
}

const fetchAMessage = async (messageId: string) => {
    const { locationId, token } = await getAuthHeaders();
    const url = `https://services.leadconnectorhq.com/conversations/messages/${messageId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', Accept: 'application/json' }
    });
    return await response.json();
}