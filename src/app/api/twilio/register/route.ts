import { NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio/config';
import { getAuthHeaders } from '@/lib/enhancedApi'; 
import { getA2PRegistrationByUserId, updateA2PRegistration } from '@/lib/a2p';

export async function POST(request: Request) {
    try {
        const { locationId } = await getAuthHeaders();
        if (!locationId) {
            return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 });
        }
        const businessInfo = await getA2PRegistrationByUserId(locationId!);
        if (!businessInfo) {
            return NextResponse.json({ success: false, error: 'Business information not found' }, { status: 404 });
        }

        const MASTER_ACCOUNT_EMAIL = "info@nextprop.ai";
        const MASTER_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;

        /// profile
        const firstName = businessInfo!.formData.firstName;
        const lastName = businessInfo.formData.lastName;
        const phoneNumber = businessInfo.formData.phone;

        //address
        const city = businessInfo!.formData.city;
        const street = businessInfo.formData.address;
        const region = businessInfo.formData.region;
        const postalCode = businessInfo.formData.zip;
        const isoCountry = businessInfo.formData.isoCountry;



        /// company
        const email = businessInfo.formData.email;
        const companyName = businessInfo.formData.legalCompanyName;
        const friendlyName = `${locationId} - ${companyName}`;
        const website_url = businessInfo.formData.website;
        const ein = businessInfo.formData.ein;

        const client = getTwilioClient();

        // 0. Create subaccount
        const subaccount = await client.api.accounts.create({
            friendlyName: friendlyName
        });
        await updateA2PRegistration(locationId!, { 'sid': subaccount.sid });

        ///
        /// Provide Twilio with your customer's business information
        ///

        // 1.1 Create a Secondary Customer Profile
        const customerProfile = await client.trusthub.v1.customerProfiles.create({
            /**
             The email parameter is the email address that will receive updates when the CustomerProfile resource's status changes. 
             This should not be your customer's email address. This is an email address that you (as the ISV) own, since you need to monitor 
             this CustomerProfile resource's status as part of the onboarding process.
             */
            email: MASTER_ACCOUNT_EMAIL,
            friendlyName: `${companyName} - Secondary Customer Profile`,
            policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
            statusCallback: "https://www.example.com/status-callback-endpoint",
        });
        await updateA2PRegistration(locationId!, { 'customerProfileSid': customerProfile.sid });
        // 1.2 Create an EndUser resource of type customer_profile_business_information
        const customer_profile_business_information = await client.trusthub.v1.endUsers.create({
            friendlyName: `${companyName}. - Business Information EndUser resource`,
            type: "customer_profile_business_information",
            attributes: {
                business_name: companyName,
                website_url: website_url,
                business_registration_number: ein,
                business_regions_of_operation: "USA_AND_CANADA",
                business_type: "LIMITED_LIABILITY_COMPANY",
                business_registration_identifier: "EIN",
                business_identity: "direct_customer",
                business_industry: "REAL_ESTATE",
            },
        });

        // 1.3 - Attach the EndUser to the Secondary Customer Profile
        await client.trusthub.v1
            .customerProfiles(customerProfile.sid)
            .customerProfilesEntityAssignments.create({
                objectSid: customer_profile_business_information.sid,
            });

        // 1.4. Create an EndUser resource of type: authorized_representative_1
        const authorized_representative_1 = await client.trusthub.v1.endUsers.create({
            attributes: {
                job_position: "CEO",
                last_name: lastName,
                phone_number: phoneNumber,
                first_name: firstName,
                email: email,
                business_title: "CEO",
            },
            friendlyName: `${companyName} - Authorized Rep 1`,
            type: "authorized_representative_1",
        });

        // 1.5. Attach the EndUser resource to the Secondary Customer Profile
        await client.trusthub.v1
            .customerProfiles(customerProfile.sid)
            .customerProfilesEntityAssignments.create({
                objectSid: authorized_representative_1.sid,
            });

        // 1.6. Create an Address resource
        const address = await client.addresses.create({
            city: city,
            customerName: firstName + " " + lastName,
            isoCountry: isoCountry,
            postalCode: postalCode,
            region: region,
            street: street,
        });

        //   1.7 Create a SupportingDocument resource
        const supportingDocument =
            await client.trusthub.v1.supportingDocuments.create({
                attributes: {
                    address_sids: [address.sid],
                },
                friendlyName: `${companyName} - Supporting Document`,
                type: "customer_profile_address",
            });
        // 1.8. Attach the SupportingDocument resource to the Secondary Customer Profile
        await client.trusthub.v1
            .customerProfiles(customerProfile.sid)
            .customerProfilesEntityAssignments.create({
                objectSid: supportingDocument.sid,
            });

        // 1.9. Assign the Secondary Customer Profile to the Primary Customer Profile
        await client.trusthub.v1
            .customerProfiles(MASTER_ACCOUNT_SID!)
            .customerProfilesEntityAssignments.create({
                objectSid: customerProfile.sid,
            });

        // 1.10. Evaluate the Secondary Customer Profile
        await client.trusthub.v1
            .customerProfiles(customerProfile.sid)
            .customerProfilesEvaluations.create({
                policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
            });
        // 1.11.Submit the Secondary Customer Profile for review
        await client.trusthub.v1
            .customerProfiles(customerProfile.sid)
            .update({ status: "pending-review" });



        ///
        ///  2. Create and submit a TrustProduct
        ///

        // 2.1
        const trustProduct = await client.trusthub.v1.trustProducts.create({
            email: MASTER_ACCOUNT_EMAIL,
            friendlyName: `${companyName} A2P Trust Product`,
            policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
        });
        await updateA2PRegistration(locationId!, { 'trustProductSid': trustProduct.sid });
        //   2.2. Create an EndUser resource of type us_a2p_messaging_profile_information
        const trustHubEndUserA2pMessagingProfileInfo = await client.trusthub.v1.endUsers.create({
            attributes: {
                company_type: "public",
            },
            friendlyName: `${companyName} Messaging Profile EndUser`,
            type: "us_a2p_messaging_profile_information",
        });
        // 2.3. Attach the EndUser to the TrustProduct
        await client.trusthub.v1
            .trustProducts(trustProduct.sid)
            .trustProductsEntityAssignments.create({
                objectSid: trustHubEndUserA2pMessagingProfileInfo.sid,
            });
        // 2.4. Attach the Secondary Customer Profile to the TrustProduct
        await client.trusthub.v1
            .trustProducts(trustProduct.sid)
            .trustProductsEntityAssignments.create({
                objectSid: customerProfile.sid,
            });
        // 2.5. Evaluate the TrustProduct
        await client.trusthub.v1
            .trustProducts(trustProduct.sid)
            .trustProductsEvaluations.create({
                policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
            });
        // 2.6. Submit the TrustProduct for review
        await client.trusthub.v1
            .trustProducts(trustProduct.sid)
            .update({ status: "pending-review" });



        ///
        ///  3. Create a BrandRegistration
        ///

        const brandRegistration = await client.messaging.v1.brandRegistrations.create(
            {
                a2PProfileBundleSid: trustProduct.sid,
                customerProfileBundleSid: customerProfile.sid,
                skipAutomaticSecVet: true,
                // TODO: Remove this line when the brand is ready for production
                mock: true,
            }
        );
        await updateA2PRegistration(locationId!, { 'brandRegistrationSid': brandRegistration.sid });

        // return NextResponse.json({ subaccount, brand, campaign });
    } catch (error) {
        console.error('Twilio API error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
