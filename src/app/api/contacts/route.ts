import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';
import { log } from '@/middleware';

export async function GET(request: Request) {
  const { locationId, token } = await getAuthHeaders();

  // Extract pagination parameters from the request URL
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const tag = url.searchParams.get('tag') || null; // Optional tag filter

  // Calculate offset for pagination (if needed, depending on API support)
  const offset = (page - 1) * limit;

  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    };

    // Construct the API URL with pagination and optional tag filter
    const prodURL = new URL(`https://services.leadconnectorhq.com/contacts/`);
    prodURL.searchParams.set('locationId', locationId!);
    prodURL.searchParams.set('limit', limit.toString());
    prodURL.searchParams.set('startAfter', offset.toString()); // Assuming offset-based pagination; adjust if API uses different mechanism
    if (tag) {
      prodURL.searchParams.set('query', tag); // Assuming the API supports tag filtering via a query parameter; adjust as needed
    }

    // Direct fetch to GHL API
    const response = await fetch(prodURL.toString(), {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(`Error: `, error);
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();

    // Process contacts to ensure proper name handling
    const processedContacts = (data.contacts || []).map((contact: any) => {
      let name = contact.contactName || null;
      if (!name && contact.firstName && contact.lastName) {
        name = `${contact.firstName} ${contact.lastName}`.trim();
      } else if (!name && contact.firstName) {
        name = contact.firstName;
      } else if (!name && contact.lastName) {
        name = contact.lastName;
      }

      return {
        ...contact,
        name: name || contact.name || null,
      };
    });

    // Construct the response with total count
    // Note: The LeadConnectorHQ API might not return a total count directly.
    // If it doesn't, you may need to make an additional request to get the total or fetch all contacts initially to count them (not recommended for large datasets).
    const total = data.total || 10; // Replace 120 with actual total if API provides it; otherwise, implement a separate count endpoint or fetch all contacts initially

    const processedData = {
      contacts: processedContacts,
      total: total,
    };

    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Error in contacts API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
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


