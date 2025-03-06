import { NextRequest, NextResponse } from 'next/server';
import { sendPropertyInquiryEmail } from '@/utils/emailService';
import { getAuthHeaders } from '@/lib/enhancedApi';

// Interfaces
interface ContactData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  source?: string;
  type?: string;
  companyName?: string;
  propertyDetails?: {
    property_id: string;
    listing_id: string;
    price: string;
    beds: number;
    baths: number;
    address: {
      line: string;
      city: string;
      state_code: string;
      postal_code: string;
    };
    home_size: string;
    year_built: string;
    property_type: string;
    days_on_zillow: string;
    image_url: string;
    contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface ProcessedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface GhlContactData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source: string;
  tags: string[];
  locationId: string;
  customFields: Array<{
    id: string;
    key: string;
    value: string;
  }>;
}

interface GhlContactResponse {
  contact: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tags: string[];
    dateAdded: string;
  };
}

// Utility Functions
const formatPhoneNumber = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
};

const extractContactData = (data: ContactData): GhlContactData => {
  let firstName = data.firstName;
  let lastName = data.lastName;

  if (!firstName && data.name) {
    const nameParts = data.name.trim().split(' ');
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ') || undefined;
  }

  if (!firstName) {
    throw new Error('First name is required');
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: formatPhoneNumber(data.phone),
    source: data.source || 'Website',
    tags: [],
    locationId: '',
    customFields: [
      {
        id: 'ECqyHR21ZJnSMolxlHpU',
        key: 'contact.type',
        value: 'lead',
      },
      {
        id: '1WRylPbzU0IkgDSyO3bJ',
        key: 'contact.mls_address',
        value: data.propertyDetails ? JSON.stringify(data.propertyDetails) : '',
      },
    ],
  };
};

const createContact = async (contactData: GhlContactData): Promise<GhlContactResponse> => {
  const { token, locationId } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/';

  contactData.locationId = locationId!;

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(contactData),
  };

  const response = await fetch(url, options);
  const data = await response.json();

  console.log(`[LeadGenerate]: `, JSON.stringify(data))
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  console.log('[Create]: Data Response:', JSON.stringify(data));
  return data;
};

// API Handler
export async function POST(request: NextRequest) {
  try {
    const data: ContactData = await request.json();
 
    const contactData = extractContactData(data);
 
    const response = await createContact(contactData);
    const newContact = response.contact;

 
    if (data.propertyDetails) {
      await sendPropertyInquiryEmail({
        contactData: {
          name: `${contactData.firstName} ${contactData.lastName || ''}`.trim(),
          email: contactData.email,
          phone: contactData.phone,
          notes: data.notes,
          companyName: data.companyName || process.env.NEXT_PUBLIC_COMPANY_NAME,
        },
        propertyDetails: data.propertyDetails,
      });
    }

    const now = new Date().toISOString();
    const processedContact: ProcessedContact = {
      id: newContact.id,
      name: `${newContact.firstName} ${newContact.lastName || ''}`.trim(),
      email: newContact.email,
      phone: newContact.phone,
      tags: [],
      createdAt: newContact.dateAdded || now,
      updatedAt: newContact.dateAdded || now,
    };

     return NextResponse.json(processedContact);

  } catch (error: any) {
    console.error('Error adding contact:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add contact';
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}