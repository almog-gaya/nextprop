import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Next.js 15 requires dynamic params to be handled properly
        const { id } = await params;
        const body = await request.json();
        const { stageId, actionType } = body;
        
        if (!id) {
            return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
        }

        if (!stageId) {
            return NextResponse.json({ error: 'Target stage ID is required' }, { status: 400 });
        }

        const data = await fetchWithErrorHandling(() => moveOpportunity(id, stageId));
        
        return NextResponse.json({ 
            success: true, 
            message: 'Lead moved successfully',
            data 
        }, { status: 200 });
    } catch (error: any) {
        console.error('Move opportunity error:', error);
        return NextResponse.json({ 
            error: 'Failed to move lead', 
            message: error.message 
        }, { status: 500 });
    }
}

const moveOpportunity = async (opportunityId: string, pipelineStageId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    
    if (!token?.value) {
        throw new Error('No authentication token found');
    }

    // First, get the opportunity to preserve other fields
    const getUrl = `https://services.leadconnectorhq.com/opportunities/${opportunityId}`;
    const getOptions = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token.value}`,
            Version: '2021-07-28',
            Accept: 'application/json'
        }
    };

    const getResponse = await fetch(getUrl, getOptions);
    if (!getResponse.ok) {
        const errorData = await getResponse.json();
        throw new Error(`Failed to get opportunity: ${errorData.message || getResponse.statusText}`);
    }
    
    const opportunity = await getResponse.json();
    
    // Fix: Only send the specific fields needed for the update
    const updateData = {
        pipelineId: opportunity.pipelineId,
        locationId: opportunity.locationId,
        name: opportunity.name,
        pipelineStageId,
        status: opportunity.status,
        contactId: opportunity.contactId,
        monetaryValue: opportunity.monetaryValue,
        assignedTo: opportunity.assignedTo,
        customFields: opportunity.customFields
    };
    
    // Then update only the stage
    const url = `https://services.leadconnectorhq.com/opportunities/${opportunityId}`;
    const options = {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token.value}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(updateData)
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update opportunity: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} 