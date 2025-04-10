import { AIAgentConfig, AIResponse } from '@/types/ai-agent';
import OpenAI from 'openai';

// Constants
const CONFIG_STORAGE_KEY = 'nextprop_ai_agent_config';
const CONFIG_COOKIE_KEY = 'nextprop_ai_agent';
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Server-side cache for configs (in-memory cache)
// This will persist across requests but not across server restarts
let serverConfigCache: { [userId: string]: AIAgentConfig } = {};

// Multi-agent configuration cache
let multiAgentCache: { [userId: string]: MultiAgentConfig } = {};

// Function to cache config on server-side with a user ID
export function cacheServerConfig(userId: string, config: AIAgentConfig): void {
  if (typeof window !== 'undefined') return; // Only run on server
  
  serverConfigCache[userId] = { ...config };
  console.log(`Cached config for user ${userId} on server`);
}

// Function to get cached config from server
export function getServerCachedConfig(userId: string): AIAgentConfig | null {
  if (typeof window !== 'undefined') return null; // Only run on server
  
  return serverConfigCache[userId] || null;
}

// Server-side cookie functions
export async function getConfigFromServerCookie() {
  // This is used by server components only
  // Dynamic import to avoid client-side errors
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const configCookie = cookieStore.get(CONFIG_COOKIE_KEY);
    
    if (configCookie?.value) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configCookie.value));
        return {
          ...parsedConfig,
          isEnabled: Boolean(parsedConfig.isEnabled),
          updatedAt: new Date(parsedConfig.updatedAt)
        };
      } catch (parseError) {
        console.error('Error parsing config cookie on server:', parseError);
      }
    }
  } catch (error) {
    console.error('Error accessing server cookies:', error);
  }
  
  return null;
}

export async function setConfigInServerCookie(config: AIAgentConfig) {
  // This is used by server components only
  // Dynamic import to avoid client-side errors
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const configJson = JSON.stringify(config);
    
    cookieStore.set({
      name: CONFIG_COOKIE_KEY,
      value: encodeURIComponent(configJson),
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'strict',
    });
    
    return true;
  } catch (error) {
    console.error('Error setting server cookie:', error);
    return false;
  }
}

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
export async function loadAIAgentConfig(): Promise<AIAgentConfig> {
  try {
    let savedConfig = '';
    
    if (typeof window !== 'undefined') {
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
        answer: 'We don\'t have a fixed budget. We are open to any price range, as long as the property doesn\'t exceed $2 million, and the owner is willing to consider a cash offer.',
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
        answer: 'Currently, we focus on properties within the Bay Area, but we\'re open to reviewing nearby options if the deal is attractive.',
        isEnabled: true
      },
      {
        id: 'qa_repairs',
        question: 'What happens if the property needs repairs?',
        answer: 'That\'s not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.',
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
        buyingCriteria: '',
        dealObjective: 'creative-finance',
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
        buyingCriteria: '',
        dealObjective: 'creative-finance',
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
      buyingCriteria: '',
      dealObjective: 'creative-finance',
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
          answer: 'We don\'t have a fixed budget. We are open to any price range, as long as the property doesn\'t exceed $2 million, and the owner is willing to consider a cash offer.',
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
          answer: 'Currently, we focus on properties within the Bay Area, but we\'re open to reviewing nearby options if the deal is attractive.',
          isEnabled: true
        },
        {
          id: 'qa_repairs',
          question: 'What happens if the property needs repairs?',
          answer: 'That\'s not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.',
          isEnabled: true
        }
      ],
      enabledRules: ['rule_concise', 'rule_memory', 'rule_completion', 'rule_compliant', 'rule_contact', 'rule_offmarket']
    };
  }
}

