import { AIAgentConfig, AIResponse, MultiAgentConfig, AGENT_TEMPLATES } from '@/types/ai-agent';

// Constants
const CONFIG_STORAGE_KEY = 'nextprop_ai_agent_config';
const CONFIG_COOKIE_KEY = 'nextprop_ai_agent';

// Server-side cache for configs (in-memory cache)
// This will persist across requests but not across server restarts
let serverConfigCache: { [userId: string]: AIAgentConfig } = {};

// Multi-agent configuration cache
let multiAgentCache: { [userId: string]: MultiAgentConfig } = {};

// Function to cache config on server-side with a user ID
// export function cacheServerConfig(userId: string, config: AIAgentConfig): void {
//   // if (typeof window !== 'undefined') return; // Only run on server
  
//   // serverConfigCache[userId] = { ...config };
//   // console.log(`Cached config for user ${userId} on server`);
// }

// // Function to get cached config from server
// export function getServerCachedConfig(userId: string): AIAgentConfig | null {
//   // if (typeof window !== 'undefined') return null; // Only run on server
  
//   // return serverConfigCache[userId] || null;
// }

// Server-side cookie functions
// export async function getConfigFromServerCookie() {
//   // This is used by server components only
//   // Dynamic import to avoid client-side errors
//   try {
//     const { cookies } = await import('next/headers');
//     const cookieStore = await cookies();
//     const configCookie = cookieStore.get(CONFIG_COOKIE_KEY);
    
//     if (configCookie?.value) {
//       try {
//         const parsedConfig = JSON.parse(decodeURIComponent(configCookie.value));
//         return {
//           ...parsedConfig,
//           isEnabled: Boolean(parsedConfig.isEnabled),
//           updatedAt: new Date(parsedConfig.updatedAt)
//         };
//       } catch (parseError) {
//         console.error('Error parsing config cookie on server:', parseError);
//       }
//     }
//   } catch (error) {
//     console.error('Error accessing server cookies:', error);
//   }
  
//   return null;
// }

// export async function setConfigInServerCookie(config: AIAgentConfig) {
//   // This is used by server components only
//   // Dynamic import to avoid client-side errors
//   try {
//     const { cookies } = await import('next/headers');
//     const cookieStore = await cookies();
//     const configJson = JSON.stringify(config);
    
//     cookieStore.set({
//       name: CONFIG_COOKIE_KEY,
//       value: encodeURIComponent(configJson),
//       path: '/',
//       maxAge: 60 * 60 * 24 * 365, // 1 year
//       sameSite: 'strict',
//     });
    
//     return true;
//   } catch (error) {
//     console.error('Error setting server cookie:', error);
//     return false;
//   }
// }

