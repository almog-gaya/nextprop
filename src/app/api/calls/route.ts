import { NextResponse } from 'next/server';
import { getCalls, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET() {
  const data = await fetchWithErrorHandling(getCalls);
  return NextResponse.json(data);
} 