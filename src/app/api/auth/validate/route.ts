import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No token found' }, { status: 401 });
  }

  // Optionally validate token with GHL API here
  return NextResponse.json({ token });
}