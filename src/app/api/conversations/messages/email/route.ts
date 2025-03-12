import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = false;

const log = (message: string, data?: any) => {
    if (ENABLE_VERBOSE_LOGGING) {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }
};

// Only show actual errors in console
const logError = (message: string, error?: any) => {
    console.error(message, error);
};

export async function GET(request: NextRequest

) {
    try {


        const searchParams = request.nextUrl.searchParams;
        const messageId = searchParams.get('id');
        if (!messageId) throw new Error('Invalid message Id');

        log('Fetching conversations from GHL API');
        // Try to get real data
        let data = await getEmailMessage(messageId);

        return NextResponse.json({
            ...data.emailMessage
        });
    } catch (error) {
        logError("Error fetching conversations:", error);
        // Fallback to mock data
        // const mockData = await getMockConversations('all', 'desc', 'last_message_date');
        return NextResponse.json({})
    }
}
const getEmailMessage = async (
    messageId: string,
) => {
    try {
        const { token } = await getAuthHeaders();

        if (!token) {
            return NextResponse.json({ error: 'Authentication error: No access token' }, { status: 401 });
        }

        if (!token) {
            return { error: 'No access token available' };
        }

        const url = `https://services.leadconnectorhq.com/conversations/messages/email/${messageId}`;

        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Version: '2021-04-15',
                Accept: 'application/json'
            }
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            logError(`Error fetching conversations: ${response.status} - ${errorText}`);
            return { error: `API Error: ${response.status}`, message: errorText };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        logError("Error fetching conversations:", error);
        return { error: "Failed to fetch conversations", details: error };
    }
};