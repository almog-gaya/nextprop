import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function POST(request: NextRequest) {
    const {
        pipelineId,
        locationId,
        name,
        pipelineStageId,
        status,
        contactId,
        monetaryValue,
        assignedTo,
        customFields
    } = await request.json();
    const data = await fetchWithErrorHandling(() => createOpportunity(
        pipelineId, 
        name,
        pipelineStageId,
        status,
        contactId,
        monetaryValue,
        assignedTo,
        customFields
    ),
    );
    return NextResponse.json(data);
}

const createOpportunity = async (
    pipelineId: string,
    name: string,
    pipelineStageId: string,
    status: string,
    contactId: string,
    monetaryValue: number,
    assignedTo: string,
    customFields: any[]
) => {
    const { locationId, token } = await getAuthHeaders();

    const url = 'https://services.leadconnectorhq.com/opportunities/';
    const body = {
        pipelineId,
        locationId,
        name,
        pipelineStageId,
        status,
        contactId,
        monetaryValue,
        assignedTo,
        customFields
    }
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(body)
    };
    const response = await fetch(url, options);
    const data = await response.json();
    /// if response not okay throw error
    if (!response.ok) {
        throw new Error(data.message);
    }
    return data;
}
