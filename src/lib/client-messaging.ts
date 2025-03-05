/**
 * Client-side messaging functions that use API endpoints
 * instead of directly importing server-only Twilio code
 */

/**
 * Send a message using the API endpoint
 */
export async function sendMessage(to: string, body: string, businessId?: string) {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, body, businessId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all conversations for a business
 */
export async function getBusinessConversations(businessId: string) {
  try {
    const response = await fetch(`/api/messages?businessId=${businessId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get conversations');
    }

    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get messages');
    }

    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

/**
 * Get all businesses
 */
export async function getAllBusinesses() {
  try {
    const response = await fetch('/api/messages');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get businesses');
    }

    const data = await response.json();
    return data.businesses;
  } catch (error) {
    console.error('Error getting businesses:', error);
    throw error;
  }
} 