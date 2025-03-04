import { NextResponse } from 'next/server';
import { getContacts, fetchWithErrorHandling } from '@/lib/enhancedApi';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // const cookieStore = await cookies();
  // const token = cookieStore.get('ghl_access_token');
  // const locationId = cookieStore.get('ghl_location_id');

  // if (!token || !locationId) {
  //   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // }

  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    console.log('Fetching contacts with forceRefresh:', forceRefresh);
    
    const headers =   {
      'Accept': 'application/json',
      'Authorization': `Bearer 123`,
      'Version': '2021-07-28'
    }
    console.log(`headers>>: `, headers);
    const mockURL = "https://stoplight.io/mocks/highlevel/integrations/39582863/contacts/?locationId=ve9EPM428h8vShlRW1KT";
    const prodURL = "https://services.leadconnectorhq.com/contacts/?locationId=${locationId.value}";
    // Direct fetch to GHL API
    const response = await fetch(mockURL, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
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