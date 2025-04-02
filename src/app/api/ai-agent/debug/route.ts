import { NextResponse } from 'next/server';
import { loadAIAgentConfig } from '@/lib/ai-agent';

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

export async function GET() {
  try {
    // Get AI agent config
    const config = await loadAIAgentConfig();
    
    // Log the config status
    addDebugLog(
      config.isEnabled ? 'success' : 'info',
      `AI Agent is currently ${config.isEnabled ? 'enabled' : 'disabled'}`,
      { 
        config,
        serverTime: new Date().toISOString(),
        environment: {
          enableAgentEnvVar: process.env.ENABLE_AI_AGENT,
          nodeEnv: process.env.NODE_ENV
        }
      }
    );
    
    // Return logs and config status
    return NextResponse.json({
      success: true,
      isEnabled: config.isEnabled,
      config,
      logs: DEBUG_LOGS,
      serverInfo: {
        timestamp: new Date().toISOString(),
        enableAgentEnvVar: process.env.ENABLE_AI_AGENT === 'true',
        isServerSide: true
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