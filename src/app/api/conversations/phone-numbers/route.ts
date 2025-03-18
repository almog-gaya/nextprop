import { NextResponse } from 'next/server';

// In a real implementation, this would query the GHL API
// For now, we'll return the numbers seen in the screenshot
export async function GET() {
  // Return the phone numbers available in the conversation interface
  return NextResponse.json({
    numbers: [
      { 
        id: '17867517909',
        phoneNumber: '+17867517909',
        label: '+17867517909 (Default)'
      },
      {
        id: '17865505973',
        phoneNumber: '+17865505973',
        label: '+17865505973'
      },
      {
        id: '17865162371',
        phoneNumber: '+17865162371',
        label: '+17865162371'
      },
      {
        id: '17866928597',
        phoneNumber: '+17866928597',
        label: '+17866928597'
      }
    ]
  });
} 