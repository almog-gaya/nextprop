import { Twilio } from 'twilio';
import { supabase } from './supabase';
import { MessageCreate } from '../types/database';
import './server-only'; // Mark this file as server-only

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing required Twilio environment variables');
}

export const twilioClient = new Twilio(accountSid!, authToken!);

/**
 * Send an SMS message via Twilio and store the record in Supabase
 */
export async function sendSMS(to: string, body: string, businessId?: string) {
  try {
    console.log(`[Twilio] Attempting to send SMS from ${twilioPhoneNumber} to ${to}`);
    
    // Send the SMS via Twilio
    const message = await twilioClient.messages.create({
      to,
      from: twilioPhoneNumber!,
      body
    });
    
    console.log(`[Twilio] SMS sent successfully! SID: ${message.sid}, Status: ${message.status}`);
    
    // Store the message in Supabase
    const messageData: MessageCreate = {
      twilio_sid: message.sid,
      business_id: businessId,
      from_number: message.from,
      to_number: message.to,
      body: message.body,
      status: message.status,
      direction: 'outbound'
    };
    
    const { error } = await supabase
      .from('messages')
      .insert(messageData);
    
    if (error) {
      console.error('[Twilio] Error storing message in Supabase:', error);
    } else {
      console.log('[Twilio] Message stored in database successfully');
    }
    
    return message;
  } catch (error: any) {
    console.error('[Twilio] Error sending SMS:', error);
    
    // Log detailed Twilio error information
    if (error.code) {
      console.error(`[Twilio] Error code: ${error.code}`);
      console.error(`[Twilio] Error message: ${error.message}`);
      
      // Log common Twilio error codes
      if (error.code === 21211) {
        console.error('[Twilio] Invalid phone number format');
      } else if (error.code === 21610) {
        console.error('[Twilio] Twilio cannot send to unverified numbers in trial mode. You need to verify this number in your Twilio console.');
      } else if (error.code === 21608) {
        console.error('[Twilio] The number you are trying to send to is unsubscribed from your Twilio number');
      }
    }
    
    throw error;
  }
}

/**
 * Create a new Twilio Verify service
 */
export async function createVerifyService(friendlyName: string) {
  try {
    const service = await twilioClient.verify.v2.services.create({
      friendlyName
    });
    
    return service;
  } catch (error) {
    console.error('Error creating Verify service:', error);
    throw error;
  }
}

/**
 * Send a verification code via SMS or other channels
 */
export async function sendVerificationCode(
  phoneNumber: string, 
  channel = 'sms',
  serviceSid = verifyServiceSid
) {
  try {
    if (!serviceSid) {
      throw new Error('Verify service SID is required');
    }
    
    const verification = await twilioClient.verify.v2.services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel
      });
    
    return verification;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

/**
 * Check a verification code
 */
export async function checkVerificationCode(
  phoneNumber: string,
  code: string,
  serviceSid = verifyServiceSid
) {
  try {
    if (!serviceSid) {
      throw new Error('Verify service SID is required');
    }
    
    const verificationCheck = await twilioClient.verify.v2.services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code
      });
    
    return verificationCheck;
  } catch (error) {
    console.error('Error checking verification code:', error);
    throw error;
  }
}

/**
 * Update the status of a message in the database
 */
export async function updateMessageStatus(messageSid: string, status: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('twilio_sid', messageSid);
    
    if (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
}

/**
 * Store an incoming message in Supabase
 */
export async function storeIncomingMessage(
  messageSid: string,
  from: string,
  to: string,
  body: string,
  status: string
) {
  try {
    // Try to find a business with this phone number
    let businessId: string | undefined;
    
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('custom_twilio_number', to)
      .limit(1);
    
    if (businesses && businesses.length > 0) {
      businessId = businesses[0].id;
    }
    
    const messageData: MessageCreate = {
      twilio_sid: messageSid,
      business_id: businessId,
      from_number: from,
      to_number: to,
      body,
      status,
      direction: 'inbound'
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) {
      console.error('Error storing incoming message:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error storing incoming message:', error);
    throw error;
  }
} 