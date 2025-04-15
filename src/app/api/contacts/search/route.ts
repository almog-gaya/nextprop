import { getAuthHeaders } from "@/lib/enhancedApi";
import { refreshTokenIdBackend } from "@/utils/authUtils";
import { NextResponse } from "next/server";

/**
 * Search for contacts by name or pipeline/stage
 */
export async function GET(request: Request) {
    try {
        const tokenId = (await refreshTokenIdBackend()).id_token;
        if (!tokenId) {
            console.error('Failed to get auth token');
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const { locationId } = await getAuthHeaders();
        if (!locationId) {
            console.error('Failed to get location ID');
            return NextResponse.json({ error: 'Location ID not found' }, { status: 400 });
        }

        const url = new URL(request.url);
        const name = url.searchParams.get('name') || '';
        const type = url.searchParams.get('type') || '';
        const currentPage = url.searchParams.get('page') || '1';
        const limit = url.searchParams.get('limit') || '100';
        const pipelineId = url.searchParams.get('pipelineId') || '';
        const stageId = url.searchParams.get('stageId') || '';

        console.log(`Search request - Type: ${type}, Pipeline: ${pipelineId}, Stage: ${stageId}, Page: ${currentPage}`);

        let result;
        if (type === 'pipeline' && pipelineId) {
            result = await searchContacts({
                locationId,
                tokenId,
                page: parseInt(currentPage),
                limit: parseInt(limit),
                pipelineId,
                stageId: (stageId && stageId !== 'all') ? stageId : undefined
            });
        } else if (name) {
            result = await searchByName(name, locationId, tokenId, parseInt(currentPage), parseInt(limit));
        } else {
            return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in contacts search API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Search contacts with pipeline and optional stage filter
 */
async function searchContacts({
    locationId,
    tokenId,
    page = 1,
    limit = 100,
    pipelineId,
    stageId
}: {
    locationId: string;
    tokenId: string;
    page: number;
    limit: number;
    pipelineId: string;
    stageId?: string;
}) {
    const filters = [];

    // Add pipeline filter
    filters.push({
        id: "4",
        filterName: "Pipeline",
        filterName_lc: "pipeline",
        extras: {},
        selectedOption: {
            filterName: "Pipeline",
            filterName_lc: "pipeline",
            condition: "is",
            firstValue: [{ key: pipelineId, value: "Selected Pipeline" }]
        }
    });

    // Add stage filter if provided
    if (stageId) {
        filters.push({
            id: "5",
            filterName: "Stage",
            filterName_lc: "stage",
            extras: {},
            selectedOption: {
                filterName: "Stage",
                filterName_lc: "stage",
                condition: "is",
                firstValue: [{ key: stageId, value: "Selected Stage" }]
            }
        });
    }

    const payload = {
        locationId,
        page,
        pageLimit: limit,
        sort: [],
        filters: [{
            group: "AND",
            filters
        }]
    };

    console.log(`Searching contacts - Pipeline: ${pipelineId}${stageId ? `, Stage: ${stageId}` : ''}`);
    console.log('Search payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("https://backend.leadconnectorhq.com/contacts/search/2", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "token-id": tokenId,
                "Version": "2021-07-28"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`API returned ${data.contacts?.length || 0} contacts, total: ${data.total || 'unknown'}`);
        return data;
    } catch (error) {
        console.error('Error searching contacts:', error);
        throw error;
    }
}

/**
 * Search contacts by name
 */
async function searchByName(
    query: string,
    locationId: string,
    tokenId: string,
    page: number,
    limit: number
) {
    const payload = {
        locationId,
        page,
        pageLimit: limit,
        sort: [],
        filters: [{
            group: "OR",
            filters: [{
                group: "AND",
                filters: [{
                    id: "generic",
                    filterName: "generic",
                    filterName_lc: "generic",
                    extras: {},
                    selectedOption: {
                        filterName: "generic",
                        filterName_lc: "generic",
                        condition: "is",
                        firstValue: query,
                        secondValue: "US"
                    }
                }]
            }]
        }]
    };

    try {
        const response = await fetch("https://backend.leadconnectorhq.com/contacts/search/2", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "token-id": tokenId,
                "Version": "2021-07-28"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            throw new Error(`API returned ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching contacts by name:', error);
        throw error;
    }
}