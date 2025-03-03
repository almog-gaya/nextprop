import { NextResponse } from 'next/server';
import { deleteContact, updateContact, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('Updating contact in GHL:', params.id, 'with data:', body);
    
    const response = await fetchWithErrorHandling(() => updateContact(params.id, body));
    console.log('GHL update response:', response);
    
    if (response.error) {
      console.error('GHL update error:', response.error);
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }

    // Process the updated contact data
    const contact = response.contact || response;
    let name = contact.contactName || null;
    if (!name && contact.firstName && contact.lastName) {
      name = `${contact.firstName} ${contact.lastName}`.trim();
    } else if (!name && contact.firstName) {
      name = contact.firstName;
    } else if (!name && contact.lastName) {
      name = contact.lastName;
    }

    // Ensure we have all the necessary fields
    const processedContact = {
      ...contact,
      name: name || contact.name || null,
      contactName: contact.contactName || name || null,
      firstName: contact.firstName || null,
      lastName: contact.lastName || null,
      id: params.id // Ensure we always have the ID
    };
    
    console.log('Processed contact data:', processedContact);
    return NextResponse.json(processedContact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetchWithErrorHandling(() => deleteContact(params.id));
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
} 