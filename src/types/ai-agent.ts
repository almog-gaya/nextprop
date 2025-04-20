export type AIAgentConfig = {
  id?: string; // Unique identifier for the agent
  name?: string; // Display name for the agent (different from agentName)
  isEnabled: boolean;
  enabledPipelines: { id: string; name: string }[];
  tone: 'friendly' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  customInstructions?: string;
  updatedAt: Date;
  template?: string; // Template used to create this agent
  
  // NextProp client agent configuration
  agentName?: string; // Name shown to clients
  speakingOnBehalfOf?: string; // Who the agent is representing
  contactPhone?: string; // Contact phone number
  contactEmail?: string; // Contact email
  companyWebsite?: string; // Company website URL
  companyAbout?: string; // About the company (optional)
  buyingCriteria?: string; // Purchase price, preferences, etc.
  dealObjective?: 
    | 'creative-finance' | 'cash-offer' | 'off-market' | 'short-sale' | 'home-owner' | 'distressed-seller' // Legacy options
    | 'realtor-off-market' | 'realtor-short-sale' | 'realtor-creative-finance' | 'realtor-cash-buyers' // For realtors
    | 'homeowner-cash-offer' | 'homeowner-distressed' | 'homeowner-quick-sale' | 'homeowner-relocation'; // For home owners

  propertyType?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number; 
  additionalPropertyTypes?: string; // Additional property types or descriptions
  customPropertyTypes?: string[]; // Custom property types added by the user
  
  // Customizable rules and content
  rules?: Rule[]; // Custom rules to add to the prompt
  qaEntries?: QAEntry[]; // Custom Q&A entries
  enabledRules?: string[]; // IDs of enabled rules
};

// New type for multi-agent configuration
export type MultiAgentConfig = {
  agents: { [agentId: string]: AIAgentConfig };
  activeAgentId?: string; // Currently selected agent
  defaultAgentId?: string; // Default agent to use
};

// Agent template type
export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  config: Partial<AIAgentConfig>; // Template default settings
};

// Rule type for customizable rules
export type Rule = {
  id: string;
  text: string;
  category: 'communication' | 'compliance' | 'business' | 'representation' | 'other';
  description?: string;
};

// Q&A entry type
export type QAEntry = {
  id: string;
  question: string;
  answer: string;
  isEnabled: boolean;
};

// Predefined agent templates
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'buyer_agent',
    name: 'Buyer Agent',
    description: 'Specializes in buyer outreach and qualification',
    icon: 'UserIcon',
    config: {
      name: 'Buyer Agent',
      agentName: 'Taylor',
      tone: 'professional',
      length: 'medium',
      dealObjective: 'cash-offer',
      customInstructions: 'Focuses on qualifying potential property buyers and building relationships with investor clients.',
      rules: [
        {
          id: 'rule_buyer_focus',
          text: 'Always focus on buyer needs and qualification questions',
          category: 'business',
          description: 'Emphasizes buyer criteria and purchasing capabilities'
        }
      ]
    }
  },
  {
    id: 'seller_agent',
    name: 'Seller Agent', 
    description: 'Specializes in seller outreach and property acquisition',
    icon: 'HomeIcon',
    config: {
      name: 'Seller Agent',
      agentName: 'Morgan',
      tone: 'friendly',
      length: 'medium',
      dealObjective: 'off-market',
      customInstructions: 'Focuses on acquiring property information from potential sellers and explaining the selling process.',
      rules: [
        {
          id: 'rule_seller_focus',
          text: 'Always focus on property details and seller motivations',
          category: 'business',
          description: 'Emphasizes property condition and timeline for selling'
        }
      ]
    }
  },
  {
    id: 'admin_agent',
    name: 'Admin Agent',
    description: 'Handles general inquiries and administrative tasks',
    icon: 'ClipboardIcon',
    config: {
      name: 'Admin Agent',
      agentName: 'Alex',
      tone: 'professional',
      length: 'short',
      customInstructions: 'Handles general inquiries, scheduling, and administrative tasks.',
      rules: [
        {
          id: 'rule_admin_focus',
          text: 'Focus on organizing information and coordinating next steps',
          category: 'communication',
          description: 'Emphasizes clarity and efficiency in communications'
        }
      ]
    }
  }
];

export type AIResponse = {
  id: string;
  conversationId: string;
  prompt: string;
  response: string;
  agentId?: string; // Which agent generated this response
  metadata: {
    tokens: number;
    timestamp: Date;
    success: boolean;
    error?: string;
  };
}; 