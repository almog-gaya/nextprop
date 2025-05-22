import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body || Object.keys(body).length === 0) {
            return NextResponse.json(
                { error: "Request body is required" },
                { status: 400 }
            );
        }

        const data = await createSubAccount(body);
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error("POST Error:", error);
        return NextResponse.json(
            {
                error: error.message || "Internal Server Error",
                details: error.details || null
            },
            { status: error.status || 500 }
        );
    }
}

const createSubAccount = async (data: any) => {
    try {
        const agencyToken = process.env.AGENCY_API_KEY;
        if (!agencyToken) {
            throw Object.assign(new Error("Agency API key not configured"), { status: 500 });
        }

        console.log(`Agency Token: ${agencyToken}`);
        console.log(`[SubAccount] ${JSON.stringify(data)} [SubAccount]`);
 

        const response = await fetch('https://rest.gohighlevel.com/v1/locations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyToken}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseBody = await response.json();

        if (!response.ok) {
            throw Object.assign(new Error(responseBody.message || 'Failed to create subaccount'), {
                status: response.status,
                details: responseBody
            });
        }

        const locationId = responseBody.id;
        /// make a mock delay of 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            ...responseBody,
            locationId,
        };
    } catch (error: any) {
        console.error("Create SubAccount Error:", error);
        throw error;
    }
}