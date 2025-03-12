import { NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';
import { refreshTokenIdBackend } from '@/utils/authUtils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const chartType = searchParams.get('chartType');
    const comparisonStartDate = searchParams.get('comparisonStartDate');
    const comparisonEndDate = searchParams.get('comparisonEndDate');
    const assignedTo = searchParams.get('assignedTo');
    const dateProperty = searchParams.get('dateProperty');

    // Validate required parameters
    if (!startDate || !endDate || !chartType) {
        return NextResponse.json(
            { error: 'Missing required parameters: startDate, endDate, and chartType are required' },
            { status: 400 }
        );
    }

    const data = await fetchWithErrorHandling(() => 
        getCustomCharts({
            startDate,
            endDate,
            chartType,
            comparisonStartDate: comparisonStartDate || undefined,
            comparisonEndDate: comparisonEndDate || undefined,
            assignedTo: assignedTo || '',
            dateProperty: dateProperty || 'last_status_change_date'
        })
    );

    console.log(`[Report]: `, data);
    return NextResponse.json(data);
}

// Adding POST method to support body payload
export async function POST(request: Request) {
    const body = await request.json();
    
    const {
        startDate,
        endDate,
        chartType,
        comparisonStartDate,
        comparisonEndDate,
        assignedTo,
        dateProperty
    } = body;

    // Validate required parameters
    if (!startDate || !endDate || !chartType) {
        return NextResponse.json(
            { error: 'Missing required parameters: startDate, endDate, and chartType are required' },
            { status: 400 }
        );
    }

    const data = await fetchWithErrorHandling(() => 
        getCustomCharts({
            startDate,
            endDate,
            chartType,
            comparisonStartDate: comparisonStartDate || undefined,
            comparisonEndDate: comparisonEndDate || undefined,
            assignedTo: assignedTo || '',
            dateProperty: dateProperty || 'last_status_change_date'
        })
    );

    console.log(`[Report]: `, data);
    return NextResponse.json(data);
}

interface ChartParams {
    startDate: string;
    endDate: string;
    chartType: string;
    comparisonStartDate?: string;
    comparisonEndDate?: string;
    assignedTo?: string;
    dateProperty?: string;
}

const getCustomCharts = async ({
    startDate,
    endDate,
    chartType,
    comparisonStartDate,
    comparisonEndDate,
    assignedTo = '',
    dateProperty = 'last_status_change_date'
}: ChartParams) => {
    const { locationId } = await getAuthHeaders();
    const tokenId = (await refreshTokenIdBackend()).id_token;
    const url = `https://backend.leadconnectorhq.com/reporting/dashboards/custom?locationId=${locationId}`;

    const headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Baggage": "sentry-environment=production,sentry-release=86dd6da2d904e841613a262a22a5a8e48c10f0d8,sentry-public_key=c67431ff70d6440fb529c2705792425f,sentry-trace_id=55b701cb671948debe365b5b6da08119",
        "Channel": "APP",
        "Content-Type": "application/json",
        "DNT": "1",
        "Origin": "https://app.gohighlevel.com",
        "Priority": "u=1, i",
        "Referer": "https://app.gohighlevel.com/",
        "Sec-CH-UA": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": "\"macOS\"",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Sentry-Trace": "55b701cb671948debe365b5b6da08119-8b35dbee3f7aac8b",
        "Source": "WEB_USER",
        "Token-ID": tokenId,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "Version": "2021-04-15"
    };

    const payload = {
        chartType,
        startDate,
        endDate,
        comparisonStartDate,
        comparisonEndDate,
        assignedTo,
        dateProperty
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    return await response.json();
}