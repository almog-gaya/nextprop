import { NextResponse } from 'next/server';
import { emailLogs } from '../route';

export async function GET() {
  try {
    // Return the email logs
    return NextResponse.json({
      status: 'success',
      logs: emailLogs
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 