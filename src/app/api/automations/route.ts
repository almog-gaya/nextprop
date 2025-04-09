import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';

// POST handler to start an automation
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'success',
      message: 'Mock Automation started successfully at /api/automations/route.ts',
    }); 
    const URL = `https://backend.iky.link/automation/task`;
    const creationPayload = await request.json();
    const { locationId } = await getAuthHeaders();
    creationPayload.customer_id = locationId;

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(creationPayload)
    });

    const data = await response.json();
    // Expecting
    /**
         "status": "success",
         "task_id": "<doc_id>",
     */
    return NextResponse.json(data); 
  } catch (error: any) {
    console.error('Error in automation API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start automation' },
      { status: 500 }
    );
  }
} 