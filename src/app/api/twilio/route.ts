import { NextResponse } from 'next/server';
import { getTwilioClient, accountSid, authToken } from '@/lib/twilio/config';
import { getAuthHeaders } from '@/lib/enhancedApi';
import { getA2PRegistrationByUserId } from '@/lib/a2p';
import axios from 'axios'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessInfo, campaignInfo } = body;
    const client = getTwilioClient();

    // 1. Create subaccount
    const subaccount = await client.api.accounts.create({ friendlyName: businessInfo.companyName });

    // 2. Register brand (example, adapt fields as needed)
    const brand = await client.messaging.v1.brandRegistrations.create({
      ...businessInfo,
      accountSid: subaccount.sid,
    });

    // 3. Register campaign (example, adapt fields as needed)
    const campaign = await client.messaging.v1.services.create({
      ...campaignInfo,
      accountSid: subaccount.sid,
    });

    return NextResponse.json({ subaccount, brand, campaign });
  } catch (error) {
    console.error('Twilio API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { locationId } = await getAuthHeaders();
    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 });
    }
    const profile = await getA2PRegistrationByUserId(locationId!);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }
    const client = getTwilioClient(profile.sid);

    // Fetch Brand Registration status
    let brand;
    if (profile.brandRegistrationSid) {
      brand = await client.messaging.v1.brandRegistrations(profile.brandRegistrationSid).fetch();
    }

    // Fetch Campaign status (if you have the campaignSid)
    let campaign;
    if(profile.campaignSid) {
      // Replace this with the correct call, possibly with the REST API if not supported in SDK
      campaign = await fetchCampaignStatusAPI(profile.campaignSid, profile.sid!);
    }

    return NextResponse.json({ success: true, brand, campaign });
  } catch (error) {
    console.error('Twilio API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchCampaignStatusAPI(campaignSid: string, subaccountSid: string) {
  const response = await axios.get(
    `https://messaging.twilio.com/v1/A2P/Campaigns/${campaignSid}`,
    {
      auth: { 
        username: accountSid!,
        password: authToken!,
      }
    }
  );
  return response.data;
}
