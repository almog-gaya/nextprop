import { NextResponse } from 'next/server';
import { getPipelines, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET() {
  const data = await fetchWithErrorHandling(getPipelines);
  return NextResponse.json(data);
} 