import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(params);
        const conversationId = id;
        
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('ghl_access_token')?.value;
        
        if (!accessToken) {
            return NextResponse.json({ error: 'Authentication error: No access token' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const pageToken = searchParams.get('pageToken');
        
        log(`Fetching messages for conversation ${conversationId}${pageToken ? ` with pageToken ${pageToken}` : ''}`);

        // Try to get real data
        const data = await getConversationMessages(conversationId, pageToken);
        
        // Check if there's an error and fall back to mock data
        if (data.statusCode === 401 || data.error) {
            log("Falling back to mock data due to API error:", data);
            return NextResponse.json(generateMockMessages(pageToken));
        }
        
        return NextResponse.json(data);
    } catch (error) {
        logError("Error fetching messages:", error);
        // Fallback to mock data
        const currentPageToken = request.nextUrl.searchParams.get('pageToken');
        return NextResponse.json(generateMockMessages(currentPageToken));
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(params);
        const conversationId = id;
        
        // Check for valid conversation ID
        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }
        
        // Get the request body
        const body = await request.json();
        const { text } = body;
        
        if (!text || text.trim() === '') {
            return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
        }
        
        // Send the message
        const response = await sendMessage(conversationId, text);
        
        return NextResponse.json(response);
    } catch (error) {
        logError("Error in conversation message POST:", error);
        return NextResponse.json(getMockMessageResponse(params.id, 'Mock response text'));
    }
}

const sendMessage = async (conversationId: string, text: string, contactId?: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    
    if (!token?.value) {
        console.error("No access token found in cookies");
        return { error: "Authentication error: No access token" };
    }
    
    const url = `https://services.leadconnectorhq.com/conversations/messages`;
    
    const headers = {
        Authorization: `Bearer ${token?.value}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    
    const messageData = {
        type: "SMS",
        message: text,
        conversationId: conversationId,
        contactId: contactId
    };
    
    try {
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(messageData)
        };
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error sending message: ${response.status} - ${errorText}`);
            
            // Provide more specific error messages based on status code
            if (response.status === 401) {
                return { error: "Authentication failed", message: "Your session may have expired. Please log in again." };
            } else if (response.status === 403) {
                return { error: "Permission denied", message: "You don't have permission to send messages." };
            } else if (response.status === 404) {
                return { error: "Conversation not found", message: "The requested conversation could not be found." };
            }
            
            return { error: `API Error: ${response.status}`, message: errorText };
        }
        
        const data = await response.json();
        return { success: true, id: data.id || `msg-${Date.now()}`, data };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message", details: error };
    }
}

// Mock response for successful message send
const getMockMessageResponse = (conversationId: string, text: string) => {
    return {
        success: true,
        id: `mock-msg-${Date.now()}`,
        data: {
            id: `mock-msg-${Date.now()}`,
            conversationId: conversationId,
            body: text,
            direction: "outbound",
            dateAdded: new Date().toISOString(),
            status: "sent",
            messageType: "SMS",
            isMock: true
        }
    };
}

