/**
 * Automation Service
 * 
 * Handles the logic for automating workflows in the NextProp platform
 */

import { fetchWithErrorHandling, getAuthHeaders } from './enhancedApi';

// Types for automation workflows
export type CommunicationChannel = 'email' | 'sms' | 'voicemail' | 'call';

export interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  lastRun?: string;
  steps: {
    source: 'zillow' | 'manual';
    contactCount: number;
    pipeline: string;
    communicationChannels: CommunicationChannel[];
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      count: number;
    };
  };
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

/**
 * Start an automation workflow
 */
export async function startAutomation(
  name: string,
  description: string,
  searchQuery: string,
  contactCount: number,
  pipeline: string,
  communicationChannels: CommunicationChannel[],
  frequency: 'daily' | 'weekly' | 'monthly',
  count: number
): Promise<{ jobId: string }> {
  try {
    const response = await fetch('/api/automations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        searchQuery,
        contactCount,
        pipeline,
        communicationChannels,
        frequency,
        count
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start automation');
    }

    const result = await response.json();
    return { jobId: result.jobId };
  } catch (error) {
    console.error('Error starting automation:', error);
    throw error;
  }
}

/**
 * Get the status of an automation job
 */
export async function getAutomationStatus(jobId: string): Promise<AutomationJobStatus> {
  try {
    const response = await fetch(`/api/automations/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get automation status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting automation status:', error);
    throw error;
  }
}

/**
 * Cancel an automation job
 */
export async function cancelAutomation(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`/api/automations/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel automation');
    }

    await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error cancelling automation:', error);
    throw error;
  }
}

/**
 * Helper function to check for duplicate contacts
 */
export async function checkForDuplicateContacts(email?: string, phone?: string): Promise<boolean> {
  if (!email && !phone) return false;

  try {
    // In a real implementation, this would check against the GoHighLevel API
    // For now, we'll return a mock result
    return Math.random() > 0.8; // 20% chance of being a duplicate
  } catch (error) {
    console.error('Error checking for duplicate contacts:', error);
    return false;
  }
}

/**
 * Add a contact to the GHL system
 */
export async function addContact(contactData: any): Promise<{ id: string }> {
  try {
    const response = await fetch('/api/contacts/add-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      throw new Error('Failed to add contact');
    }

    const result = await response.json();
    return { id: result.id };
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
}

/**
 * Add a contact as an opportunity
 */
export async function addOpportunity(opportunityData: any): Promise<{ id: string }> {
  try {
    const response = await fetch('/api/opportunities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opportunityData),
    });

    if (!response.ok) {
      throw new Error('Failed to add opportunity');
    }

    const result = await response.json();
    return { id: result.id };
  } catch (error) {
    console.error('Error adding opportunity:', error);
    throw error;
  }
}

/**
 * Schedule communications for a contact
 */
export async function scheduleCommunication(
  contactId: string,
  channels: CommunicationChannel[],
  scheduleTime: Date
): Promise<{ success: boolean }> {
  try {
    // In a real implementation, this would schedule communications via the GHL API
    // For now, we'll return a mock result
    return { success: true };
  } catch (error) {
    console.error('Error scheduling communication:', error);
    throw error;
  }
} 