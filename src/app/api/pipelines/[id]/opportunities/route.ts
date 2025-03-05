import { NextRequest, NextResponse } from 'next/server';
import { getOpportunitiesByPipeline } from '@/lib/crm';

export async function GET(
  request: NextRequest,
  props: { params: { id: string } }
) {
  const { id } = props.params;

  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getOpportunitiesByPipeline(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in opportunities API route:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}