// Helper function to parse cookies on client
function parseCookies(cookieString: string): { [key: string]: string } {
  const cookies: { [key: string]: string } = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    if (name && value) cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

// Function to save AI Agent configuration
export async function saveAIAgentConfig(config: AIAgentConfig): Promise<boolean> {
  try {
    // Set an updated timestamp
    config.updatedAt = new Date();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      console.log('AI Agent config saved to localStorage:', config);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving AI Agent config:', error);
    return false;
  }
}

// Function to load AI Agent configuration
export async function loadAIAgentConfig(userId?: string): Promise<AIAgentConfig> {
  try {
    let savedConfig = '';
    
    // If userId is provided and we're on the server, try to load from Firestore
    if (userId && userId !== 'default') {
      const { db } = await import('@/lib/firebaseConfig');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Try to load from Firestore
      try {
        const configRef = doc(db, 'ai-agent-configs', userId);
        const docSnap = await getDoc(configRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // We'll handle this below in the parsing section
          savedConfig = JSON.stringify(data);
        }
      } catch (error) {
        console.error('Error loading from Firestore:', error);
      }
    }
    
    // If we couldn't load from Firestore or we're on the client, try localStorage
    if (!savedConfig && typeof window !== 'undefined') {
      savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY) || '';
    }
    
    // Default rules
    const defaultRules = [
      {
        id: 'rule_concise',
        text: 'Keep responses under 50 words, ensuring each message adds value',
        category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Ensures the AI agent keeps messages short and to the point'
      },
      {
        id: 'rule_memory',
        text: 'Accurately reference previous conversation details to maintain context',
        category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Helps the AI remember past information shared by the prospect'
      },
      {
        id: 'rule_completion',
        text: 'Always ensure the conversation concludes appropriately',
        category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Prevents leaving conversations hanging without proper closure'
      },
      {
        id: 'rule_compliant',
        text: 'Avoid using problematic words that could trigger spam filters',
        category: 'compliance' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Ensures messages comply with A2P regulations'
      },
      {
        id: 'rule_contact',
        text: 'If asked for a phone number, provide the configured contact information',
        category: 'business' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Ensures leads can reach the real estate agent'
      },
      {
        id: 'rule_offmarket',
        text: 'Focus on off-market deals and avoid discussing MLS-listed properties',
        category: 'business' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
        description: 'Maintains focus on the business model of finding off-market properties'
      }
    ];
    
    // Default Q&A entries
    const defaultQA = [
      {
        id: 'qa_properties',
        question: 'What type of properties are you looking to buy?',
        answer: 'We are primarily interested in single-family homes in the Bay Area. We focus on cosmetic rehabs and avoid long-term projects like new construction.',
        isEnabled: true
      },
      {
        id: 'qa_budget',
        question: 'What is your budget for the purchase?',
        answer: 'We do not have a fixed budget. We are open to any price range, as long as the property does not exceed $2 million, and the owner is willing to consider a cash offer.',
        isEnabled: true
      },
      {
        id: 'qa_agreement',
        question: 'Are you willing to sign a representation agreement?',
        answer: 'Yes, we can sign a representation agreement for specific properties. We also prefer to have the agent who brings us the purchase handle the sale as well.',
        isEnabled: true
      },
      {
        id: 'qa_closing',
        question: 'What is the estimated time to close the transaction?',
        answer: 'We can close quickly if the offer is accepted and all requirements are met. The process usually takes weeks to complete.',
        isEnabled: true
      },
      {
        id: 'qa_outside',
        question: 'Are you interested in properties outside of the Bay Area?',
        answer: 'Currently, we focus on properties within the Bay Area, but we are open to reviewing nearby options if the deal is attractive.',
        isEnabled: true
      },
      {
        id: 'qa_repairs',
        question: 'What happens if the property needs repairs?',
        answer: 'That is not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.',
        isEnabled: true
      }
    ];
    
    if (!savedConfig) {
      console.log('No AI Agent config found, returning default');
      return {
        isEnabled: false,
        enabledPipelines: [], // Add empty array for enabled pipelines
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
        agentName: 'Jane Smith',
        speakingOnBehalfOf: '',
        contactPhone: '',
        contactEmail: '',
        companyWebsite: '',
        companyAbout: '',
        buyingCriteria: '',
        audienceType: 'realtor',
        propertyType: 'Single-family',
        rules: defaultRules,
        qaEntries: defaultQA,
        enabledRules: defaultRules.map(rule => rule.id) // All rules enabled by default
      };
    }

    try {
      const parsedConfig = JSON.parse(savedConfig);
      
      // Ensure the enabled state is properly parsed as a boolean
      const config = {
        ...parsedConfig,
        isEnabled: Boolean(parsedConfig.isEnabled),
        enabledPipelines: Array.isArray(parsedConfig.enabledPipelines) ? parsedConfig.enabledPipelines : [],
        updatedAt: new Date(parsedConfig.updatedAt),
        // Add default rules and Q&A if they don't exist
        rules: Array.isArray(parsedConfig.rules) ? parsedConfig.rules : defaultRules,
        qaEntries: Array.isArray(parsedConfig.qaEntries) ? parsedConfig.qaEntries : defaultQA,
        enabledRules: Array.isArray(parsedConfig.enabledRules) ? parsedConfig.enabledRules : defaultRules.map(rule => rule.id)
      };
      
      console.log('Parsed AI Agent config:', config);
      return config;
    } catch (parseError) {
      console.error('Error parsing AI Agent config:', parseError);
      return {
        isEnabled: false,
        enabledPipelines: [],
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
        agentName: 'Jane Smith',
        speakingOnBehalfOf: '',
        contactPhone: '',
        contactEmail: '',
        companyWebsite: '',
        companyAbout: '',
        buyingCriteria: '',
        audienceType: 'realtor',
        propertyType: 'Single-family',
        rules: defaultRules,
        qaEntries: defaultQA,
        enabledRules: defaultRules.map(rule => rule.id)
      };
    }
  } catch (error) {
    console.error('Error loading AI Agent config:', error);
    return {
      isEnabled: false,
      enabledPipelines: [],
      tone: 'friendly',
      length: 'medium',
      customInstructions: '',
      updatedAt: new Date(),
      agentName: 'Jane Smith',
      speakingOnBehalfOf: '',
      contactPhone: '',
      contactEmail: '',
      companyWebsite: '',
      companyAbout: '',
      buyingCriteria: '',
      audienceType: 'realtor',
      propertyType: 'Single-family',
      rules: [
        {
          id: 'rule_concise',
          text: 'Keep responses under 50 words, ensuring each message adds value',
          category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Ensures the AI agent keeps messages short and to the point'
        },
        {
          id: 'rule_memory',
          text: 'Accurately reference previous conversation details to maintain context',
          category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Helps the AI remember past information shared by the prospect'
        },
        {
          id: 'rule_completion',
          text: 'Always ensure the conversation concludes appropriately',
          category: 'communication' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Prevents leaving conversations hanging without proper closure'
        },
        {
          id: 'rule_compliant',
          text: 'Avoid using problematic words that could trigger spam filters',
          category: 'compliance' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Ensures messages comply with A2P regulations'
        },
        {
          id: 'rule_contact',
          text: 'If asked for a phone number, provide the configured contact information',
          category: 'business' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Ensures leads can reach the real estate agent'
        },
        {
          id: 'rule_offmarket',
          text: 'Focus on off-market deals and avoid discussing MLS-listed properties',
          category: 'business' as 'communication' | 'compliance' | 'business' | 'representation' | 'other',
          description: 'Maintains focus on the business model of finding off-market properties'
        }
      ],
      qaEntries: [
        {
          id: 'qa_properties',
          question: 'What type of properties are you looking to buy?',
          answer: 'We are primarily interested in single-family homes in the Bay Area. We focus on cosmetic rehabs and avoid long-term projects like new construction.',
          isEnabled: true
        },
        {
          id: 'qa_budget',
          question: 'What is your budget for the purchase?',
          answer: 'We do not have a fixed budget. We are open to any price range, as long as the property does not exceed $2 million, and the owner is willing to consider a cash offer.',
          isEnabled: true
        },
        {
          id: 'qa_agreement',
          question: 'Are you willing to sign a representation agreement?',
          answer: 'Yes, we can sign a representation agreement for specific properties. We also prefer to have the agent who brings us the purchase handle the sale as well.',
          isEnabled: true
        },
        {
          id: 'qa_closing',
          question: 'What is the estimated time to close the transaction?',
          answer: 'We can close quickly if the offer is accepted and all requirements are met. The process usually takes weeks to complete.',
          isEnabled: true
        },
        {
          id: 'qa_outside',
          question: 'Are you interested in properties outside of the Bay Area?',
          answer: 'Currently, we focus on properties within the Bay Area, but we are open to reviewing nearby options if the deal is attractive.',
          isEnabled: true
        },
        {
          id: 'qa_repairs',
          question: 'What happens if the property needs repairs?',
          answer: 'That is not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.',
          isEnabled: true
        }
      ],
      enabledRules: ['rule_concise', 'rule_memory', 'rule_completion', 'rule_compliant', 'rule_contact', 'rule_offmarket']
    };
  }
}

