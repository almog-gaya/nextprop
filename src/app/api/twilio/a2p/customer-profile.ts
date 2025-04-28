import { A2PRegistrationData, A2PRegistrationResponse } from './types';
import { twilioClient } from '../client';

export async function createCustomerProfile(data: A2PRegistrationData): Promise<A2PRegistrationResponse> {
  try {
    // Create Customer Profile
    const customerProfile = await twilioClient.trusthub.v1.customerProfiles.create({
      friendlyName: `${data.legalCompanyName} A2P Customer Profile`,
      email: data.email,
      policySid: 'RNdfbf3fae0e1107f8aded0e7cead80bf5', // Standard A2P policy
    });

    // Create Business Information EndUser
    const businessInfo = await twilioClient.trusthub.v1.endUsers.create({
      friendlyName: `${data.legalCompanyName} Business Information`,
      type: 'customer_profile_business_information',
      attributes: {
        business_name: data.legalCompanyName,
        business_industry: data.businessIndustry,
        business_type: data.businessType,
        business_registration_identifier: 'EIN',
        business_registration_number: data.ein,
        business_regions_of_operation: 'USA_AND_CANADA',
        website_url: data.website,
        social_media_profile_urls: data.socialMediaUrls,
      },
    });

    // Create Authorized Representative EndUser
    const authorizedRep = await twilioClient.trusthub.v1.endUsers.create({
      friendlyName: `${data.firstName} ${data.lastName} - Authorized Representative`,
      type: 'authorized_representative_1',
      attributes: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phone,
        business_title: 'Authorized Representative',
        job_position: 'Authorized Representative',
      },
    });

    // Create Address
    const address = await twilioClient.api.accounts(twilioClient.accountSid).addresses.create({
      customerName: data.legalCompanyName,
      street: data.address,
      city: data.city,
      region: data.state,
      postalCode: data.zip,
      isoCountry: data.country,
    });

    // Create Supporting Document
    const supportingDoc = await twilioClient.trusthub.v1.supportingDocuments.create({
      friendlyName: `${data.legalCompanyName} Address Document`,
      type: 'customer_profile_address',
      attributes: {
        address_sids: address.sid,
      },
    });

    // Attach all resources to Customer Profile
    await twilioClient.trusthub.v1
      .customerProfiles(customerProfile.sid)
      .entityAssignments.create({ objectSid: businessInfo.sid });

    await twilioClient.trusthub.v1
      .customerProfiles(customerProfile.sid)
      .entityAssignments.create({ objectSid: authorizedRep.sid });

    await twilioClient.trusthub.v1
      .customerProfiles(customerProfile.sid)
      .entityAssignments.create({ objectSid: supportingDoc.sid });

    // Submit for review
    await twilioClient.trusthub.v1.customerProfiles(customerProfile.sid).update({
      status: 'pending-review',
    });

    return {
      success: true,
      message: 'Customer profile created successfully',
      data: {
        customerProfileSid: customerProfile.sid,
      },
    };
  } catch (error) {
    console.error('Error creating customer profile:', error);
    return {
      success: false,
      message: 'Failed to create customer profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 