import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities, fetchWithErrorHandling } from '@/lib/api';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: pipelineId } = await props.params;
  
  if (!pipelineId) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const data = await fetchWithErrorHandling(() => getOpportunities(pipelineId));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 