// Base prompt template
const BASE_PROMPT = `You are an AI assistant named {agentName} representing {representation}. You will respond to the user's message. You MUST follow these instructions EXACTLY.

YOU MUST FOLLOW THESE CRITICAL RULES:
- You ALWAYS represent {representation} and MUST state this when asked
- NEVER EVER claim to represent "your own practice" or "an independent real estate practice"
- When asked who you are, ALWAYS say "I'm {agentName} representing {representation}"
- Be respectful, professional, and helpful at all times
- Keep responses clear and concise

{customInstructions}

Please respond to the following message in a {tone} tone, keeping the response {length}:`;

// Function to generate agent instructions from config
export function generateAgentInstructions(config: AIAgentConfig): string {
  // Debug the incoming config object
  console.log('📋 Generating instructions with config:', {
    agentName: config.agentName,
    speakingOnBehalfOf: config.speakingOnBehalfOf || '(empty)',
    hasContactInfo: !!(config.contactPhone || config.contactEmail),
    hasBuyingCriteria: !!config.buyingCriteria,
    audienceType: config.audienceType,
    hasRules: !!(config.rules && config.rules.length > 0),
    hasQA: !!(config.qaEntries && config.qaEntries.length > 0),
  });

  // Get representation string - using the utility function
  const representationString = ensureValidRepresentation(config);
  
  console.log('📋 Using representation string:', representationString);
  
  // Start with a clear and unambiguous identity statement
  let instructions = `CRITICAL IDENTITY INFORMATION:
- Your name is: ${config.agentName || 'Jane Smith'}
- You are a real estate professional
- You ALWAYS represent: ${representationString}
- When asked who you work for or who you are, you MUST respond with "I'm ${config.agentName || 'Jane Smith'} representing ${representationString}"
- NEVER say you represent "your own practice" or "an independent real estate practice" under any circumstances`;


  // Add contact information section if any contact info is provided
  if (config.contactPhone || config.contactEmail) {
    instructions += `\n\nCONTACT INFORMATION:`;
    
    if (config.contactPhone) {
      instructions += `\n- Phone: ${config.contactPhone}`;
    }
    
    if (config.contactEmail) {
      instructions += `\n- Email: ${config.contactEmail}`;
    }
    
    instructions += `\n- Always provide this contact information when asked how to reach you or when contact information is requested`;
  }
  
  // Add buying criteria if provided, with more emphasis on its importance
  if (config.buyingCriteria) {
    instructions += `\n\nBUYING CRITERIA:
- ${config.buyingCriteria}
- Always reference these criteria when discussing potential properties
- These criteria are critical to determining if a property is suitable`;
  }
  
  // Add deal objective if provided, with enhanced descriptions
  if (config.audienceType) {
    const audienceTypeMap: {[key: string]: string} = {
      'realtor': 'Working with Realtors and Real Estate Professionals',
      'homeowner': 'Working with Homeowners and Property Owners'
    };
    
    const audienceTypeText = audienceTypeMap[config.audienceType] || config.audienceType;
    instructions += `\n\nPRIMARY FOCUS:
- Your specialty is ${audienceTypeText}
- Emphasize this focus area in your discussions about property acquisitions
- This is a key part of your approach to real estate transactions`;
  }
  
  // Add custom rules if provided
  if (config.rules && config.rules.length > 0 && config.enabledRules && config.enabledRules.length > 0) {
    instructions += `\n\nRULES YOU MUST FOLLOW:`;
    
    // Filter rules that are enabled
    const enabledRules = config.rules.filter(rule => config.enabledRules?.includes(rule.id));
    
    // Add each enabled rule
    enabledRules.forEach(rule => {
      instructions += `\n- ${rule.text}`;
    });
  }
  
  // Add Q&A section if provided
  if (config.qaEntries && config.qaEntries.length > 0) {
    // Filter for enabled Q&A entries
    const enabledQA = config.qaEntries.filter(qa => qa.isEnabled);
    
    if (enabledQA.length > 0) {
      instructions += `\n\nQ&A EXAMPLES:`;
      
      // Add each Q&A entry
      enabledQA.forEach(qa => {
        instructions += `\nQ: ${qa.question}\nA: ${qa.answer}\n`;
      });
    }
  }
  
  // Add response style guidance based on the config
  instructions += `\n\nRESPONSE STYLE:
- Tone: ${config.tone || 'friendly'} (${getToneDescription(config.tone)})
- Length: ${config.length || 'medium'} (${getLengthDescription(config.length)})
- Be clear, concise, and helpful in all responses`;
  
  // Add behavioral guidelines with absolute emphasis on representation
  instructions += `\n\nBEHAVIORAL REQUIREMENTS:
- ALWAYS introduce yourself as "${config.agentName || 'Jane Smith'} representing ${representationString}"
- ALWAYS be friendly, professional, and helpful
- Be concise and specific in your responses
- Provide relevant information about real estate topics
- Ask clarifying questions when needed
- NEVER make up information or property details
- Personalize your responses to the client
- EXTREMELY IMPORTANT: When asked who you work for, who you are, or who you represent, ALWAYS specify that you represent ${representationString} - NEVER use generic phrases like "my own practice" or "independently"`;
  
  // Return the complete custom instructions
  return instructions;
}

