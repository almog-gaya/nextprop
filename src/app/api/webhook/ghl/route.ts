import { NextResponse } from 'next/server';
import { generateResponse, loadAIAgentConfig } from '@/lib/ai-agent';
import { isGhlConfigured, sendMessageToGhl } from '@/lib/ghl-service';

export async function POST(request: Request) {
  try {
    console.log('📨 GHL Webhook received');
    
    // Parse the incoming webhook data
    const webhookData = await request.json();
    console.log('📨 GHL Webhook data:', JSON.stringify(webhookData, null, 2));
    
    // Check if this is an inbound message
    if (webhookData.type !== 'InboundMessage') {
      console.log('📨 Not an inbound message, ignoring');
      return NextResponse.json({ success: false, message: 'Not an inbound message' });
    }
    
    // Check if the AI agent is enabled
    const config = await loadAIAgentConfig();
    console.log('🤖 AI Agent config:', config);
    
    if (!config.isEnabled) {
      console.log('🤖 AI Agent is disabled, not responding');
      return NextResponse.json({ success: false, message: 'AI Agent is disabled' });
    }
    
    // Get the message content
    const messageBody = webhookData.body || '';
    if (!messageBody.trim()) {
      console.log('📨 Empty message, ignoring');
      return NextResponse.json({ success: false, message: 'Empty message' });
    }
    
    // Generate AI response
    console.log('🤖 Generating AI response for:', messageBody);
    const aiResponse = await generateResponse(messageBody, config);
    console.log('🤖 AI Response generated:', aiResponse.response);
    
    // Check if GHL is configured before trying to send a response
    if (isGhlConfigured()) {
      try {
        // Send the response back to GHL
        await sendMessageToGhl(
          webhookData.contactId,
          aiResponse.response,
          webhookData.conversationId,
          webhookData.locationId
        );
        console.log('📤 Response sent to GHL successfully');
      } catch (sendError) {
        console.error('🔴 Error sending response to GHL:', sendError);
        // Continue execution - we still want to return a success response to the webhook
      }
    } else {
      console.warn('⚠️ GHL API not configured, response not sent');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Response generated',
      response: aiResponse.response
    });
    
  } catch (error) {
    console.error('🔴 Error in GHL webhook handler:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// This is needed for webhook verification if GHL requires it
export async function GET(request: Request) {
  return NextResponse.json({ success: true, message: 'GHL webhook endpoint is active' });
} 