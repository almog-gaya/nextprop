import { NextResponse } from 'next/server';
import { loadAIAgentConfig } from '@/lib/ai-agent';
import { NextRequest } from 'next/server';

// Store debug logs in memory for the session
const DEBUG_LOGS: {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  data?: any;
}[] = [];

// Export the logs so they can be accessed from other files
export function addDebugLog(type: 'info' | 'error' | 'success', message: string, data?: any) {
  const log = {
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  };
  
  DEBUG_LOGS.unshift(log); // Add to beginning
  
  // Keep only last 100 logs
  if (DEBUG_LOGS.length > 100) {
    DEBUG_LOGS.length = 100;
  }
  
  // Also log to console for terminal visibility
  if (type === 'error') {
    console.error(`🔴 AI Agent: ${message}`, data || '');
  } else if (type === 'success') {
    console.log(`✅ AI Agent: ${message}`, data || '');
  } else {
    console.log(`🤖 AI Agent: ${message}`, data || '');
  }
}

// Add initial startup log
addDebugLog('info', 'AI Agent debug system initialized', { timestamp: new Date().toISOString() });

export async function GET(req: NextRequest) {
  try {
    // Get AI agent config directly from helpers rather than API
    const { getConfigFromServerCookie, getServerCachedConfig } = await import('@/lib/ai-agent');
    
    // First try cookie
    let config = await getConfigFromServerCookie();
    let source = 'cookie';
    
    // Then try server cache
    if (!config) {
      const userId = 'anonymous'; // Simplified
      config = getServerCachedConfig(userId);
      source = config ? 'server-cache' : source;
    }
    
    // Fallback to default values if needed
    if (!config) {
      config = {
        isEnabled: process.env.ENABLE_AI_AGENT === 'true',
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
        agentName: '',
        speakingOnBehalfOf: '', 
        contactEmail: '',
        buyingCriteria: '',
        dealObjective: '',
      };
      source = 'default';
    }
    
    // Log the config status with verbose details to help debug
    addDebugLog(
      config.isEnabled ? 'success' : 'info',
      `AI Agent is currently ${config.isEnabled ? 'enabled' : 'disabled'}`,
      { 
        config: {
          agentName: config.agentName,
          speakingOnBehalfOf: config.speakingOnBehalfOf || '(empty)',
          tone: config.tone,
          length: config.length,
          isEnabled: config.isEnabled,
          contactPhone: config.contactPhone || '(not set)',
          contactEmail: config.contactEmail || '(not set)',
          buyingCriteria: config.buyingCriteria ? config.buyingCriteria.substring(0, 50) + '...' : '(not set)',
          dealObjective: config.dealObjective || '(not set)'
        },
        configSource: source,
        serverTime: new Date().toISOString(),
        environment: {
          enableAgentEnvVar: process.env.ENABLE_AI_AGENT,
          nodeEnv: process.env.NODE_ENV
        }
      }
    );
    
    // Return logs and config status with the source information
    return NextResponse.json({
      success: true,
      isEnabled: config.isEnabled,
      config,
      configSource: source,
      logs: DEBUG_LOGS,
      serverInfo: {
        timestamp: new Date().toISOString(),
        enableAgentEnvVar: process.env.ENABLE_AI_AGENT === 'true',
        isServerSide: true,
        configSource: source
      }
    });
  } catch (error) {
    console.error('Error in AI agent debug endpoint:', error);
    addDebugLog('error', 'Failed to load AI agent configuration', { error: String(error) });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error fetching AI agent debug information',
        serverInfo: {
          timestamp: new Date().toISOString(),
          error: String(error)
        }
      },
      { status: 500 }
    );
  }
} 