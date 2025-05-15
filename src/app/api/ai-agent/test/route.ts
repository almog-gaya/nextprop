import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if we should include the prompt in the response
    const includePrompt = body.includePrompt === true;
    
    // Make a copy of the body to send to the Cloud Function
    const requestBody = {
      message: body.message,
      locationId: body.locationId || body.userId,
      history: body.history || []
      // Remove includePrompt since cloud function doesn't support it
    };
    
    // Add debug logging for request
    console.log('Sending request to cloud function:', {
      requestBodyKeys: Object.keys(requestBody)
    });
    
    const url = `https://us-central1-nextprop-ai.cloudfunctions.net/chatai`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error(data.error || data.details || data.message || `Cloud function error: ${response.status}`);
    }

    // If no message in the response, throw an error
    if (!data.message) {
      throw new Error('No response received from the cloud function');
    }
    
    // Only generate prompt if requested AND the cloud function call was successful
    if (includePrompt && body.agentConfig) {
      try {
        // Generate instructions based on the agent config
        const { generateAgentInstructions, ensureValidRepresentation } = await import('@/lib/ai-agent');
        const config = body.agentConfig;
        
        const representationString = ensureValidRepresentation(config);
        const customInstructions = generateAgentInstructions(config);
        
        const systemPrompt = `You are an AI assistant named {agentName} representing {representation}. You will respond to the user's message. You MUST follow these instructions EXACTLY.

YOU MUST FOLLOW THESE CRITICAL RULES:
- You ALWAYS represent {representation} and MUST state this when asked
- NEVER EVER claim to represent "your own practice" or "an independent real estate practice"
- When asked who you are, ALWAYS say "I'm {agentName} representing {representation}"
- Be respectful, professional, and helpful at all times
- Keep responses clear and concise

${customInstructions}

Please respond to the following message in a {tone} tone, keeping the response {length}:`;
        
        // Replace all placeholders with actual values
        const finalSystemPrompt = systemPrompt
          .replace(/{agentName}/g, config.agentName || 'Jane Smith')
          .replace(/{representation}/g, representationString)
          .replace(/{tone}/g, config.tone || 'friendly')
          .replace(/{length}/g, config.length || 'medium');
        
        data.prompt = finalSystemPrompt;
        data.promptSource = 'local';
      } catch (error) {
        console.error('Error generating prompt locally:', error);
        // Don't fail if we can't generate the prompt locally
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in AI agent test endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}