import { NextResponse } from 'next/server';
import { getCalls, fetchWithErrorHandling } from '@/lib/api';

export async function GET() {
  try {
    const data = await fetchWithErrorHandling(getCalls);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 