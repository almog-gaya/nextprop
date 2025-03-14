import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        console.log(`DELETE request received with id: ${id}`);

        if (!id) {
            return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
        }

        const data = await fetchWithErrorHandling(await deleteOpportunityById(id));
        return NextResponse.json({
            success: true,
            message: 'Opportunity deleted successfully',
            data
        }, { status: 200 });
    } catch (error: any) {
        console.error('Delete opportunity error:', error);
        return NextResponse.json({
            error: 'Failed to delete opportunity',
            message: error.message
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
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
        console.log(`PUT request received with id: ${id}`);

        if (!id) {
            return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
        }

        const data = await fetchWithErrorHandling(await updateOpportunityById(
            id,
            pipelineId,
            locationId,
            name,
            pipelineStageId,
            status,
            contactId,
            monetaryValue,
            assignedTo,
            customFields
        ));
        return NextResponse.json({
            success: true,
            message: 'Lead updated successfully',
            data
        }, { status: 200 });
    } catch (error: any) {
        console.error('Update opportunity error:', error);
        return NextResponse.json({
            error: 'Failed to update opportunity',
            message: error.message
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    console.log(`GET request received with id: ${id}`);

    const data = await fetchWithErrorHandling(() => getOpportunityById(id));
    return NextResponse.json(data);
}
const updateOpportunityById = async (
    opportunityId: string,
    pipelineId: string,
    locationId: string,
    name: string,
    pipelineStageId: string,
    status: string,
    contactId: string,
    monetaryValue: number,
    assignedTo: string,
    customFields: any
) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');

    const url = `https://services.leadconnectorhq.com/opportunities/${opportunityId}`;
    const options = {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token?.value}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            pipelineId,
            locationId,
            name,
            pipelineStageId,
            status,
            contactId,
            monetaryValue,
            assignedTo,
            customFields
        })
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}

const deleteOpportunityById = async (opportunityId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');

    const url = `https://services.leadconnectorhq.com/opportunities/${opportunityId}`;
    const options = {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token?.value}`,
            Version: '2021-07-28',
            Accept: 'application/json'
        }
    };
    const response = await fetch(url, options);

    // Check if response is OK
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse JSON, but handle empty response
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
}

const getOpportunityById = async (opportunityId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    const url = `https://services.leadconnectorhq.com/opportunities/${opportunityId}`;
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token?.value}`,
            Version: '2021-07-28',
            Accept: 'application/json'
        }
    };
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`OpportunityById: ${JSON.stringify(data)}`)
    return data;
}