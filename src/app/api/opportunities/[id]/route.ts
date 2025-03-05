import { NextRequest, NextResponse } from 'next/server';
import { getOpportunityById, updateOpportunity, deleteOpportunity } from '@/lib/crm';

export async function GET(
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
    const opportunity = await getOpportunityById(id);
    
    if (!opportunity) {
      return NextResponse.json(
        { error: true, message: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error: any) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const updates = await request.json();
    const opportunity = await updateOpportunity(id, updates);

    return NextResponse.json(opportunity);
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await deleteOpportunity(id);

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to delete opportunity' },
      { status: 500 }
    );
  }
}