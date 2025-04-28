export interface MockA2PRegistrationData {
  legalCompanyName: string;
  dbaName: string;
  ein: string;
  einCountry: string;
  businessType: string;
  businessIndustry: string;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  campaignDescription: string;
  sampleMessage1: string;
  sampleMessage2: string;
  useCase: string;
  hasEmbeddedLinks: boolean;
  hasEmbeddedPhone: boolean;
  messageFlow: string;
}

export interface MockA2PRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    registrationId: string;
    status: 'pending' | 'approved' | 'rejected';
    steps: {
      customerProfile: 'pending' | 'approved' | 'rejected';
      trustProduct: 'pending' | 'approved' | 'rejected';
      brandRegistration: 'pending' | 'approved' | 'rejected';
      messagingService: 'pending' | 'approved' | 'rejected';
      campaign: 'pending' | 'approved' | 'rejected';
    };
  };
  error?: string;
}

export interface MockA2PStatusResponse {
  success: boolean;
  message: string;
  data?: {
    registrationId: string;
    status: 'pending' | 'approved' | 'rejected';
    steps: {
      customerProfile: {
        status: 'pending' | 'approved' | 'rejected';
        message: string;
      };
      trustProduct: {
        status: 'pending' | 'approved' | 'rejected';
        message: string;
      };
      brandRegistration: {
        status: 'pending' | 'approved' | 'rejected';
        message: string;
      };
      messagingService: {
        status: 'pending' | 'approved' | 'rejected';
        message: string;
      };
      campaign: {
        status: 'pending' | 'approved' | 'rejected';
        message: string;
      };
    };
  };
  error?: string;
} 