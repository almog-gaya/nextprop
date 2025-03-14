import { NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const contactId = await params.id;
    console.log('Updating contact in GHL:', params.id, 'with data:', body);

    const response = await fetchWithErrorHandling(() => updateContact(contactId, body));
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
    const contactId = await params.id;
    console.log('Deleting contact in GHL:', contactId);

    const response = await fetchWithErrorHandling(() => deleteContactById(contactId));
    console.log('GHL delete response:', response);

    return NextResponse.json(
      { success: true, message: 'Contact deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const contactId = (await params.id);
    console.log('Fetching contact in GHL:', contactId);
    const response = await fetchWithErrorHandling(() => getContactById(contactId));
    console.log('GHL get response:', response);
    if (response.error) {
      console.error('GHL get error:', response.error);
      return NextResponse.json({})
    }

    return NextResponse.json(response.contact);
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({})
  }

}

const deleteContactById = async (contactId: string) => {
  const { token } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/' + contactId;

  const options = {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data;
};

const updateContact = async (contactId: string, contactData: any) => {
  const { token } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/' + contactId;
  delete contactData.locationId;
  const options = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(contactData)
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
};

const getContactById = async (contactId: string) => {
  const { token } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/' + contactId;

  const options = {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data;
};