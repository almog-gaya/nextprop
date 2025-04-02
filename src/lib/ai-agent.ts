import { AIAgentConfig, AIResponse } from '@/types/ai-agent';
import OpenAI from 'openai';

// Constants
const CONFIG_STORAGE_KEY = 'ai_agent_config';
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Base prompt template
const BASE_PROMPT = `You are a helpful AI assistant for a real estate company. Your role is to engage with potential clients in a professional and friendly manner.

Key guidelines:
- Always be respectful and professional
- Focus on understanding the client's needs
- Provide relevant information about properties and services
- Be concise but informative
- Maintain a positive and helpful tone

{customInstructions}

Please respond to the following message in a {tone} tone, keeping the response {length}:`;

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: API_KEY });
  }
  return openai;
}

export function getStoredApiKey(): string {
  return API_KEY;
}

export function setStoredApiKey(apiKey: string): void {
  // No-op since we're using environment variable
  console.warn('setStoredApiKey is disabled during testing');
}

export async function generateResponse(
  message: string,
  config: AIAgentConfig
): Promise<AIResponse> {
  try {
    // Construct the full prompt
    const fullPrompt = BASE_PROMPT
      .replace('{tone}', config.tone)
      .replace('{length}', config.length)
      .replace('{customInstructions}', config.customInstructions || '');

    // Generate response using OpenAI
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: fullPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: config.length === 'short' ? 100 : config.length === 'medium' ? 200 : 300,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Create response object
    const aiResponse: AIResponse = {
      id: crypto.randomUUID(),
      conversationId: '', // This should be provided by the calling context
      prompt: message,
      response,
      metadata: {
        tokens: completion.usage?.total_tokens || 0,
        timestamp: new Date(),
        success: true,
      },
    };

    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

// Function to save AI Agent configuration
export async function saveAIAgentConfig(config: AIAgentConfig): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const configToSave = {
      ...config,
      updatedAt: new Date(),
    };
    
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
  } catch (error) {
    console.error('Error saving AI Agent config:', error);
    throw error;
  }
}

// Function to load AI Agent configuration
export async function loadAIAgentConfig(): Promise<AIAgentConfig> {
  try {
    if (typeof window === 'undefined') {
      return {
        isEnabled: false,
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
      };
    }

    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!savedConfig) {
      return {
        isEnabled: false,
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
      };
    }

    const parsedConfig = JSON.parse(savedConfig);
    return {
      ...parsedConfig,
      updatedAt: new Date(parsedConfig.updatedAt),
    };
  } catch (error) {
    console.error('Error loading AI Agent config:', error);
    return {
      isEnabled: false,
      tone: 'friendly',
      length: 'medium',
      customInstructions: '',
      updatedAt: new Date(),
    };
  }
} 