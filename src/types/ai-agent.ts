export type AIAgentConfig = {
  isEnabled: boolean;
  tone: 'friendly' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  customInstructions?: string;
  updatedAt: Date;
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
  };
}; 