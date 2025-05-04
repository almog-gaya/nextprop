import { NextRequest, NextResponse } from 'next/server';

/**
 * Global search handler. Aggregates search across multiple internal APIs (contacts, properties, etc.).
 * Query params:
 *   q  – search term (required)
 *   limit – optional numeric limit per entity (default 5)
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5', 10);

  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }

  // Determine base URL (origin) for internal route calls
  const baseUrl = new URL(request.url).origin;

  const cookieHeader = request.headers.get('cookie') || '';

  try {
    // Concurrently search contacts and properties
    const [contactsData, propertiesData] = await Promise.all([
      (async () => {
        try {
          const res = await fetch(`${baseUrl}/api/contacts/search?name=${encodeURIComponent(query)}&limit=${limit}`, {
            cache: 'no-store',
            headers: { cookie: cookieHeader },
          });
          const data = res.ok ? await res.json() : { contacts: [] };
          if ((data.contacts || []).length === 0) {
            // Fallback: if query looks like phone number, try phone search
            const digits = query.replace(/\D/g, '');
            if (digits.length >= 7) {
              const phoneRes = await fetch(`${baseUrl}/api/contacts/search-by-phone?phone=${encodeURIComponent(digits)}`, {
                cache: 'no-store',
                headers: { cookie: cookieHeader },
              });
              if (phoneRes.ok) {
                const phoneData = await phoneRes.json();
                return phoneData;
              }
            }
          }
          return data;
        } catch {
          return { contacts: [] };
        }
      })(),
      (async () => {
        try {
          const res = await fetch(`${baseUrl}/api/properties/ai-search?prompt=${encodeURIComponent(query)}&limit=${limit}`, { cache: 'no-store', headers: { cookie: cookieHeader } });
          return res.ok ? await res.json() : { properties: [] };
        } catch {
          return { properties: [] };
        }
      })(),
    ]);

    return NextResponse.json({
      query,
      contacts: contactsData.contacts || [],
      properties: propertiesData.properties || [],
    });
  } catch (err) {
    console.error('[global-search] Error:', err);
    return NextResponse.json({ error: 'Internal search error' }, { status: 500 });
  }
} 