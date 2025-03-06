import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token');
  const locationId = cookieStore.get('ghl_location_id');

  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token?.value}`,
      'Version': '2021-07-28'
    }

    console.log(`headers>>: `, headers);
    console.log(`locationid:>> `, locationId);
    const mockURL = `https://stoplight.io/mocks/highlevel/integrations/39582863/contacts/?locationId=${locationId?.value}`;
    const prodURL = `https://services.leadconnectorhq.com/contacts/?locationId=${locationId?.value ?? "N3z6NPutyGGVRyOxjSDy"}`;
    // Direct fetch to GHL API
    const response = await fetch(prodURL, {
      headers
    });


    if (!response.ok) {
      const error = await response.json();
      console.log(`Error: `, error);
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();

    // Process contacts to ensure proper name handling
    const processedData = {
      contacts: (data.contacts || []).map((contact: any) => {
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
          name: name || contact.name || null
        };
      })
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
    console.log(`[Create]: Contact: `, JSON.stringify(body));
    const response = await mockCreateContact(body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


const mockCreateContact = async (contactData: any) => {
  const { token, locationId } = await getAuthHeaders();
  const url = 'https://services.leadconnectorhq.com/contacts/';
  contactData.locationId = locationId;
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

  console.log(`[Create]: Contact: `, JSON.stringify(options))

  const response = await fetch(url, options);
  // console.log(`[Create]: Response: `, response.body)
  // if (!response.ok) {
  //   throw new Error(`HTTP error! status: ${response.status}`);
  // }
  const data = await response.json();
  console.log(`[Create]: Data: `, JSON.stringify(data));
  return data;
};


