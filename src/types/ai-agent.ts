export type AIAgentConfig = {
  isEnabled: boolean;
  enabledPipelines: { id: string; name: string }[];
  tone: 'friendly' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  customInstructions?: string;
  updatedAt: Date;
  
  // NextProp client agent configuration
  agentName?: string; // Name shown to clients
  speakingOnBehalfOf?: string; // Who the agent is representing
  contactPhone?: string; // Contact phone number
  contactEmail?: string; // Contact email
  buyingCriteria?: string; // Purchase price, preferences, etc.
  dealObjective?: 'creative-finance' | 'cash-offer' | 'off-market' | 'short-sale'; // Deal type objective

  // New customizable prompt sections
  rules?: Rule[]; // Custom rules to add to the prompt
  qaEntries?: QAEntry[]; // Custom Q&A entries
  enabledRules?: string[]; // IDs of enabled rules
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

export type AIResponse = {
  id: string;
  conversationId: string;
  prompt: string;
  response: string;
  metadata: {
    tokens: number;
    timestamp: Date;
    success: boolean;
    error?: string;
  };
}; 