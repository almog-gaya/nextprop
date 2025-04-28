export interface A2PRegistrationData {
  // Business Information
  legalCompanyName: string;
  dbaName?: string;
  ein: string;
  einCountry: string;
  businessType: string;
  businessIndustry: string;
  website: string;
  socialMediaUrls?: string;

  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Address Information
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;

  // Campaign Information
  campaignDescription: string;
  sampleMessage1: string;
  sampleMessage2: string;
  useCase: string;
  hasEmbeddedLinks: boolean;
  hasEmbeddedPhone: boolean;
  messageFlow: string;
}

export interface A2PRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    customerProfileSid?: string;
    trustProductSid?: string;
    brandRegistrationSid?: string;
    messagingServiceSid?: string;
    campaignSid?: string;
  };
  error?: string;
}

export interface A2PRegistrationStatus {
  customerProfileStatus: string;
  trustProductStatus: string;
  brandRegistrationStatus: string;
  campaignStatus: string;
} 