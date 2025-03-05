import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { twilioClient, createVerifyService, sendVerificationCode, checkVerificationCode } from './twilio';
import { Business, VerificationAttempt, VerificationCheck } from '../types/database';

/**
 * Register a new business verification
 */
export async function registerBusinessVerification(businessData: Partial<Business>) {
  try {
    // Create a Verify service for this business
    const serviceName = `Business: ${businessData.name || 'Unknown'}`;
    const service = await createVerifyService(serviceName);
    
    // Create the business record
    const newBusiness: Partial<Business> = {
      id: uuidv4(),
      name: businessData.name || 'Unknown Business',
      contact_email: businessData.contact_email || '',
      phone_number: businessData.phone_number,
      twilio_verify_sid: service.sid,
      status: 'pending_verification',
      verification_attempts: 0,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('businesses')
      .insert(newBusiness)
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting business:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in registerBusinessVerification:', error);
    throw error;
  }
}

/**
 * Get a business by ID
 */
export async function getBusinessById(id: string) {
  try {
    // Removed .single() to handle potential edge cases
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id);
    
    if (error) {
      console.error('Error fetching business:', error);
      throw new Error('Business not found');
    }
    
    // If we have at least one business, return the first one
    if (data && data.length > 0) {
      return data[0];
    }
    
    throw new Error('Business not found');
  } catch (error) {
    console.error('Error in getBusinessById:', error);
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching businesses:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAllBusinesses:', error);
    throw error;
  }
}

/**
 * Send a verification code to a business
 */
export async function sendBusinessVerification(businessId: string) {
  try {
    // Get the business
    const business = await getBusinessById(businessId);
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    if (!business.phone_number) {
      throw new Error('Business has no phone number');
    }
    
    if (!business.twilio_verify_sid) {
      throw new Error('Business has no Verify service');
    }
    
    // Send the verification
    const verification = await sendVerificationCode(
      business.phone_number,
      'sms',
      business.twilio_verify_sid
    );
    
    // Store the verification attempt
    const verificationAttempt: Partial<VerificationAttempt> = {
      id: uuidv4(),
      business_id: business.id,
      phone_number: business.phone_number,
      twilio_sid: verification.sid,
      status: verification.status,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('verification_attempts')
      .insert(verificationAttempt);
    
    if (error) {
      console.error('Error storing verification attempt:', error);
    }
    
    // Update business verification attempts count
    await supabase
      .from('businesses')
      .update({ 
        verification_attempts: (business.verification_attempts || 0) + 1,
        last_verification_at: new Date().toISOString()
      })
      .eq('id', business.id);
    
    return verification;
  } catch (error) {
    console.error('Error in sendBusinessVerification:', error);
    throw error;
  }
}

/**
 * Check a verification code for a business
 */
export async function checkBusinessVerification(
  businessId: string, 
  code: string
) {
  try {
    // Get the business
    const business = await getBusinessById(businessId);
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    if (!business.phone_number) {
      throw new Error('Business has no phone number');
    }
    
    if (!business.twilio_verify_sid) {
      throw new Error('Business has no Verify service');
    }
    
    // Get the last verification attempt
    const { data: attempts, error: attemptsError } = await supabase
      .from('verification_attempts')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (attemptsError || !attempts || attempts.length === 0) {
      throw new Error('No verification attempts found');
    }
    
    // Check the code
    const verificationCheck = await checkVerificationCode(
      business.phone_number,
      code,
      business.twilio_verify_sid
    );
    
    // Store the verification check
    const check: Partial<VerificationCheck> = {
      id: uuidv4(),
      business_id: business.id,
      verification_attempt_id: attempts[0].id,
      code,
      twilio_sid: verificationCheck.sid,
      status: verificationCheck.status,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('verification_checks')
      .insert(check);
    
    if (error) {
      console.error('Error storing verification check:', error);
    }
    
    // Update business status if verified
    if (verificationCheck.status === 'approved') {
      await supabase
        .from('businesses')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', business.id);
    }
    
    return verificationCheck;
  } catch (error) {
    console.error('Error in checkBusinessVerification:', error);
    throw error;
  }
}

/**
 * Provision a dedicated Twilio phone number for a business
 */
export async function provisionDedicatedNumber(businessId: string, areaCode?: string) {
  try {
    // Get the business
    const business = await getBusinessById(businessId);
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    // Only allow provisioning for verified businesses
    if (business.status !== 'verified') {
      throw new Error('Business is not verified');
    }
    
    // Search for available phone numbers
    const searchParams: any = {
      limit: 1
    };
    
    if (areaCode) {
      searchParams.areaCode = areaCode;
    }
    
    const availableNumbers = await twilioClient.availablePhoneNumbers('US')
      .local
      .list(searchParams);
    
    if (!availableNumbers || availableNumbers.length === 0) {
      throw new Error('No available phone numbers found');
    }
    
    // Provision the phone number
    const phoneNumber = await twilioClient.incomingPhoneNumbers
      .create({
        phoneNumber: availableNumbers[0].phoneNumber,
        friendlyName: `${business.name} Dedicated Number`
      });
    
    // Update the business record
    const { error } = await supabase
      .from('businesses')
      .update({ 
        custom_twilio_number: phoneNumber.phoneNumber,
        custom_twilio_sid: phoneNumber.sid
      })
      .eq('id', business.id);
    
    if (error) {
      console.error('Error updating business with dedicated number:', error);
      throw error;
    }
    
    return phoneNumber;
  } catch (error) {
    console.error('Error in provisionDedicatedNumber:', error);
    throw error;
  }
} 