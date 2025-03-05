import { NextRequest, NextResponse } from 'next/server';
import { moveOpportunity } from '@/lib/crm';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Opportunity ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { stageId } = body;

    if (!stageId) {
      return NextResponse.json(
        { error: true, message: 'Stage ID is required' },
        { status: 400 }
      );
    }

    await moveOpportunity(id, stageId);

    return NextResponse.json({
      success: true,
      message: 'Opportunity moved successfully'
    });
  } catch (error: any) {
    console.error('Error moving opportunity:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to move opportunity' },
      { status: 500 }
    );
  }
} 