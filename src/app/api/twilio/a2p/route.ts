import { NextResponse } from 'next/server';
import { A2PRegistrationData, A2PRegistrationResponse } from './types';
import { createCustomerProfile } from './customer-profile';
import { createTrustProduct } from './trust-product';
import { createBrandRegistration } from './brand-registration';
import { createMessagingService } from './messaging-service';
import { createCampaign } from './campaign';

export async function POST(request: Request) {
  try {
    const data: A2PRegistrationData = await request.json();

    // Step 1: Create Customer Profile
    const customerProfileResponse = await createCustomerProfile(data);
    if (!customerProfileResponse.success) {
      return NextResponse.json(customerProfileResponse, { status: 400 });
    }

    // Step 2: Create Trust Product
    const trustProductResponse = await createTrustProduct(data, customerProfileResponse.data.customerProfileSid!);
    if (!trustProductResponse.success) {
      return NextResponse.json(trustProductResponse, { status: 400 });
    }

    // Step 3: Create Brand Registration
    const brandRegistrationResponse = await createBrandRegistration(
      customerProfileResponse.data.customerProfileSid!,
      trustProductResponse.data.trustProductSid!
    );
    if (!brandRegistrationResponse.success) {
      return NextResponse.json(brandRegistrationResponse, { status: 400 });
    }

    // Step 4: Create Messaging Service
    const messagingServiceResponse = await createMessagingService(data);
    if (!messagingServiceResponse.success) {
      return NextResponse.json(messagingServiceResponse, { status: 400 });
    }

    // Step 5: Create Campaign
    const campaignResponse = await createCampaign(
      data,
      messagingServiceResponse.data.messagingServiceSid!,
      brandRegistrationResponse.data.brandRegistrationSid!
    );
    if (!campaignResponse.success) {
      return NextResponse.json(campaignResponse, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'A2P registration completed successfully',
      data: {
        customerProfileSid: customerProfileResponse.data.customerProfileSid,
        trustProductSid: trustProductResponse.data.trustProductSid,
        brandRegistrationSid: brandRegistrationResponse.data.brandRegistrationSid,
        messagingServiceSid: messagingServiceResponse.data.messagingServiceSid,
        campaignSid: campaignResponse.data.campaignSid,
      },
    });
  } catch (error) {
    console.error('A2P registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to complete A2P registration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 