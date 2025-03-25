import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    if (!API_TOKEN) {
        console.error("API_TOKEN is not set in environment variables");
        return NextResponse.json(
            { success: false, error: "Server configuration error" },
            { status: 500 }
        );
    }

    try {
        const params = await req.json();
        const { limit, link } = params;

        const data = await redfinSearchScraperByLink(API_TOKEN, limit, link);

        return NextResponse.json({
            success: true,
            data,
        });


    } catch (error) {
        console.error("Error running Apify Actor:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
interface Payload {
    zipCode: string;
    daysOnZillow: string;
    types?: string | null;
}
const buildURL = (payload: Payload): string => {
    const { zipCode, daysOnZillow, types } = payload;

    // Base URL with required zipCode
    const baseURL = `https://www.redfin.com/zipcode/${zipCode}/filter`;

    // Build filter parameters array
    const filters: string[] = [];

    // Add days on market filter (always included as it's required)
    filters.push(`min-days-on-market=${daysOnZillow}`);

    // Add property type filter only if it exists and is not null/undefined
    if (types) {
        filters.push(`property-type=${types}`);
    }

    // Combine base URL with filters
    return `${baseURL}/${filters.join(',')}`;
};
const redfinSearchScraper = async (API_TOKEN: string, limit: number, payload: any) => {
    const API_URL = 'https://api.apify.com/v2/acts/CrtAGwgI5gNhHTCKL/runs';

    /// delete null or empty values from payload
    for (const key in payload) {
        if (payload[key] === null || payload[key] === '') {
            delete payload[key];
        }
    }
    const _payload = {
        "maxItems": limit,
        "maxRequestRetries": 2,
        "proxy": {
            "useApifyProxy": true,
            "apifyProxyGroups": [
                "RESIDENTIAL"
            ]
        },
        "startUrls": [
            buildURL(payload)
        ],
        "maxConcurrency": limit > 50 ? 50 : limit,
        "minConcurrency": 1
    } 
    try {

        const runResponse = await fetch(`${API_URL}?token=${API_TOKEN}&maxItems=${limit ?? 2}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(_payload)
        });

        if (!runResponse.ok) {
            const errorText = await runResponse.text();
            throw new Error(`Run failed with status: ${runResponse.status} - ${errorText}`);
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;

        let runStatus;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusResponse = await fetch(
                `https://api.apify.com/v2/actor-runs/${runId}?token=${API_TOKEN}`
            );

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
            }

            runStatus = await statusResponse.json();
        } while (runStatus.data.status === "RUNNING" || runStatus.data.status === "READY");

        if (runStatus.data.status !== "SUCCEEDED") {
            throw new Error(`Run failed with status: ${runStatus.data.status}`);
        }

        const datasetId = runStatus.data.defaultDatasetId;
        const itemsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${API_TOKEN}`
        );

        if (!itemsResponse.ok) {
            const errorText = await itemsResponse.text();
            throw new Error(`Failed to fetch items: ${itemsResponse.status} - ${errorText}`);
        }

        const items = await itemsResponse.json();
        console.log(`Fetched from Search URLs`, JSON.stringify(items));

        return items;
    } catch (error) {
        console.error('Error in Zillow search scraper:', error);
        throw error;
    }
};

const redfinSearchScraperByLink = async (API_TOKEN: string, limit: number, link: string) => {
    const API_URL = 'https://api.apify.com/v2/acts/CrtAGwgI5gNhHTCKL/runs';


    const _payload = {
        "maxItems": limit,
        "maxRequestRetries": 2,
        "proxy": {
            "useApifyProxy": true,
            "apifyProxyGroups": [
                "RESIDENTIAL"
            ]
        },
        "startUrls": [
            link
        ],
        "maxConcurrency": limit > 50 ? 50 : limit,
        "minConcurrency": 1
    } 
    try {
        const runResponse = await fetch(`${API_URL}?token=${API_TOKEN}&maxItems=${limit ?? 2}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(_payload)
        });

        if (!runResponse.ok) {
            const errorText = await runResponse.text();
            throw new Error(`Run failed with status: ${runResponse.status} - ${errorText}`);
        }

        const runData = await runResponse.json();
        const runId = runData.data.id;

        let runStatus;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusResponse = await fetch(
                `https://api.apify.com/v2/actor-runs/${runId}?token=${API_TOKEN}`
            );

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
            }

            runStatus = await statusResponse.json();
        } while (runStatus.data.status === "RUNNING" || runStatus.data.status === "READY");

        if (runStatus.data.status !== "SUCCEEDED") {
            throw new Error(`Run failed with status: ${runStatus.data.status}`);
        }

        const datasetId = runStatus.data.defaultDatasetId;
        const itemsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${API_TOKEN}`
        );

        if (!itemsResponse.ok) {
            const errorText = await itemsResponse.text();
            throw new Error(`Failed to fetch items: ${itemsResponse.status} - ${errorText}`);
        }

        const items = await itemsResponse.json();
        console.log(`Fetched from Search URLs`, JSON.stringify(items));

        return items;
    } catch (error) {
        console.error('Error in Zillow search scraper:', error);
        throw error;
    }
    
}