// Helper function to get tone descriptions
function getToneDescription(tone?: string): string {
  switch (tone) {
    case 'friendly':
      return 'warm, approachable, conversational';
    case 'professional':
      return 'formal, business-like, authoritative';
    case 'casual':
      return 'relaxed, informal, personable';
    default:
      return 'balanced, approachable, helpful';
  }
}

// Helper function to get length descriptions
function getLengthDescription(length?: string): string {
  switch (length) {
    case 'short':
      return 'brief answers under 50 words';
    case 'medium':
      return 'comprehensive but concise answers, typically 50-150 words';
    case 'long':
      return 'detailed explanations, typically 150-300 words';
    default:
      return 'balanced responses of moderate length';
  }
}

export async function generateResponse(
  message: string,
  config: AIAgentConfig
): Promise<AIResponse> {
  return {
    id: crypto.randomUUID(),
    conversationId: '',
    prompt: message,
    response: 'AI responses are now generated server-side only. Please use the appropriate API endpoint.',
    metadata: {
      tokens: 0,
      timestamp: new Date(),
      success: false,
      error: 'Client-side AI generation is deprecated'
    },
  };
}

// Ensure the agent has a valid speakingOnBehalfOf value
export function ensureValidRepresentation(config: AIAgentConfig): string {
  // Get representation string - this is critical
  if (config.speakingOnBehalfOf && config.speakingOnBehalfOf.trim() !== '') {
    return config.speakingOnBehalfOf.trim();
  }
  
  // If speakingOnBehalfOf is not provided, use agentName or a default
  if (config.agentName && config.agentName.trim() !== '') {
    return `${config.agentName.trim()}'s Real Estate Practice`;
  }
  
  // Fall back to a generic representation if nothing else is available
  return "NextProp Real Estate";
}

