import { NextResponse } from 'next/server';
import { getTwilioClientBySid } from '@/lib/twilio/config';
import { getA2PRegistrationByUserId, updateA2PRegistration, getA2PRegistrationBySid, dumpWeebhook } from '@/lib/a2p';
// path : /api/twilio/messaging-service-and-campaign-registration
// method : POST
/// Treating as a webhook
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const isBrandVerified = await processWebhook(body);
        const { sid } = body;

        const subAccountClient = getTwilioClientBySid(sid);
        const profile = await getA2PRegistrationBySid(sid);
        const locationId = profile?.userId;

        const companyName = profile?.formData.legalCompanyName;

        const brandRegistrationSid = profile?.brandRegistrationSid;

        if (!brandRegistrationSid) {
            return NextResponse.json({ success: false, error: 'Brand Registration SID is required' }, { status: 400 });
        }


        // 4. Create a Messaging Service
        const messagingService = await subAccountClient.messaging.v1.services.create({
            fallbackUrl: "https://www.example.com/fallback",
            friendlyName: `${companyName} - A2P 10DLC Messaging Service`,
            inboundRequestUrl: "https://www.example.com/inbound-messages-webhook",
        });
        await updateA2PRegistration(locationId!, { 'messagingServiceSid': messagingService.sid });

        // 5. Create an A2P Campaign
        const usAppToPerson = await subAccountClient.messaging.v1
            .services(messagingService.sid)
            .usAppToPerson.create({
                brandRegistrationSid: brandRegistrationSid!,
                hasEmbeddedLinks: true,
                hasEmbeddedPhone: true,
                description: profile.formData.campaignDescription,
                messageSamples: [
                    profile.formData.sampleMessage1,
                    profile.formData.sampleMessage2,
                ],
                messageFlow: profile.formData.messageFlow,
                optInMessage: profile.formData.optInMessage,
                usAppToPersonUsecase: 'LOW_VOLUME',
                optOutKeywords: ['STOP', 'UNSUBSCRIBE'],

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


const processWebhook = async (body: any) => {
    // store body in firestore 
    await dumpWeebhook(body);
    // body can be array or payload so if array get first element
    const payload = Array.isArray(body) ? body[0] : body;
    const data = payload?.data;

    const type = data?.type;
    const accountSID = data?.accountsid;

    if (!accountSID) {
        return false;
    }

    if (type === 'com.twilio.messaging.compliance.brand-registration.brand-verified') {
        // Brand Registration related calls
        const brandstatus = data?.brandstatus;
        const identitystatus = data?.identitystatus;

        const profile = await getA2PRegistrationBySid(accountSID);
        const locationId = profile?.userId;
        let errors;
        if (data?.brandregistrationerrors && data?.brandregistrationerrors.length > 0) {
            errors = data?.brandregistrationerrors;
        }
        await updateA2PRegistration(locationId!,
            {
                'brandstatus': brandstatus,
                'identityStatus': identitystatus,
                brandStatusErrors: data?.brandregistrationerrors
            });

        return brandstatus === 'registered';
    } else if (type === 'com.twilio.messaging.compliance.campaign-registration.campaign-submitted') {
        /// Campaign registration related Calls
        const profile = await getA2PRegistrationBySid(accountSID);
        const locationId = profile?.userId;
        const status = data.campaignregistrationstatus;
        await updateA2PRegistration(locationId!,
            {
                campaign: data,
                campaignStatus: status, 
            });

    }
    return false;


}