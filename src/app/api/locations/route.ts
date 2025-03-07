import { NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function GET() {
    try {
        const data = await fetchWithErrorHandling(() => getLocation());
         return NextResponse.json({
            success: true,
            message: 'User profile fetched successfully',
            data
        }, { status: 200 });
    } catch (error: any) {

        return NextResponse.json({
            error: 'Failed to fetch user profile',
            message: error.message
        }, { status: 500 });
    }
}

const getLocation = async () => {
    const { locationId, token } = await getAuthHeaders();

    const url = `https://services.leadconnectorhq.com/locations/${locationId}`;
    const options = {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }
    };

    const response = await fetch(url, options);
    const body = await response.json();

    if (!response.ok) {
        throw new Error(body.message || 'Failed to fetch location');
    }
    return body.location;
}