// Function to get multi-agent configuration from cache or create a new one
export async function getMultiAgentConfig(userId: string): Promise<MultiAgentConfig> {
  // First check if we have it in cache
  if (multiAgentCache[userId]) {
    return multiAgentCache[userId];
  }

  try {
    // Try to load from Firestore
    const { db } = await import('@/lib/firebaseConfig');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const multiAgentRef = doc(db, 'multi-agent-configs', userId);
    const multiAgentSnap = await getDoc(multiAgentRef);
    
    if (multiAgentSnap.exists()) {
      const data = multiAgentSnap.data() as MultiAgentConfig;
      
      // Process agent dates
      const processedAgents: { [agentId: string]: AIAgentConfig } = {};
      
      Object.entries(data.agents || {}).forEach(([agentId, agent]) => {
        processedAgents[agentId] = {
          ...agent,
          updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date()
        };
      });
      
      const config: MultiAgentConfig = {
        agents: processedAgents,
        activeAgentId: data.activeAgentId || Object.keys(processedAgents)[0] || undefined,
        defaultAgentId: data.defaultAgentId || Object.keys(processedAgents)[0] || undefined
      };
      
      // Cache the result
      multiAgentCache[userId] = config;
      
      return config;
    }
    
    // If no multi-agent config exists, create one from existing single agent
    const singleAgentConfig = await loadAIAgentConfig(userId);
    
    if (singleAgentConfig) {
      // Create a default multi-agent config with the existing agent
      const defaultAgentId = 'default_agent';
      
      const newMultiAgentConfig: MultiAgentConfig = {
        agents: {
          [defaultAgentId]: {
            ...singleAgentConfig,
            id: defaultAgentId,
            name: 'Default Agent',
            isEnabled: true
          }
        },
        activeAgentId: defaultAgentId,
        defaultAgentId: defaultAgentId
      };
      
      // Save the new config
      await saveMultiAgentConfig(userId, newMultiAgentConfig);
      
      return newMultiAgentConfig;
    }
    
    // If all else fails, create an empty multi-agent config
    return {
      agents: {},
      activeAgentId: undefined,
      defaultAgentId: undefined
    };
  } catch (error) {
    console.error('Error loading multi-agent config:', error);
    
    // Return an empty config
    return {
      agents: {},
      activeAgentId: undefined,
      defaultAgentId: undefined
    };
  }
}

