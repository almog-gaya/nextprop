import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateResponse, loadAIAgentConfig } from '@/lib/ai-agent';
import { addDebugLog } from '@/app/api/ai-agent/debug/route';

/**
 * This endpoint handles inbound messages specifically for AI agent integration.
 * It's designed to provide a separate pathway for webhook callbacks from GHL or other systems.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const conversationId = id;

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ghl_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication error: No access token found' }, { status: 401 });
    }

    const body = await request.json();
    addDebugLog('info', 'Inbound message received', body);

    // Extract the message text and other details
    const message = body.message || body.body || body.text || '';
    const contactId = body.contactId;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // This is definitely an inbound message, so check if AI agent should respond
    try {
      // Load AI agent config
      const aiConfig = await loadAIAgentConfig();
      addDebugLog('info', 'AI Agent config loaded for inbound', aiConfig);
      
      if (aiConfig.isEnabled) {
        addDebugLog('info', 'AI Agent is enabled, generating response for inbound message');
        
        // Generate AI response
        const aiResponse = await generateResponse(message, aiConfig);
        addDebugLog('success', 'AI response generated for inbound message', { 
          prompt: message, 
          response: aiResponse.response 
        });
        
        // Send the AI response
        const url = `https://services.leadconnectorhq.com/conversations/messages`;
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          Version: '2021-04-15',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        const messageData = {
          type: 'SMS',
          message: aiResponse.response,
          conversationId,
          contactId,
          conversationProviderId: 'twilio_provider',
        };

        addDebugLog('info', 'Sending AI response to inbound message', messageData);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(messageData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          addDebugLog('error', `Error sending AI response: ${response.status}`, errorText);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to send AI response' 
          });
        }

        const data = await response.json();
        addDebugLog('success', 'AI response sent successfully for inbound message', data);
        
        return NextResponse.json({ 
          success: true, 
          message: 'AI response sent successfully',
          response: aiResponse.response
        });
      } else {
        addDebugLog('info', 'AI Agent is disabled, not responding to inbound message');
        return NextResponse.json({ 
          success: false, 
          message: 'AI Agent is disabled' 
        });
      }
    } catch (error) {
      addDebugLog('error', 'Error in AI agent processing for inbound message', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error processing AI response' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in inbound message processing:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 