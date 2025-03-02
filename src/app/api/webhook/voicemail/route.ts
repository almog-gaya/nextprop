import { NextResponse } from 'next/server';

// Store webhook responses for demonstration purposes
// In a production app, this would be in a database
export const webhookResponses: any[] = [];

export async function POST(request: Request) {
  try {
    // Parse the incoming webhook data
    const webhookData = await request.json();
    
    console.log('Received webhook from VoiceDrop:', webhookData);
    
    // Store the webhook data
    webhookResponses.unshift({
      timestamp: new Date().toISOString(),
      data: webhookData
    });
    
    // Keep only the latest 50 responses
    if (webhookResponses.length > 50) {
      webhookResponses.length = 50;
    }
    
    // Respond to VoiceDrop with a success message
    return NextResponse.json({ success: true, message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve webhook responses
export async function GET() {
  return NextResponse.json({ responses: webhookResponses });
} 