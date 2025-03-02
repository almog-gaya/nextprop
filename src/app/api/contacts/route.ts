import { NextResponse } from 'next/server';
import { getContacts, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET() {
  const data = await fetchWithErrorHandling(getContacts);
  return NextResponse.json(data);
} 