// Function to save multi-agent configuration
export async function saveMultiAgentConfig(userId: string, config: MultiAgentConfig): Promise<boolean> {
  try {
    // Update cache
    multiAgentCache[userId] = config;
    
    // Save to Firestore
    const { db } = await import('@/lib/firebaseConfig');
    const { doc, setDoc } = await import('firebase/firestore');
    
    const multiAgentRef = doc(db, 'multi-agent-configs', userId);
    const singleAgentRef = doc(db, 'ai-agent-configs', userId);
    const activeAgentId = config?.activeAgentId;
    if(activeAgentId){
      try {
        const activeAgent = config.agents[activeAgentId];
        await setDoc(singleAgentRef, activeAgent);
      } catch (error) {
        console.error('Error saving active agent:', error);
      }
    }
    // Convert dates to ISO strings for Firestore
    const processedConfig = {
      ...config,
      agents: Object.fromEntries(
        Object.entries(config.agents || {}).map(([agentId, agent]) => [
          agentId,
          {
            ...agent,
            updatedAt: agent.updatedAt instanceof Date 
              ? agent.updatedAt.toISOString() 
              : (typeof agent.updatedAt === 'string' ? agent.updatedAt : new Date().toISOString())
          }
        ])
      )
    };
 
    
    await setDoc(multiAgentRef, processedConfig);
    
    return true;
  } catch (error) {
    console.error('Error saving multi-agent config:', error);
    return false;
  }
}

// Function to create a new agent from template
export async function createAgentFromTemplate(userId: string, templateId: string): Promise<string | null> {
  try {
    // Dynamically import the agent templates
    const { AGENT_TEMPLATES } = await import('@/types/ai-agent');
    
    // Get the current multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Find the template
    const template = AGENT_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      console.error(`Template "${templateId}" not found`);
      return null;
    }
    
    // Create a unique ID for the new agent
    const agentId = `${templateId}_${Date.now()}`;
    
    // Create the default agent configuration
    const defaultConfig = await loadAIAgentConfig('default');
    
    // Merge the template config with the default config
    const newAgent: AIAgentConfig = {
      ...defaultConfig,
      ...template.config,
      id: agentId,
      name: template.name,
      template: templateId,
      isEnabled: true,
      updatedAt: new Date()
    };
    
    // Add the new agent to the multi-agent config
    multiAgentConfig.agents = {
      ...multiAgentConfig.agents,
      [agentId]: newAgent
    };
    
    // If this is the first agent, set it as active and default
    if (!multiAgentConfig.activeAgentId) {
      multiAgentConfig.activeAgentId = agentId;
      multiAgentConfig.defaultAgentId = agentId;
    }
    
    // Save the updated config
    await saveMultiAgentConfig(userId, multiAgentConfig);
    
    return agentId;
  } catch (error) {
    console.error('Error creating agent from template:', error);
    return null;
  }
}

