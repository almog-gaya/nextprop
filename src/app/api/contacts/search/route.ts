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
        const pipelineName = url.searchParams.get('pipelineName') || '';
        const stageId = url.searchParams.get('stageId') || '';
        const stageName = url.searchParams.get('stageName') || '';

        console.log(`Search request - Type: ${type}, Pipeline: ${pipelineId}, Stage: ${stageId}, Page: ${currentPage}`);

        let result;
        if (type === 'pipeline' && pipelineId) {
            result = await searchContacts({
                locationId,
                tokenId,
                page: parseInt(currentPage),
                limit: parseInt(limit),
                pipelineId,
                pipelineName: pipelineName,
                stageId: (stageId && stageId !== 'all') ? stageId : undefined,
                stageName: (stageName && stageName !== 'All') ? stageName : undefined
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
    pipelineName,
    stageId,
    stageName
}: {
    locationId: string;
    tokenId: string;
    page: number;
    limit: number;
    pipelineId: string;
    pipelineName: string;
    stageId?: string;
    stageName?: string;
}) {
    const filters = [];

    // Add pipeline stage filter
    filters.push({
        id: "1",
        filterName: "Pipeline Stage",
        filterName_lc: "pipeline_stage",
        extras: {},
        selectedOption: {
            filterName: "Pipeline Stage",
            filterName_lc: "pipeline_stage",
            condition: "is",
            firstValue: { key: pipelineId, value: pipelineName },
            ...(stageId && stageName ? { secondValue: { key: stageId, value: stageName } } : {})
        }
    });

    const payload = {
        locationId,
        page,
        pageLimit: limit,
        sort: [],
        filters: [
            {
                group: "OR",
                filters: [
                    {
                        group: "AND",
                        filters
                    }
                ]
            }
        ]
    };

    console.log(`Searching contacts - Pipeline: ${pipelineId}${stageId ? `, Stage: ${stageId}` : ''}`);
    console.log('Search payload:', JSON.stringify(payload, null, 2));

    try {
        const headers = buildHeaders(tokenId);
        const response = await fetch("https://backend.leadconnectorhq.com/contacts/search/2", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`error: ${errorText}`);
        }

        const data = await response.json();
        console.log(`API returned ${data.contacts?.length || 0} contacts, total: ${data.total || 'unknown'}`);
        return data;
    } catch (error) {
        console.error('Error searching contacts:', error);
        throw error;
    }
}

const buildHeaders = (tokenId: string) => {
    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "baggage": "sentry-environment=production,sentry-release=a9ea33ccf48e211966db91418cf5d9a866eee67c,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=1416625bc1fe4208886f7ebd4b84fc44",
        "channel": "APP",
        "content-type": "application/json",
        "dnt": "1",
        "origin": "https://app.gohighlevel.com",
        "priority": "u=1, i",
        "referer": "https://app.gohighlevel.com/",
        "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sentry-trace": "1416625bc1fe4208886f7ebd4b84fc44-a81839fdd5d3bba1",
        "source": "WEB_USER",
        "token-id": tokenId,
        "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
        "Version": "2021-07-28"
      };
      return headers;
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