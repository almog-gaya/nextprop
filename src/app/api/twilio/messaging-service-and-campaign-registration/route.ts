import { NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio/config';
 import { getA2PRegistrationByUserId, updateA2PRegistration, getA2PRegistrationBySid, dumpWeebhook } from '@/lib/a2p';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await dumpWeebhook(body);
        const {sid} = body;
        const client = getTwilioClient(sid);
        const profile = await getA2PRegistrationBySid(sid);
        const locationId = profile?.userId; 

        /// profile 
        const companyName = profile?.formData.legalCompanyName;

        /// SIDs
        const subaccountSid = profile?.sid;
        const customerProfileSid = profile?.customerProfileSid;
        const trustProductSid = profile?.trustProductSid;
        const brandRegistrationSid = profile?.brandRegistrationSid;

        if (!brandRegistrationSid) {
            return NextResponse.json({ success: false, error: 'Brand Registration SID is required' }, { status: 400 });
        }


        // 4. Create a Messaging Service
        const messagingService = await getTwilioClient().messaging.v1.services.create({
            fallbackUrl: "https://www.example.com/fallback",
            friendlyName: `${companyName} - A2P 10DLC Messaging Service`,
            inboundRequestUrl: "https://www.example.com/inbound-messages-webhook",
        });
        await updateA2PRegistration(locationId!, { 'messagingServiceSid': messagingService.sid });

        // 5. Create an A2P Campaign
        const usAppToPerson = await getTwilioClient().messaging.v1
            .services(messagingService.sid)
            .usAppToPerson.create({
                brandRegistrationSid: brandRegistrationSid!,
                description: "Send marketing messages about sales and offers",
                hasEmbeddedLinks: false,
                hasEmbeddedPhone: false,
                messageFlow: profile.formData.messageFlow,
                messageSamples: [
                    profile.formData.sampleMessage1,
                    profile.formData.sampleMessage2,
                ],
                usAppToPersonUsecase: 'LOW_VOLUME'
            });
        await updateA2PRegistration(locationId!, { 'campaignSid': usAppToPerson.sid });

        return NextResponse.json({ success: true, messagingService, usAppToPerson });
    } catch (error) {
        console.error('Twilio API error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}