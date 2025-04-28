import { A2PRegistrationResponse } from './types';
import { twilioClient } from '../client';

export async function createBrandRegistration(
  customerProfileSid: string,
  trustProductSid: string
): Promise<A2PRegistrationResponse> {
  try {
    // Create Brand Registration
    const brandRegistration = await twilioClient.messaging.v1.a2pBrandRegistrations.create({
      customerProfileBundleSid: customerProfileSid,
      a2pProfileBundleSid: trustProductSid,
    });

    return {
      success: true,
      message: 'Brand registration created successfully',
      data: {
        brandRegistrationSid: brandRegistration.sid,
      },
    };
  } catch (error) {
    console.error('Error creating brand registration:', error);
    return {
      success: false,
      message: 'Failed to create brand registration',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 