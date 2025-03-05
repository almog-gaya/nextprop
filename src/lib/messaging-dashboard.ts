import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { sendSMS, storeIncomingMessage } from './twilio';
import { Business, Message, MessageCreate } from '../types/database';
import './server-only'; // Mark this file as server-only

/**
 * Get all conversations for a business by associated phone numbers
 */
export async function getBusinessConversations(businessId: string) {
  try {
    // Get the business
    const { data, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, phone_number, custom_twilio_number')
      .eq('id', businessId);

    if (businessError) {
      console.error('Error fetching business:', businessError);
      throw new Error('Business not found');
    }

    // Check if we have at least one business
    if (!data || data.length === 0) {
      throw new Error('Business not found');
    }

    // Use the first business record
    const business = data[0];

    // Find the phone number to use
    const businessPhone = business.custom_twilio_number || business.phone_number;
    
    if (!businessPhone) {
      throw new Error('Business has no phone number');
    }

    // Get unique contacts who have sent or received messages with this business
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('from_number, to_number, created_at, body')
      .or(`from_number.eq.${businessPhone},to_number.eq.${businessPhone}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Could not fetch conversations');
    }

    // Create a map of conversations by contact number
    const conversations = new Map<string, any>();

    messages.forEach(message => {
      // Determine which number is the contact (not the business)
      const contactNumber = message.from_number === businessPhone 
        ? message.to_number 
        : message.from_number;
      
      // If this contact isn't in our map yet, add it
      if (!conversations.has(contactNumber)) {
        conversations.set(contactNumber, {
          id: contactNumber, // Using the phone number as the conversation ID
          contactNumber,
          businessId: business.id,
          businessName: business.name,
          lastMessage: message.body,
          lastMessageDate: message.created_at,
          // Direction: 'inbound' if the contact sent it, 'outbound' if business sent it
          direction: message.from_number === contactNumber ? 'inbound' : 'outbound'
        });
      }
    });

    // Convert map to array and sort by most recent message
    return Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
  } catch (error) {
    console.error('Error in getBusinessConversations:', error);
    throw error;
  }
}

/**
 * Get all messages for a specific conversation (contact number)
 */
export async function getConversationMessages(conversationId: string) {
  try {
    // The conversation ID is the contact's phone number
    const contactNumber = conversationId;

    // First find businesses that might be involved in this conversation
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, phone_number, custom_twilio_number');

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      throw new Error('Could not fetch businesses');
    }

    // Find all potential business phone numbers
    const businessPhones = businesses.map(b => b.custom_twilio_number || b.phone_number)
      .filter(Boolean) as string[];

    if (businessPhones.length === 0) {
      throw new Error('No business phone numbers found');
    }

    // Find all messages between this contact and any business
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*, businesses:business_id(id, name)')
      .or(
        businessPhones.map(phone => 
          `and(from_number.eq.${contactNumber},to_number.eq.${phone}),and(from_number.eq.${phone},to_number.eq.${contactNumber})`
        ).join(',')
      )
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Could not fetch messages');
    }

    return messages;
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    throw error;
  }
}

/**
 * Get all businesses
 */
export async function getAllBusinesses() {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching businesses:', error);
      throw new Error('Could not fetch businesses');
    }

    return data;
  } catch (error) {
    console.error('Error in getAllBusinesses:', error);
    throw error;
  }
}

/**
 * Get business by user ID (each user corresponds to a business)
 */
export async function getBusinessByUserId(userId: string) {
  try {
    // Removed .single() to handle multiple businesses
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching business by user ID:', error);
      return null;
    }

    // If we have at least one business, return the first one
    if (data && data.length > 0) {
      console.log(`Found ${data.length} businesses for user ${userId}, returning the first one:`, data[0]);
      return data[0];
    }

    console.log(`No businesses found for user ${userId}`);
    return null;
  } catch (error) {
    console.error('Error in getBusinessByUserId:', error);
    throw error;
  }
}

/**
 * Create a new business for a user
 */
export async function createBusinessForUser(
  userId: string, 
  businessData: Partial<Business>
) {
  try {
    const newBusiness = {
      ...businessData,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('businesses')
      .insert(newBusiness)
      .select();

    if (error) {
      console.error('Error creating business:', error);
      throw new Error('Could not create business');
    }

    // Return the first item if we have results
    if (data && data.length > 0) {
      return data[0];
    }

    throw new Error('Could not create business: No data returned');
  } catch (error) {
    console.error('Error in createBusinessForUser:', error);
    throw error;
  }
}

/**
 * Get all conversations from Supabase
 * A conversation is represented by the most recent message for each unique phone number
 */
export async function getConversations(businessId?: string, limit = 50) {
  try {
    // First we need to get all unique numbers that have messages
    const { data: uniqueNumbers, error: numbersError } = await supabase
      .from('messages')
      .select('from_number, to_number')
      .order('created_at', { ascending: false })
      .limit(100); // Get more than we need to filter

    if (numbersError) throw numbersError;
    
    // Create a unique set of phone numbers
    const phoneNumbers = new Set<string>();
    const conversations: any[] = [];
    
    // Process each message to extract unique phone numbers
    // and find the most recent message for each number pair
    if (uniqueNumbers) {
      const processedPairs = new Set<string>();
      
      for (const msg of uniqueNumbers) {
        // For each message, create a key for the conversation
        // This ensures we treat messages between the same 2 numbers as one conversation
        const fromNumber = msg.from_number;
        const toNumber = msg.to_number;
        const pairKey = [fromNumber, toNumber].sort().join('_');
        
        // Skip if we've already processed this number pair
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        // Get the most recent message for this conversation
        const { data: recentMessages, error: msgError } = await supabase
          .from('messages')
          .select('*, business:business_id(name)')
          .or(`from_number.eq.${fromNumber},to_number.eq.${fromNumber}`)
          .or(`from_number.eq.${toNumber},to_number.eq.${toNumber}`)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (msgError) throw msgError;
        
        if (recentMessages && recentMessages.length > 0) {
          const recentMsg = recentMessages[0];
          
          // Determine if this is an external number (not our Twilio number)
          const externalNumber = recentMsg.direction === 'inbound' 
            ? recentMsg.from_number 
            : recentMsg.to_number;
          
          // Add the conversation
          conversations.push({
            id: pairKey, // Use the pair key as the conversation ID
            contactId: pairKey,
            phone: externalNumber,
            lastMessageBody: recentMsg.body || '',
            lastMessageType: 'SMS',
            type: 'SMS',
            unreadCount: 0, // We'll implement read/unread status later
            fullName: `Contact: ${externalNumber}`,
            contactName: `Contact: ${externalNumber}`,
            email: '',
            lastMessageDate: recentMsg.created_at,
            business: recentMsg.business
          });
        }
      }
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
    });
    
    // Limit to requested number
    return { conversations: conversations.slice(0, limit) };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(messageData: {
  message: string;
  fromNumber: string;
  toNumber: string;
  businessId?: string;
}) {
  try {
    const { message, fromNumber, toNumber, businessId } = messageData;
    
    // Send the SMS using our Twilio function
    const result = await sendSMS(toNumber, message, businessId);
    
    return {
      conversationId: `${fromNumber}_${toNumber}`.split('_').sort().join('_'),
      messageId: result.sid,
      msg: 'Message sent successfully.'
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all businesses for dropdown selection
 * In this case, each authenticated user is a business, so we show all businesses
 */
export async function getBusinessesForMessaging() {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching businesses for messaging:', error);
    throw error;
  }
} 