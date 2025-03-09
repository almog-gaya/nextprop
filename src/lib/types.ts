// Template Types
export interface BaseTemplate {
  id: string;
  name: string;
  sendDelay?: number; // Delay in hours
  sendTime?: string; // Specific time of day
  type: 'introduction' | 'follow-up' | 'property-info' | 'custom';
}

export interface EmailTemplate extends BaseTemplate {
  subject: string;
  body: string;
  previewText?: string;
}

export interface SmsTemplate extends BaseTemplate {
  message: string;
  includeLink?: boolean;
  maxLength?: number;
}

export interface VoicemailTemplate extends BaseTemplate {
  audioUrl: string;
  transcription: string;
  duration?: number; // Length in seconds
  voiceType?: 'male' | 'female' | 'ai';
}

// Communication Channel Types
export type CommunicationChannel = 'email' | 'sms' | 'voicemail' | 'call';

// Automation Types
export interface AutomationFlow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  steps: {
    pipeline: string;
    communicationChannels: CommunicationChannel[];
    schedule: {
      count: number;
      frequency: string;
    };
    emailTemplates: string[];
    smsTemplates: string[];
    voicemailTemplates: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AutomationJobStatus {
  jobId: string;
  status: 'initializing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  currentTime: string;
  statistics: {
    contactsProcessed: number;
    totalContacts: number;
    duplicatesFound: number;
    opportunitiesCreated: number;
    communicationsSent: number;
  };
} 