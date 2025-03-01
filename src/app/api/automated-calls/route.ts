import { NextResponse } from 'next/server';
import { getCallLogs, makeAutomatedCall } from '@/lib/callService';
import { CallData } from '@/components/AutomatedCallForm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const callLogsData = getCallLogs(page, limit);
    
    return NextResponse.json({
      success: true,
      ...callLogsData
    });
  } catch (error) {
    console.error('Error getting call logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve call logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the required fields
    if (!data.first_name || !data.phone || !data.full_address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: first_name, phone, full_address' },
        { status: 400 }
      );
    }
    
    const callData: CallData = {
      first_name: data.first_name,
      phone: data.phone,
      full_address: data.full_address
    };
    
    const result = await makeAutomatedCall(callData);
    
    return NextResponse.json({
      success: true,
      call: result
    });
  } catch (error) {
    console.error('Error creating automated call:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create automated call' },
      { status: 500 }
    );
  }
} 