/**
 * Client-side business operations that use API endpoints
 * instead of directly importing server-only code
 */
import { Business } from '../types/database';

/**
 * Get business by user ID
 */
export async function getBusinessByUserId(userId: string): Promise<Business | null> {
  try {
    const response = await fetch(`/api/business?userId=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch business');
    }

    const data = await response.json();
    return data.business;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

/**
 * Create business for user
 */
export async function createBusinessForUser(
  userId: string,
  businessData: Partial<Business>
): Promise<Business | null> {
  try {
    const response = await fetch('/api/business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, businessData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create business');
    }

    const data = await response.json();
    return data.business;
  } catch (error) {
    console.error('Error creating business:', error);
    return null;
  }
}

/**
 * Set a demo phone number for almog@gaya.app user
 */
export async function setDemoPhoneNumber(userId: string): Promise<boolean> {
  try {
    // First check if user has a business
    const business = await getBusinessByUserId(userId);
    
    if (business) {
      // If business exists, update with demo phone number
      const response = await fetch(`/api/business/${business.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: '+15551234567',
          custom_twilio_number: '+15551234567'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update business');
      }
      
      return true;
    } else {
      // Create new business with demo phone number
      const newBusiness = await createBusinessForUser(userId, {
        name: 'Demo Business',
        contact_email: 'almog@gaya.app',
        phone_number: '+15551234567',
        custom_twilio_number: '+15551234567'
      });
      
      return !!newBusiness;
    }
  } catch (error) {
    console.error('Error setting demo phone number:', error);
    return false;
  }
} 