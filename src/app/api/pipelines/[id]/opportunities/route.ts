import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  
  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const data = await fetchWithErrorHandling(() => getOpportunities(id));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 