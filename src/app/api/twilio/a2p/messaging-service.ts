import { A2PRegistrationData, A2PRegistrationResponse } from './types';
import { twilioClient } from '../client';

export async function createMessagingService(data: A2PRegistrationData): Promise<A2PRegistrationResponse> {
  try {
    // Create Messaging Service
    const messagingService = await twilioClient.messaging.v1.services.create({
      friendlyName: `${data.legalCompanyName} A2P Messaging Service`,
      inboundRequestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/messages`,
      fallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/messages/fallback`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/messages/status`,
      stickySender: true,
      smartEncoding: true,
      mmsConverter: true,
      fallbackToLongCode: true,
      scanMessageContent: 'inherit',
      areaCodeGeomatch: true,
      validityPeriod: 14400, // 4 hours
      synchronousValidation: true,
      usecase: 'marketing',
    });

    return {
      success: true,
      message: 'Messaging service created successfully',
      data: {
        messagingServiceSid: messagingService.sid,
      },
    };
  } catch (error) {
    console.error('Error creating messaging service:', error);
    return {
      success: false,
      message: 'Failed to create messaging service',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 