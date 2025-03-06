import { NextResponse } from "next/server";

export async function POST(
    request: Request,
) {
    const body = await request.json();

    const data = await createSubAccount(body);

    return NextResponse.json(data);



}


const createSubAccount = async (data: any) => {
    const agencyToken = process.env.AGENCY_API_KEY;
    console.log(`Agency Token: ${agencyToken}`);
    console.log(`[SubAccount] ${JSON.stringify(data)} [SubAccount]`);

    const password = data.password;
    delete data.password;
    
    // Add snapshot settings with the specified ID
    data.snapshot = {
        "id": "Y5EDypqp6IRP3QhoWGL4",
        "type": "own"
    };
    
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

    console.log(`[SubAccount] ${JSON.stringify(response)} [SubAccount]`)
    const responseBody = await response.json();

    if (!response.ok) {
        console.log(`SUB account`, responseBody)
        throw new Error(responseBody.message || 'Failed to create subaccount');
    }

    const locationId = responseBody.id;
    const user = await createUser(locationId, password, data);
    return {
        "user": user,
        "location": responseBody
    };
}

const createUser = async (locationId: string, password: string, data: any) => {
    const agencyToken = process.env.AGENCY_API_KEY;
    const url = `https://rest.gohighlevel.com/v1/users/`;
    const payload = {
        "firstName": data.firstName,
        "lastName": data.lastName,
        "email": data.email,
        "password": password,
        "phone": data.phone,
        "type": "account",
        "role": "admin",
        "locationIds": [
            locationId
        ],
        "permissions": {
            "campaignsEnabled": true,
            "campaignsReadOnly": false,
            "contactsEnabled": true,
            "workflowsEnabled": true,
            "triggersEnabled": true,
            "funnelsEnabled": true,
            "websitesEnabled": false,
            "opportunitiesEnabled": true,
            "dashboardStatsEnabled": true,
            "bulkRequestsEnabled": true,
            "appointmentsEnabled": true,
            "reviewsEnabled": true,
            "onlineListingsEnabled": true,
            "phoneCallEnabled": true,
            "conversationsEnabled": true,
            "assignedDataOnly": false,
            "adwordsReportingEnabled": false,
            "membershipEnabled": false,
            "facebookAdsReportingEnabled": false,
            "attributionsReportingEnabled": false,
            "settingsEnabled": true,
            "tagsEnabled": true,
            "leadValueEnabled": true,
            "marketingEnabled": true
        }
    }
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${agencyToken}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload)
    }

    console.log(`[User] ${JSON.stringify(payload)} [User]`);
    const response = await fetch(url, options);
    const responseBody = await response.json();
    console.log(`[User] Response: ${JSON.stringify(responseBody)} [User]`)
    if (!response.ok) {
        throw new Error(responseBody.message || 'Failed to create user');
    }
    return responseBody;
}