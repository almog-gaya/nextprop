import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, loadAIAgentConfig, generateAgentInstructions, ensureValidRepresentation } from '@/lib/ai-agent';
import { addDebugLog } from '../debug/route';
import OpenAI from 'openai';

// Get API key from environment variable
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Validate API key format - simple check for basic format
const isValidAPIKey = (key: string) => {
  // Just check if the key exists and has a reasonable length
  return key && key.length > 20;
};

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!isValidAPIKey(API_KEY)) {
    throw new Error('Invalid or missing OpenAI API key. Please check your .env.local file.');
  }
  
  if (!openai) {
    openai = new OpenAI({ apiKey: API_KEY });
  }
  return openai;
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key first
    if (!isValidAPIKey(API_KEY)) {
      addDebugLog('error', 'Invalid OpenAI API key', { 
        keyExists: !!API_KEY,
        keyLength: API_KEY ? API_KEY.length : 0
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or missing OpenAI API key',
          details: 'Please set a valid OpenAI API key in your .env.local file'
        },
        { status: 401 }
      );
    }
    
    // Get the message and conversation history from the request body
    const { message, history = [] } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Get AI agent config directly from helpers instead of API call
    const { getConfigFromServerCookie, getServerCachedConfig } = await import('@/lib/ai-agent');
    
    // First try to get from cookie
    let config = await getConfigFromServerCookie();
    
    // If not in cookie, try server cache
    if (!config) {
      const userId = 'anonymous'; // Simplified
      config = getServerCachedConfig(userId);
    }
    
    // If still no config, use default values
    if (!config) {
      config = {
        isEnabled: process.env.ENABLE_AI_AGENT === 'true',
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
        agentName: 'Jane Smith',
        speakingOnBehalfOf: 'NextProp Real Estate', 
        contactPhone: '(415) 555-1234',
        contactEmail: 'contact@nextprop.ai',
        buyingCriteria: 'Properties up to $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects',
        dealObjective: 'creative-finance',
      };
    }
    
    // Log the loaded config for debugging
    console.log('🧪 Test route loaded config:', {
      agentName: config.agentName,
      speakingOnBehalfOf: config.speakingOnBehalfOf || '(empty)',
      tone: config.tone,
      length: config.length,
      isEnabled: config.isEnabled,
      contactPhone: config.contactPhone || '(not set)',
      contactEmail: config.contactEmail || '(not set)',
      buyingCriteria: config.buyingCriteria || '(not set)',
      dealObjective: config.dealObjective || 'creative-finance',
      configSource: 'direct-access'
    });
    
    // Log the test request
    addDebugLog('info', 'Test message received', { 
      message, 
      isEnabled: config.isEnabled,
      hasHistory: history.length > 0,
      historyLength: history.length
    });
    
    // Check if AI agent is enabled
    if (!config.isEnabled) {
      addDebugLog('info', 'AI Agent is disabled, not generating response');
      return NextResponse.json({
        success: false,
        message: 'AI Agent is currently disabled. Please enable it in the settings.',
        isEnabled: false
      });
    }

    // Handle the conversation with context if history is provided
    let response;
    
    try {
      // Always use conversation history for context (removed condition)
      const client = getOpenAIClient();
      
      // Use the ensureValidRepresentation function for consistency
      const representationString = ensureValidRepresentation(config);
      
      // Log the representation being used
      console.log('🧪 Test route using representation:', representationString);

      // Generate agent instructions with all UI fields
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
      
      // Convert history to OpenAI format and prepare messages array regardless of history length
      const messages = [
        { role: "system", content: finalSystemPrompt },
        ...history.map((item: {text: string, isUser: boolean}) => ({
          role: item.isUser ? "user" : "assistant",
          content: item.text
        })),
        { role: "user", content: message }
      ];
      
      // Generate response with conversation history
      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: config.length === 'short' ? 100 : config.length === 'medium' ? 200 : 300,
      });
      
      response = {
        response: completion.choices[0]?.message?.content || '',
        metadata: {
          tokens: completion.usage?.total_tokens || 0,
          timestamp: new Date(),
          success: true,
        }
      };
      
      addDebugLog('info', 'Using conversation history for context', { 
        historyLength: history.length,
        tokens: completion.usage?.total_tokens
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      addDebugLog('error', 'OpenAI API error', { error: String(openaiError) });
      
      let errorMessage = 'Error calling OpenAI API';
      let errorDetails = String(openaiError);
      
      // Check for specific OpenAI error types
      if (errorDetails.includes('authentication')) {
        errorMessage = 'OpenAI API authentication failed';
        errorDetails = 'Please check your API key in the .env.local file';
      } else if (errorDetails.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit exceeded';
        errorDetails = 'Please try again later or use a different API key';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: errorDetails
        },
        { status: 500 }
      );
    }
    
    // Log the response
    addDebugLog('success', 'Test response generated', { 
      message, 
      response: response.response,
      tokens: response.metadata.tokens
    });
    
    // Return the response with full agent configuration
    return NextResponse.json({
      success: true,
      isEnabled: config.isEnabled,
      message,
      response: response.response,
      metadata: response.metadata,
      agentConfig: {
        agentName: config.agentName,
        speakingOnBehalfOf: config.speakingOnBehalfOf,
        tone: config.tone,
        length: config.length,
        contactPhone: config.contactPhone,
        contactEmail: config.contactEmail,
        buyingCriteria: config.buyingCriteria,
        dealObjective: config.dealObjective
      }
    });
  } catch (error) {
    console.error('Error in AI agent test endpoint:', error);
    addDebugLog('error', 'Failed to generate test response', { error: String(error) });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error generating AI response',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 