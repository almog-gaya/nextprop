import { A2PRegistrationData, A2PRegistrationResponse } from './types';
import { twilioClient } from '../client';

export async function createTrustProduct(
  data: A2PRegistrationData,
  customerProfileSid: string
): Promise<A2PRegistrationResponse> {
  try {
    // Create Trust Product
    const trustProduct = await twilioClient.trusthub.v1.trustProducts.create({
      friendlyName: `${data.legalCompanyName} A2P Trust Product`,
      email: data.email,
      policySid: 'RNb0d4771c2c98518d916a3d4cd70a8f8b', // A2P Trust Product policy
    });

    // Create Messaging Profile Information
    const messagingProfile = await twilioClient.trusthub.v1.endUsers.create({
      friendlyName: `${data.legalCompanyName} Messaging Profile`,
      type: 'us_a2p_messaging_profile_information',
      attributes: {
        company_type: data.businessType,
      },
    });

    // Attach Messaging Profile to Trust Product
    await twilioClient.trusthub.v1
      .trustProducts(trustProduct.sid)
      .entityAssignments.create({ objectSid: messagingProfile.sid });

    // Attach Customer Profile to Trust Product
    await twilioClient.trusthub.v1
      .trustProducts(trustProduct.sid)
      .entityAssignments.create({ objectSid: customerProfileSid });

    // Submit for review
    await twilioClient.trusthub.v1.trustProducts(trustProduct.sid).update({
      status: 'pending-review',
    });

    return {
      success: true,
      message: 'Trust product created successfully',
      data: {
        trustProductSid: trustProduct.sid,
      },
    };
  } catch (error) {
    console.error('Error creating trust product:', error);
    return {
      success: false,
      message: 'Failed to create trust product',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 