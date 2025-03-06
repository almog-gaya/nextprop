import { fetchWithErrorHandling, getAuthHeaders } from "@/lib/enhancedApi";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
) {
    const body = await request.json();

    try {
        const data = await fetchWithErrorHandling(() => createPipeline(body));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: true, message: error },
            { status: 400 }
        );
    }
}

const createPipeline = async (body: any) => {
    const { locationId, token } = await getAuthHeaders();
    body.locationId = locationId;

    const prodURL = "https://backend.leadconnectorhq.com/opportunities/pipelines";
    const headers = {
        "Authorization": `Bearer ${token}`, 
        "accept" : "application/json, text/plain, */*",
        "Version": "2021-07-28",
        "source": "WEB_USER",
        "origin" : "https://app.gohighlevel.com",
        "referer": "https://app.gohighlevel.com/",
        "priority": "u=1, i",
        "channel": "APP"
    }
    console.log(`[Headers] : `, JSON.stringify(headers))
    console.log(`[CreatePipeline]`, JSON.stringify(body))
    const response = await fetch(prodURL, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });

    console.log(`[CreatePipeline]`, `response: ${JSON.stringify(response)}`)

    return await response.json();
}

