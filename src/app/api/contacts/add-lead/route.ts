import { NextRequest, NextResponse } from 'next/server';
import { sendPropertyInquiryEmail } from '@/utils/emailService';
import { createGhlApiClient, getCurrentApiKey } from '@/lib/enhancedApi';

// Interface for incoming request data
interface ContactData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  source?: string;
  type?: string;
  companyName?: string;
  propertyDetails?: any;
}

// Interface for processed contact data
interface ProcessedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Interface for GHL API contact data
interface GhlContactData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source: string;
  type: string;
  tags: string[];
  locationId?: string;
}

// Interface for GHL API response
interface GhlContactResponse {
  contact: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tags?: string[];
    dateAdded: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactData = await request.json();
    
    // Validate required fields
    if (!data.firstName) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    // Get the API key
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 401 }
      );
    }

    // Create GHL API client
    const client = createGhlApiClient(apiKey);

    // Format phone number to E.164 format if provided
    let formattedPhone = data.phone;
    if (formattedPhone) {
      // Add + prefix if not present
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
    }

    // Prepare contact data for GHL API
    const contactData: GhlContactData = {
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.trim().toLowerCase(),
      phone: formattedPhone,
      source: 'Website',
      type: 'Lead',
      tags: ['full dnd'],
      locationId: process.env.NEXT_PUBLIC_GHL_LOCATION_ID
    };

    console.log('Creating contact in GHL:', contactData);

    // Create contact in GHL
    const response = await client.post('/contacts', contactData);
    const newContact = response.data as GhlContactResponse;

    console.log('GHL create contact response:', newContact);

    // Send email notification if property details are provided
    if (data.propertyDetails) {
      await sendPropertyInquiryEmail({
        contactData: {
          name: `${data.firstName} ${data.lastName || ''}`.trim(),
          email: data.email,
          phone: data.phone,
          notes: data.notes,
          companyName: data.companyName || process.env.NEXT_PUBLIC_COMPANY_NAME
        },
        propertyDetails: data.propertyDetails
      });
    }

    // Process the contact data to match our format
    const now = new Date().toISOString();
    const processedContact = {
      id: newContact.contact.id,
      name: `${newContact.contact.firstName || ''} ${newContact.contact.lastName || ''}`.trim(),
      email: newContact.contact.email,
      phone: newContact.contact.phone,
      tags: newContact.contact.tags || ['full dnd'],
      createdAt: newContact.contact.dateAdded || now,
      updatedAt: newContact.contact.dateAdded || now
    } satisfies ProcessedContact;

    console.log('Added new contact:', processedContact);

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