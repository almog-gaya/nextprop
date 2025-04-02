import { NextRequest, NextResponse } from 'next/server';
import { cacheServerConfig, getServerCachedConfig, getConfigFromServerCookie, setConfigInServerCookie } from '@/lib/ai-agent';
import { AIAgentConfig } from '@/types/ai-agent';
import { addDebugLog } from '../debug/route';

const CONFIG_COOKIE_KEY = 'nextprop_ai_agent';

// Helper to get user ID from request (simplified version)
function getUserIdFromRequest(req: NextRequest): string {
  // In a real app, extract this from the authenticated session
  // For now, use a simple fallback
  return 'anonymous';
}

// POST endpoint to store AI agent configuration on the server
export async function POST(req: NextRequest) {
  try {
    // Get config from request body
    const config: AIAgentConfig = await req.json();
    
    // Validate configuration
    if (!config) {
      return NextResponse.json({ success: false, error: 'Invalid configuration' }, { status: 400 });
    }
    
    // Add timestamp
    config.updatedAt = new Date();
    
    // Get a user identifier (simplified)
    const userId = getUserIdFromRequest(req);
    
    // Store in server-side cache
    cacheServerConfig(userId, config);
    
    // Store in server-side cookie
    await setConfigInServerCookie(config);
    
    // Log success
    addDebugLog('success', 'AI Agent config saved on server', {
      agentName: config.agentName,
      speakingOnBehalfOf: config.speakingOnBehalfOf || '(not set)',
      hasContactInfo: !!(config.contactPhone || config.contactEmail),
      hasBuyingCriteria: !!config.buyingCriteria,
      dealObjective: config.dealObjective || 'creative-finance',
      isEnabled: config.isEnabled,
      updatedAt: config.updatedAt
    });
    
    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in AI agent config endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save configuration',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve AI agent configuration from the server
export async function GET(req: NextRequest) {
  try {
    let config: AIAgentConfig | null = null;
    let source = 'unknown';
    
    // Try to get config from cookie first
    config = await getConfigFromServerCookie();
    if (config) {
      source = 'cookie';
      addDebugLog('info', 'Retrieved AI Agent config from cookie', {
        hasConfig: true,
        source: 'cookie'
      });
    }
    
    // Try to get from server cache if not in cookie
    if (!config) {
      const userId = getUserIdFromRequest(req);
      config = getServerCachedConfig(userId);
      
      if (config) {
        source = 'server-cache';
        addDebugLog('info', 'Retrieved AI Agent config from server cache', {
          hasConfig: true,
          source: 'server-cache',
          userId
        });
      }
    }
    
    // If no config found, check for client-side cookie in the request
    if (!config) {
      const clientCookie = req.cookies.get(CONFIG_COOKIE_KEY);
      if (clientCookie?.value) {
        try {
          const parsedConfig = JSON.parse(decodeURIComponent(clientCookie.value));
          config = {
            ...parsedConfig,
            isEnabled: Boolean(parsedConfig.isEnabled),
            updatedAt: new Date(parsedConfig.updatedAt)
          };
          source = 'client-cookie';
          
          // Also store in server cache for future use
          if (config) {
            cacheServerConfig(getUserIdFromRequest(req), config);
          }
          
          addDebugLog('info', 'Retrieved AI Agent config from client cookie', {
            hasConfig: true,
            source: 'client-cookie'
          });
        } catch (parseError) {
          console.error('Error parsing client cookie:', parseError);
        }
      }
    }
    
    // If no config found, create a proper default with actual values (not empty)
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
      source = 'default';
      
      addDebugLog('info', 'Using default AI Agent config with real values', {
        hasConfig: false,
        source: 'default'
      });
    }
    
    return NextResponse.json({
      success: true,
      config,
      source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error retrieving AI agent config:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve configuration',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 