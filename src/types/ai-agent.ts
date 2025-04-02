export type AIAgentConfig = {
  isEnabled: boolean;
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