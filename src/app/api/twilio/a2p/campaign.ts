import { A2PRegistrationData, A2PRegistrationResponse } from './types';
import { twilioClient } from '../client';

export async function createCampaign(
  data: A2PRegistrationData,
  messagingServiceSid: string,
  brandRegistrationSid: string
): Promise<A2PRegistrationResponse> {
  try {
    // Create Campaign
    const campaign = await twilioClient.messaging.v1
      .services(messagingServiceSid)
      .compliance.usA2p.create({
        description: data.campaignDescription,
        messageSamples: [data.sampleMessage1, data.sampleMessage2],
        usAppToPersonUsecase: data.useCase,
        hasEmbeddedLinks: data.hasEmbeddedLinks,
        hasEmbeddedPhone: data.hasEmbeddedPhone,
        messageFlow: data.messageFlow,
        brandRegistrationSid,
        optInMessage: `You are now opted-in to receive messages from ${data.legalCompanyName}. Reply HELP for help, STOP to cancel.`,
        optOutMessage: `You have been unsubscribed from ${data.legalCompanyName}. You will no longer receive messages from this number.`,
        helpMessage: `Reply HELP for help, STOP to cancel. Message and data rates may apply.`,
        optInKeywords: ['START', 'YES', 'UNSTOP'],
        optOutKeywords: ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
        helpKeywords: ['HELP', 'INFO'],
      });

    return {
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaignSid: campaign.sid,
      },
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return {
      success: false,
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 