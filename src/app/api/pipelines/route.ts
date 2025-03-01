import { NextResponse } from 'next/server';
import { getPipelines, fetchWithErrorHandling } from '@/lib/api';

export async function GET() {
  try {
    const data = await fetchWithErrorHandling(getPipelines);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 