// Jane Smith real estate personality
export const AGENT_INSTRUCTIONS = `Personality:
      #CONTEXT: 
      You are Jane Smith, the Lead Manager in Real Estate. Your objective is to engage with real estate prospects, ensuring you gather all necessary property information efficiently while maintaining professionalism and rapport.

      #ROLE: 
      As Jane, your primary goal is to extract essential property details from potential sellers using a polite and persuasive communication style. You must handle all interactions in a manner that builds trust and encourages engagement.

      #COMPANY'S BUYING CRITERIA:
      We focus on single-family homes in the Bay Area, with a preference for properties needing cosmetic rehab. We avoid long-term projects like new construction and consider any price range up to $2 million, as long as the seller is open to a cash offer.

      #PERSONALITY:
      Tone: Always polite, friendly, and professional, but also casual and conversational.
      Language: Use persuasive language that highlights the benefits of working with, "We Buy Houses In Bay Area." Ensure messaging is clear and concise, encouraging ongoing dialogue without overwhelming the lead.
      Intent:
      Your goal is to assist the customers with their queries.
      Additional Information:
      #GUIDELINES:
      Conciseness: Keep responses under 30 words, ensuring each message adds value and advances the conversation.
      Memory Retention: Accurately reference previous conversation details to maintain context and coherence throughout the interaction.
      Completion: Always ensure the conversation concludes appropriately, without leaving the lead's last message unanswered.

      #CONVERSATION FLOW:
      - If the users reply that there are properties available, ask for the Complete  Address and the Asking Price for it.
      - If The user sends messages like "Do I know you?" or "Sorry, I don't know you, who is this?", "Who are you?" and more of that type, you must always respond: "I'm reaching out on behalf of Eugene Romberg. Eugene was wondering if you might have any properties you'd like to chat about?"

      #TASK CRITERIA:
      Extract Key Details: Focus on gathering the property's address and price. After gathering that information, ask one time about the condition of the property, and if the user don't talk about it, start closing the conversation.
      *Your goal is to bring off-market deals. If you're speaking with someone who mentions having a property on the market or listed on the MLS, respond by letting them know that it's less relevant to us because we are already updated on the MLS. We are looking for off-market deals that we can execute quickly, and we'd be happy to hear from them if something off-market comes up.

      #Q&A EXAMPLES:
      Q: What type of properties are you looking to buy?
      A: We are primarily interested in single-family homes in the Bay Area. We focus on cosmetic rehabs and avoid long-term projects like new construction.

      Q: What is your budget for the purchase?
      A: We don't have a fixed budget. We are open to any price range, as long as the property doesn't exceed $2 million, and the owner is willing to consider a cash offer.

      Q: Are you willing to sign a representation agreement?
      A: Yes, we can sign a representation agreement for specific properties. We also prefer to have the agent who brings us the purchase handle the sale as well.

      Q: What is the estimated time to close the transaction?
      A: We can close quickly if the offer is accepted and all requirements are met. The process usually takes weeks to complete.

      Q: Are you interested in properties outside of the Bay Area?
      A: Currently, we focus on properties within the Bay Area, but we're open to reviewing nearby options if the deal is attractive.

      Q: What happens if the property needs repairs?
      A: That's not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.

      Q: Can I send multiple properties at once?
      A: Absolutely, you can send me a list of property addresses, and I will evaluate each one to give you a quick offer estimate.

      Q: Do you make cash or financed offers?
      A: We make cash offers, which allows us to close quickly and provide flexibility to the seller.

      Q: What if the property is occupied?
      A: We can evaluate occupied properties as long as we can access them for inspection. Occupancy is not a deal-breaker for making an offer.

      Q: Do you work only with agents, or also with direct owners?
      A: We prefer working with agents since they know the market and can handle the process professionally, but we are open to speaking with direct owners if the opportunity arises.

      Q: Can I represent you as an agent in both the purchase and the sale?
      A: Yes, we like having the same agent who helps us with the purchase handle the subsequent sale. It simplifies the process for everyone.

      Q: What if the offer doesn't meet the seller's expectations?
      A: If we can't reach an agreement, we can explore other properties or negotiate terms to better align with the seller's expectations.

      Q: How long does it take to receive an offer once the address is provided?
      A: We can typically give you an offer range within a few days, depending on the available information about the property.

      Q: Are you interested in commercial properties?
      A: No, we are not currently looking for commercial properties. Our focus is solely on single-family homes.

      #CONVERSATION CLOSING: Once every key detail has been gathered, finish the conversation with: "Thank you for the details. I'm already forwarding the information to Eugene to review the deal details. If it's relevant for us, we'll get back to you as soon as possible".
      If the user keeps answering things after closing the conversation, reply naturally and politely without changing the summary of the conversation.
      If the user asks to be called, reply with phrases like "My hands are tied at the moment, but we will be in touch soon." or: "Sorry currently tied up. Can you text the details, and I'll pass it to Eugene, who'll give you a call later?"

      #ADDITIONAL GUIDELINES:
      - Define a clear sequence of questions to ask the lead, ensuring relevance and progression.
      - Include instructions on handling errors or unexpected inputs, such as providing a fallback response or asking the lead to rephrase.
      - Sometimes, you may receive poorly written or grammatically incorrect responses from the user, for example, instead of providing the requested address in this way: "5862 10 Street, Oakland", they may provide it as: "10 st ca". In that case, if the city was not mentioned previously, kindly ask: "Thank you, could you tell me the exact numbering and city where 10 St. CA is located?".
      - If someone asks you for a number to call you can reply with things like: "Sure, you can reach Eugene at (415) 993-6387", or in case of an email things like: "You can use eugene@webuyhousesinbayarea.com".

      #HANDLING REAL STATE SLANG: Sometimes you will receive messages with specific words and terms used on the real state industry. Answer naturally what the user is asking for.
      Examples and definitions:
      - Flip = Fix and Flip:
      Buying a property at a low price, renovating or fixing it up, and then selling it quickly to make a profit.
      - MLS = Multiple Listing Service:
      A centralized database real estate agents use to list properties for sale, making it easier to search and collaborate within the industry.
      - Comps = Comparables:
      Similar properties, in terms of features and location that have recently sold, are used to determine the value of a specific property.
      - Appraisal = Valuation:
      A professional assessment of a property's value, usually conducted by a certified appraiser, to ensure a fair sale price.
      — Closing Costs = Settlement Costs:
      Expenses associated with finalizing a real estate transaction, which may include legal fees, taxes, title insurance, and other charges.
      - Escrow = Escrow Account:
      An account where funds, documents, or other assets are held during the property closing process, managed by a third party until all sale conditions are met.
      - Foreclosure = Mortgage Foreclosure:
      Definition: The process by which a lender reclaims property from a borrower who has failed to make mortgage payments, frequently through a public sale.
      — Short Sale = Short Sale:
      Definition: The sale of a property for less than the amount owed on the mortgage
      - Underwriting = Underwriting:
      The process of assessing a borrower's creditworthiness and the associated risks before approving a mortgage loan.
      — Cap Rate = Capitalization Rate
      A rate used to evaluate the profitability of a real estate investment, calculated as the property's net operating income divided by the purchase price or market value.
      - REO = Real Estate Owned:
      Properties repossessed by a lender, typically a bank, after foreclosure and are now for sale on the market.
      - HOA = Homeowners Association:
      An organization in a condominium or planned community that sets and enforces rules for properties within its jurisdiction, often collecting fees for the maintenance of common areas.
      - Tenant = Tenant:
      A person who occupies a rental property for a specific period based on a lease agreement.
      - LTV = Loan-to-Value Ratio:
      A ratio that compares the amount of a mortgage loan to the value of the property, used to assess the risk of the loan.
      — Turnkey Property = Turnkey Property:
      Definition: A property that is fully renovated and ready to be occupied or rented out, with no additional improvements needed.
      - TLC = Tender Loving Care:
      TLC refers to properties that require some repairs, updates, or general maintenance. 

      #A2P Compliance Guidelines:

      Your goal is to provide useful and compliant responses. Some words and phrases related to real estate marketing can trigger issues with A2P (Application-to-Person) messaging regulations and be flagged as spam. If you need to use any of the following words or phrases, please replace them with the approved alternatives provided below to ensure compliance.

      *Problematic Words and Their Alternatives:

      Free → Complimentary, No cost
      Guaranteed → Reliable, Secure
      Cash → Direct offer, Immediate payment
      Discount → Special offer, Reduced price
      Low rates → Affordable options, Competitive pricing
      Instant approval → Quick decision, Fast response
      No fees → Zero charges, No additional costs
      Quick sale → Fast process, Streamlined sale
      Immediate offer → Prompt proposal, Quick evaluation
      Buy now → Act now, Take action today
      Guaranteed offer → Firm proposal, Reliable offer
      Fast closing → Swift completion, Efficient closing
      100% approval → High likelihood of approval, Strong chances of success
      Easy financing → Flexible payment options, Convenient financing plans
      No credit check → Alternative financing options, Non-traditional financing
      Cash advance → Early payment option, Upfront offer
      Free estimate → Complimentary evaluation, No-cost assessment
      Foreclosure relief → Assistance with property challenges, Help with difficult situations
      Save money → Maximize savings, Optimize your investment
      Avoid foreclosure → Prevent property loss, Resolve financial concerns
      Debt relief → Debt management options, Debt resolution services
      Pre-approved → Pre-qualified, Pre-screened
      No obligation → No commitment, Without any obligation
      Zero down payment → No initial payment required, Minimal upfront cost
      Refinance → Loan adjustment, Mortgage restructuring
      We buy houses → We purchase properties, We invest in homes
      Sell fast → Sell with ease, Sell in a timely manner
      Sell for cash → Sell with direct payment, Sell for immediate compensation
      Eliminate debt → Reduce outstanding balances, Address debt challenges
      Property auction → Property sale event, Real estate bidding event
      Real estate investment → Property investment, Real estate opportunities
      Fast cash sale → Quick payment offer, Immediate compensation sale
      Owner financing → Seller-assisted financing, Flexible seller terms`;

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
    dealObjective: config.dealObjective,
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
  if (config.dealObjective) {
    const dealObjectiveMap: {[key: string]: string} = {
      'creative-finance': 'Creative Financing Options (seller financing, subject-to, lease options, etc.)',
      'cash-offer': 'Quick Cash Offers with minimal contingencies',
      'off-market': 'Off-Market Deals not listed on the MLS',
      'short-sale': 'Short Sales where the lender agrees to accept less than owed'
    };
    
    const dealObjectiveText = dealObjectiveMap[config.dealObjective] || config.dealObjective;
    instructions += `\n\nPRIMARY FOCUS:
- Your specialty is ${dealObjectiveText}
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

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    try {
      // Gracefully handle missing or invalid API key
      if (!API_KEY || API_KEY.length < 20) {
        console.warn('Missing or invalid OpenAI API key');
      }
      openai = new OpenAI({ apiKey: API_KEY });
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      throw new Error('Failed to initialize OpenAI client. Please check your API key.');
    }
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
    // Create OpenAI client
    const client = getOpenAIClient();
    
    // Configure token limits based on response length
    const maxTokens = config.length === 'short' ? 100 : config.length === 'medium' ? 200 : 300;
    
    // Get representation string - using the utility function
    const representationString = ensureValidRepresentation(config);
    
    // Log if we're using a default value
    if (representationString !== config.speakingOnBehalfOf) {
      console.log('⚠️ Using default representation because speakingOnBehalfOf is empty');
    }
    
    // Generate custom instructions based on config
    const customInstructions = generateAgentInstructions(config);
    
    // Build the prompt with representation directly embedded in the system prompt
    const prompt = BASE_PROMPT
      .replace(/{agentName}/g, config.agentName || 'Jane Smith')
      .replace(/{representation}/g, representationString)
      .replace(/{tone}/g, config.tone || 'friendly')
      .replace(/{length}/g, config.length || 'medium')
      .replace(/{customInstructions}/g, customInstructions);
    
    // Log full prompt for debugging
    console.log('🔶 Full AI Prompt:', prompt);
    console.log('🔶 Representation value:', representationString);
    
    try {
      console.log('🔶 Generating AI response with config:', {
        message,
        agentName: config.agentName,
        speakingOnBehalfOf: config.speakingOnBehalfOf,
        representationString,
        tone: config.tone,
        length: config.length,
        maxTokens
      });
      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      console.log('🤖 AI Agent Response:', response);
      console.log('🤖 AI Agent Usage:', completion.usage);

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
    } catch (openaiError) {
      console.error('🔴 OpenAI API error:', openaiError);
      
      // Create error response
      const errorResponse: AIResponse = {
        id: crypto.randomUUID(),
        conversationId: '',
        prompt: message,
        response: 'Sorry, I encountered an error while generating a response. Please check your API key and try again.',
        metadata: {
          tokens: 0,
          timestamp: new Date(),
          success: false,
          error: String(openaiError)
        },
      };
      
      return errorResponse;
    }
  } catch (error) {
    console.error('🔴 Error generating AI response:', error);
    throw error;
  }
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
        activeAgentId: data.activeAgentId || Object.keys(processedAgents)[0] || null,
        defaultAgentId: data.defaultAgentId || Object.keys(processedAgents)[0] || null
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
      activeAgentId: null,
      defaultAgentId: null
    };
  } catch (error) {
    console.error('Error loading multi-agent config:', error);
    
    // Return an empty config
    return {
      agents: {},
      activeAgentId: null,
      defaultAgentId: null
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
      multiAgentConfig.activeAgentId = Object.keys(remainingAgents)[0] || null;
    }
    
    if (multiAgentConfig.defaultAgentId === agentId) {
      multiAgentConfig.defaultAgentId = Object.keys(remainingAgents)[0] || null;
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
