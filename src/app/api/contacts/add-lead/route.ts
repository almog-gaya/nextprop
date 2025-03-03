import { NextRequest, NextResponse } from 'next/server';
import { sendPropertyInquiryEmail } from '@/utils/emailService';

interface ContactData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  source?: string;
  type?: string;
  companyName?: string;
  propertyDetails?: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactData = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a random ID for the contact
    const contactId = Math.random().toString(36).substring(7);

    // Create new contact object
    const newContact = {
      id: contactId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    // Send email notification
    if (data.propertyDetails) {
      await sendPropertyInquiryEmail({
        contactData: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          notes: data.notes,
          companyName: data.companyName || process.env.NEXT_PUBLIC_COMPANY_NAME
        },
        propertyDetails: data.propertyDetails
      });
    }

    console.log('Added new contact:', newContact);

    return NextResponse.json({
      message: 'Contact added successfully',
      contact: newContact
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json(
      { error: 'Failed to add contact' },
      { status: 500 }
    );
  }
} 