// Function to delete an agent
export async function deleteAgent(userId: string, agentId: string): Promise<boolean> {
  try {
    // Get the current multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Make sure this agent exists
    if (!multiAgentConfig.agents[agentId]) {
      console.error(`Agent "${agentId}" not found`);
      return false;
    }
    
    // Create a new agents object without the deleted agent
    const { [agentId]: deletedAgent, ...remainingAgents } = multiAgentConfig.agents;
    multiAgentConfig.agents = remainingAgents;
    
    // If this was the active or default agent, update those references
    if (multiAgentConfig.activeAgentId === agentId) {
      multiAgentConfig.activeAgentId = Object.keys(remainingAgents)[0] || undefined;
    }
    
    if (multiAgentConfig.defaultAgentId === agentId) {
      multiAgentConfig.defaultAgentId = Object.keys(remainingAgents)[0] || undefined;
    }
    
    // Save the updated config
    await saveMultiAgentConfig(userId, multiAgentConfig);
    
    return true;
  } catch (error) {
    console.error('Error deleting agent:', error);
    return false;
  }
}

// Function to set the active agent
export async function setActiveAgent(userId: string, agentId: string): Promise<boolean> {
  try {
    // Get the current multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Make sure this agent exists
    if (!multiAgentConfig.agents[agentId]) {
      console.error(`Agent "${agentId}" not found`);
      return false;
    }
    
    // Update the active agent
    multiAgentConfig.activeAgentId = agentId;
    
    // Save the updated config
    await saveMultiAgentConfig(userId, multiAgentConfig);
    
    return true;
  } catch (error) {
    console.error('Error setting active agent:', error);
    return false;
  }
}

// Function to get active agent configuration
export async function getActiveAgentConfig(userId: string): Promise<AIAgentConfig | null> {
  try {
    // Get the multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Get the active agent ID
    const activeAgentId = multiAgentConfig.activeAgentId;
    
    if (!activeAgentId || !multiAgentConfig.agents[activeAgentId]) {
      console.error('No active agent found');
      return null;
    }
    
    return multiAgentConfig.agents[activeAgentId];
  } catch (error) {
    console.error('Error getting active agent config:', error);
    return null;
  }
}

// Function to update a specific agent's configuration
export async function updateAgentConfig(
  userId: string, 
  agentId: string, 
  updates: Partial<AIAgentConfig>
): Promise<boolean> {
  try {
    // Get the current multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Make sure this agent exists
    if (!multiAgentConfig.agents[agentId]) {
      console.error(`Agent "${agentId}" not found`);
      return false;
    }
    
    // Update the agent
    multiAgentConfig.agents[agentId] = {
      ...multiAgentConfig.agents[agentId],
      ...updates,
      updatedAt: new Date()
    };
    
    // Save the updated config
    await saveMultiAgentConfig(userId, multiAgentConfig);


    
    return true;
  } catch (error) {
    console.error('Error updating agent config:', error);
    return false;
  }
}

// Function to generate AI response with a specific agent
export async function generateAgentResponse(
  userId: string,
  agentId: string,
  message: string
): Promise<AIResponse> {
  try {
    // Get the multi-agent config
    const multiAgentConfig = await getMultiAgentConfig(userId);
    
    // Get the specified agent config
    const agentConfig = multiAgentConfig.agents[agentId];
    
    if (!agentConfig) {
      throw new Error(`Agent "${agentId}" not found`);
    }
    
    // Use the existing generateResponse function with this agent's config
    const response = await generateResponse(message, agentConfig);
    
    // Add the agent ID to the response
    return {
      ...response,
      agentId
    };
  } catch (error) {
    console.error('Error generating agent response:', error);
    
    // Create error response
    return {
      id: crypto.randomUUID(),
      conversationId: '',
      prompt: message,
      agentId,
      response: 'Sorry, I encountered an error while generating a response. Please try again later.',
      metadata: {
        tokens: 0,
        timestamp: new Date(),
        success: false,
        error: String(error)
      }
    };
  }
}
