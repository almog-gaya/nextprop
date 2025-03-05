import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

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
    const data = await fetchWithErrorHandling(await createOpportunity(
        pipelineId,
        locationId,
        name,
        pipelineStageId,
        status,
        contactId,
        monetaryValue,
        assignedTo,
        customFields,
    ),
    );
    return NextResponse.json(data);
}

const createOpportunity = async (
    pipelineId: string,
    locationId: string,
    name: string,
    pipelineStageId: string,
    status: string,
    contactId: string,
    monetaryValue: number,
    assignedTo: string,
    customFields: any[]
) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    
    const url = 'https://services.leadconnectorhq.com/opportunities/';
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token?.value}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: '{"pipelineId":"VDm7RPYC2GLUvdpKmBfC","locationId":"ve9EPM428h8vShlRW1KT","name":"First Opps","pipelineStageId":"7915dedc-8f18-44d5-8bc3-77c04e994a10","status":"open","contactId":"mTkSCb1UBjb5tk4OvB69","monetaryValue":220,"assignedTo":"082goXVW3lIExEQPOnd3","customFields":[{"id":"6dvNaf7VhkQ9snc5vnjJ","key":"my_custom_field","field_value":"9039160788"}]}'
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}
