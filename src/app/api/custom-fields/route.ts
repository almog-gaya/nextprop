
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthHeaders } from '@/lib/enhancedApi';

export async function GET(request: Request) {
    const { token, locationId } = await getAuthHeaders();

    try {
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28'
        }

        console.log(`headers>>: `, JSON.stringify(headers));
        console.log(`locationid:>> `, locationId);
        const url = `https://services.leadconnectorhq.com/locations/${locationId}/customFields`;

        // Direct fetch to GHL API
        const response = await fetch(url, {
            headers
        });


        if (!response.ok) {
            const error = await response.json();
            console.log(`Error: `, error);
            return NextResponse.json({ error: error.message }, { status: response.status });
        }
        const data = {
            "customFields": [
                {
                    "_id": "ECqyHR21ZJnSMolxlHpU",
                    "dataType": "STANDARD_FIELD",
                    "dateAdded": "2023-11-22T19:50:45.028Z",
                    "documentType": "field",
                    "fieldKey": "contact.type",
                    "locationId": "N3z6NPutyGGVRyOxjSDy",
                    "model": "contact",
                    "parentId": "xcD0Dw9Rf2K78KcNQkXs",
                    "position": 300,
                    "standard": true,
                    "fieldsCount": 0,
                    "id": "ECqyHR21ZJnSMolxlHpU",
                    "name": "Contact Type",
                    "picklistOptions": [
                        {
                            "value": "lead",
                            "name": "Lead"
                        },
                        {
                            "value": "customer",
                            "name": "Customer"
                        }
                    ]
                }
            ]
        };
        const processedData = {
            customFields: (data.customFields || []).map((customField: any) => {
                let name = customField.name || null;
                if (!name && customField.fieldKey) {
                    name = customField.fieldKey;
                }
                return {
                    ...customField,
                    name
                };
            })
        };

        return NextResponse.json(processedData);
    } catch (error: any) {
        console.error('Error in contacts API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contacts' },
            { status: 500 }
        );
    }
}