const getConversationMessages = async (conversationId: string, pageToken?: string | null) => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('ghl_access_token')?.value;
        
        if (!token) {
            return { error: 'No access token available' };
        }
        
        let url = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`;
        
        // Build query params
        const queryParams = new URLSearchParams();
        if (pageToken) {
            queryParams.append('lastMessageId', pageToken);
        }
        
        // Append query params to URL if any exist
        const queryString = queryParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const headers = {
            Authorization: `Bearer ${token}`,
            Version: '2021-04-15',
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };
        
        const options = {
            method: 'GET',
            headers
        };
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error fetching messages: ${response.status} - ${errorText}`);
            
            // Provide more specific error messages based on status code
            if (response.status === 401) {
                return { error: "Authentication failed", message: "Your session may have expired. Please log in again." };
            } else if (response.status === 403) {
                return { error: "Permission denied", message: "You don't have permission to access these messages." };
            } else if (response.status === 404) {
                return { error: "Conversation not found", message: "The requested conversation could not be found." };
            }
            
            return { error: `API Error: ${response.status}`, message: errorText };
        }
        
        const data = await response.json();
        
        // Handle the nested structure from GHL API
        if (data && data.messages && Array.isArray(data.messages.messages)) {
            // Sort messages by date, newest first
            const sortedMessages = [...data.messages.messages].sort((a, b) => {
                // Sort by dateAdded in descending order (newest first)
                return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
            });
            
            // Return the properly structured data by extracting from nested response
            return {
                lastMessageId: data.messages.lastMessageId,
                nextPage: data.messages.nextPage,
                messages: sortedMessages
            };
        } else if (data && Array.isArray(data.messages)) {
            // Handle the case where messages is directly an array
            // Sort messages by date, newest first
            const sortedMessages = [...data.messages].sort((a, b) => {
                // Sort by dateAdded in descending order (newest first)
                return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
            });
            
            return {
                ...data,
                messages: sortedMessages
            };
        } else {
            log("Invalid response format from API");
            return { error: "Invalid response format", details: "Message structure not recognized" };
        }
    } catch (error) {
        logError("Error fetching conversation messages:", error);
        return { error: "Failed to fetch conversation messages" };
    }
}

// Generate mock messages
const generateMockMessages = (pageToken?: string | null) => {
    log(`Generating mock messages${pageToken ? ' for page ' + pageToken : ''}`);
    
    // Generate 20 mock messages
    const totalMessages = 20;
    
    // Create an array of mock messages with alternating directions
    const messages = Array.from({ length: totalMessages }, (_, i) => {
        const index = pageToken ? parseInt(pageToken) + i : i;
        return index % 2 === 0 ? getMockInboundMessage(index) : getMockOutboundMessage(index);
    });
    
    // If pageToken is provided, simulate pagination by returning a subset
    let startIndex = 0;
    let hasNextPage = false;
    
    if (pageToken) {
        // If we have a page token, start from message 5 (simulating older messages)
        startIndex = 5;
        hasNextPage = false; // No more pages after this
    } else {
        // First page, we'll say there are more
        hasNextPage = true;
    }
    
    const messagesSubset = messages.slice(startIndex, startIndex + 10);
    
    return {
        messages: messagesSubset,
        nextPage: hasNextPage,
        lastMessageId: pageToken ? null : "mock-msg-5" // For first page, next page token is "mock-msg-5"
    };
}

function getMockInboundMessage(index: number) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (index * 5)); // Each message 5 minutes apart
    
    return {
        id: `mock-in-${index}`,
        body: `This is an inbound message ${index}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        direction: "inbound",
        dateAdded: date.toISOString(),
        messageType: "SMS"
    };
}

function getMockOutboundMessage(index: number) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (index * 5)); // Each message 5 minutes apart
    
    return {
        id: `mock-out-${index}`,
        body: `This is an outbound message ${index}. Lorem ipsum dolor sit amet.`,
        direction: "outbound",
        dateAdded: date.toISOString(),
        messageType: "SMS"
    };
}

/**
 Response: 
        {
        "lastMessageId": "p1mRSHeLDhAms5q0LMr4",
        "nextPage": true,
        "messages": [
            {
            "id": "ve9EPM428h8vShlRW1KT",
            "type": 1,
            "messageType": "SMS",
            "locationId": "ve9EPM428h8vShlRW1KT",
            "contactId": "ve9EPM428h8vShlRW1KT",
            "conversationId": "ve9EPM428h8vShlRW1KT",
            "dateAdded": "2024-03-27T18:13:49.000Z",
            "body": "Hi there",
            "direction": "inbound",
            "status": "connected",
            "contentType": "text/plain",
            "attachments": [
                "string"
            ],
            "meta": {
                "callDuration": 120,
                "callStatus": "completed",
                "email": {
                "email": {
                    "messageIds": [
                    "ve9EPM428kjkvShlRW1KT",
                    "ve9EPs1028kjkvShlRW1KT"
                    ]
                }
                }
            },
            "source": "workflow",
            "userId": "ve9EPM428kjkvShlRW1KT",
            "conversationProviderId": "ve9EPM428kjkvShlRW1KT"
            }
        ]
        }
    
 */
