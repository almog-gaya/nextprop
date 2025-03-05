import { NextRequest, NextResponse } from 'next/server';
import { createOpportunity } from '@/lib/crm';
import { OpportunityCreate } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      pipeline_id, 
      stage_id, 
      contact_id,
      monetary_value,
      status = 'active'
    } = body;

    if (!name || !pipeline_id || !stage_id) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'Name, pipeline ID, and stage ID are required' 
        },
        { status: 400 }
      );
    }

    const opportunityData: Omit<OpportunityCreate, 'business_id'> = {
      name,
      pipeline_id,
      stage_id,
      contact_id,
      monetary_value: monetary_value || 0,
      status
    };

    const opportunity = await createOpportunity(opportunityData);

    return NextResponse.json({
      success: true,
      message: 'Opportunity created successfully',
      opportunity
    });
  } catch (error: any) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: true, message: error.message || 'Failed to create opportunity' },
      { status: 500 }
    );
  }
} 