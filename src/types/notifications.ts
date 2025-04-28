export interface NotificationPreference {
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  enabled: boolean;
} 
export interface NotificationPreferences {
  newCall: NotificationPreference[];  
  newSMS: NotificationPreference[]; 
  leadStatusChange: NotificationPreference[]; 
  newLeadAssigned: NotificationPreference[];  
}

export interface NotificationSettings {
  locationId: string;
  preferences: NotificationPreferences;
  updatedAt: Date;
} 