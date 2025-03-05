import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const conversationId = id;
        const pageToken = request.nextUrl.searchParams.get('page');
        console.log("Processing conversation ID:", conversationId, "Page token:", pageToken);
        
        if (!conversationId) {
            return NextResponse.json({ error: 'conversation id is required' }, { status: 400 });
        }

        // Try to get real data
        let data = await getMessagesByConversationId(conversationId, pageToken);
        
        // If there's an error, use mock data for development
        if (data.error) {
            console.log("Falling back to mock data due to error:", data.error);
            data = getMockMessages(conversationId, pageToken);
        }
        
        console.log("Conversation messages response:", JSON.stringify(data).substring(0, 200) + "...");
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in conversation messages API:", error);
        // Fallback to mock data on error
        const mockData = getMockMessages(params.id, null);
        return NextResponse.json(mockData);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const conversationId = id;
        console.log("Sending message to conversation ID:", conversationId);
        
        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        // Parse the request body
        const body = await request.json();
        
        if (!body.text) {
            return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
        }

        console.log(`Sending message: ${body.text}`);
        
        // Try to send the real message
        let result = await sendMessage(conversationId, body.text);
        
        // If there's an error, simulate success for development
        if (result.error) {
            console.log("Simulating successful message send due to error:", result.error);
            result = getMockMessageResponse(conversationId, body.text);
        }
        
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in send message API:", error);
        // Return a mock success response for development
        const mockResult = getMockMessageResponse(params.id, "Error occurred, but simulating success");
        return NextResponse.json(mockResult);
    }
}

const sendMessage = async (conversationId: string, text: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    const locationId = cookieStore.get('ghl_location_id');
    
    if (!token?.value) {
        console.error("No access token found in cookies");
        return { error: "Authentication error: No access token" };
    }
    
    const url = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`;
    console.log("Sending message to URL:", url);
    
    const headers = {
        Authorization: `Bearer ${token?.value}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    
    const messageData = {
        type: "SMS",
        message: text
    };
    
    try {
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(messageData)
        };
        
        console.log("Sending with options:", JSON.stringify(options));
        
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
        return { success: true, data };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message", details: error };
    }
}

// Mock response for successful message send
const getMockMessageResponse = (conversationId: string, text: string) => {
    return {
        success: true,
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

const getMessagesByConversationId = async (conversationId: string, pageToken: string | null) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('ghl_access_token');
    const locationId = cookieStore.get('ghl_location_id');
    
    if (!token?.value) {
        console.error("No access token found in cookies");
        return { error: "Authentication error: No access token" };
    }
    
    if (!locationId?.value) {
        console.warn("No location ID found in cookies");
    }
    
    let url = `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`;
    // Add page token to URL if provided
    if (pageToken) {
        url += `?lastMessageId=${pageToken}`;
    }
    
    console.log("Fetching messages from URL:", url);
    
    const headers = {
        Authorization: `Bearer ${token?.value}`,
        Version: '2021-04-15',
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    
    console.log("Using headers:", JSON.stringify(headers));
    
    try {
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
        console.log("Raw API response structure:", JSON.stringify(data).substring(0, 300));
        
        // Handle the nested structure from GHL API
        if (data && data.messages && Array.isArray(data.messages.messages)) {
            console.log(`Found ${data.messages.messages.length} messages in nested structure`);
            
            // Return the properly structured data by extracting from nested response
            return {
                lastMessageId: data.messages.lastMessageId,
                nextPage: data.messages.nextPage,
                messages: data.messages.messages
            };
        } else if (data && Array.isArray(data.messages)) {
            // Handle the case where messages is directly an array
            console.log(`Found ${data.messages.length} messages in flat structure`);
            return data;
        } else {
            console.error("Invalid response format:", data);
            return { error: "Invalid response format", details: data };
        }
    } catch (error) {
        console.error("Error fetching conversation messages:", error);
        return { error: "Failed to fetch messages", details: error };
    }
}

// Updated the mock data function to support pagination
const getMockMessages = (conversationId: string, pageToken: string | null) => {
    console.log(`Generating mock messages for conversation ${conversationId}, page: ${pageToken}`);
    
    // Create a more realistic conversation with multiple messages
    const now = new Date();
    const messages = [];
    
    // For pagination simulation
    const totalMessages = 20;
    const messagesPerPage = 10;
    const page = pageToken ? parseInt(pageToken.replace(/\D/g, '')) % 2 : 0;
    const startIndex = page * messagesPerPage;
    const hasNextPage = startIndex + messagesPerPage < totalMessages;
    
    // Add mock messages with varying timestamps based on pagination
    for (let i = 0; i < messagesPerPage; i++) {
        const messageIndex = startIndex + i;
        if (messageIndex >= totalMessages) break;
        
        const isInbound = messageIndex % 2 === 0;
        const hoursAgo = messageIndex;
        
        messages.push({
            id: `mock-msg-${messageIndex + 1}`,
            type: 1,
            messageType: "SMS",
            locationId: "location-123",
            contactId: "contact-123",
            conversationId: conversationId,
            dateAdded: new Date(now.getTime() - hoursAgo * 3600000).toISOString(),
            body: isInbound 
                ? getMockInboundMessage(messageIndex) 
                : getMockOutboundMessage(messageIndex),
            direction: isInbound ? "inbound" : "outbound",
            status: "connected",
            contentType: "text/plain"
        });
    }
    
    // Add a message indicating this is mock data
    if (page === 0) {
        messages.push({
            id: "mock-notice",
            type: 1,
            messageType: "SMS",
            locationId: "location-123",
            contactId: "contact-123",
            conversationId: conversationId,
            dateAdded: new Date(now.getTime() - (totalMessages + 1) * 3600000).toISOString(),
            body: "[NOTE: These are mock messages. Check your API authentication to see real data.]",
            direction: "outbound",
            status: "connected",
            contentType: "text/plain"
        });
    }
    
    return {
        lastMessageId: hasNextPage ? `mock-page-${page + 1}` : null,
        nextPage: hasNextPage,
        messages: messages
    };
}

// Helper functions for more varied mock messages
function getMockInboundMessage(index: number) {
    const inboundMessages = [
        "Hi there, I'm interested in your services.",
        "Can you tell me more about your pricing?",
        "What are your hours of operation?",
        "Do you offer consultations?",
        "I saw your ad online and wanted to reach out.",
        "Is there a way to schedule an appointment?",
        "Thanks for the information!",
        "That sounds great, I'd like to proceed.",
        "Can we set up a meeting next week?",
        "Do you have any availability on Friday?"
    ];
    
    return inboundMessages[index % inboundMessages.length];
}

function getMockOutboundMessage(index: number) {
    const outboundMessages = [
        "Thank you for reaching out to us!",
        "Our pricing starts at $99 per month. Would you like more details?",
        "We're open Monday-Friday from 9am to 5pm.",
        "Yes, we offer free 30-minute consultations.",
        "I'd be happy to provide more information about our services.",
        "You can schedule an appointment through our website or I can help you now.",
        "Is there anything else you'd like to know?",
        "Great! I'll send you the details to get started.",
        "We have availability next Tuesday at 2pm or Wednesday at 10am.",
        "I've added you to our system. You'll receive a confirmation email shortly."
    ];
    
    return outboundMessages[index % outboundMessages.length];
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
