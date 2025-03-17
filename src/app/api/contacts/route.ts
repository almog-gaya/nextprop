import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';
import { log } from '@/middleware';

export async function GET(request: Request) {
  const { locationId, token } = await getAuthHeaders();
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const startAfter = url.searchParams.get('startAfter') || null; // Use contact ID instead of offset
  const tag = url.searchParams.get('tag') || null;

  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    };
    const prodURL = new URL(`https://services.leadconnectorhq.com/contacts/`);
    prodURL.searchParams.set('locationId', locationId!);
    prodURL.searchParams.set('limit', limit.toString()); 
    if (tag) prodURL.searchParams.set('query', tag);

    const response = await fetch(prodURL.toString(), { headers });
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const processedContacts = (data.contacts || []).map((contact: any) => ({
      ...contact,
      name: contact.contactName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || null,
    }));

    return NextResponse.json({
      contacts: processedContacts,
      total: data.meta?.total || processedContacts.length, // Use meta.total if available
    });
  } catch (error: any) {
    console.error('Error in contacts API route:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {

  const body = await request.json();
  try {
     const response = await createContact(body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


const createContact = async (contactData: any) => {
  const { token, locationId } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/';
  contactData.locationId = locationId;

  /// delete all keys with null values or empty strings
  for (const key in contactData) {
    if (contactData[key] === null || contactData[key] === '') {
      delete contactData[key];
    }
  }
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(contactData)
  };
  log(`[Create-Contact]: ${JSON.stringify(contactData)}`);
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(`[Create-Contact]: Data Response: `, JSON.stringify(data));


   if (!response.ok) {
    
    throw new Error(data.message ?? `HTTP error! status: ${response.status}`);
  }
  return data;
};


