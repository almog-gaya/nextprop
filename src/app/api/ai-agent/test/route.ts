import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, loadAIAgentConfig, AGENT_INSTRUCTIONS } from '@/lib/ai-agent';
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
    
    // Get AI agent config
    const config = await loadAIAgentConfig();
    
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
      if (history.length > 0) {
        // Use conversation history for context
        const client = getOpenAIClient();
        
        // Construct the system prompt with the Jane Smith instructions
        const systemPrompt = `You are a helpful AI assistant for a real estate company. Your role is to engage with potential clients in a professional and friendly manner.

Key guidelines:
- Always be respectful and professional
- Focus on understanding the client's needs
- Provide relevant information about properties and services
- Be concise but informative
- Maintain a positive and helpful tone

${AGENT_INSTRUCTIONS}

Please respond to the following message in a ${config.tone} tone, keeping the response ${config.length}:`;
        
        // Convert history to OpenAI format
        const messages = [
          { role: "system", content: systemPrompt },
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
      } else {
        // Use standard single message response
        response = await generateResponse(message, config);
      }
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
    
    // Return the response
    return NextResponse.json({
      success: true,
      isEnabled: config.isEnabled,
      message,
      response: response.response,
      metadata: response.metadata
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