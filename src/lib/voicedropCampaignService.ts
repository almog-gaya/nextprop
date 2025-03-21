import axios from 'axios';

// VoiceDrop API configuration 
export const VOICEDROP_API_KEY = 'vd_L6JGDq5Vj924Eq7k7Mb1';
export const VOICEDROP_API_BASE_URL = 'https://api.voicedrop.ai/v1';
export const DEFAULT_VOICE_CLONE_ID = 'dodUUtwsqo09HrH2RO8w';
export const VOICEDROP_AUTH_KEY_CAMPAIGN = '1727188255984x807954419518024600';

const REY_PERSONALIZED_VARS = {
  '1742260014630x107958174440751100': { "First Name": "", "Last Name": "", "Company Name": "", "Type": "", "Status": "", "Street Address": "", "City": "", "State": "", "Zip": "", "Mail Street Address": "", "Mail City": "", "Mail State": "", "Mail Zip": "", "Mail Address Same": "", "Cell": "", "DNC": "", "Cell 2": "", "DNC 2": "", "Cell 3": "", "DNC 3": "", "Cell 4": "", "DNC 4": "", "Landline": "", "Landline 2": "", "Landline 3": "", "Landline 4": "", "Phone": "", "Phone 4": "", "Email 1": "", "Email 2": "", "Email 3": "", "Email 4": "" },
  '1742403447414x453431456793886700': { "First Name": "", "Last Name": "", "Company Name": "", "Type": "", "Status": "", "Street Address": "", "City": "", "State": "", "Zip": "", "Mail Street Address": "", "Mail City": "", "Mail State": "", "Mail Zip": "", "Mail Address Same": "", "Cell": "", "DNC": "", "Cell 2": "", "DNC 2": "", "Cell 3": "", "DNC 3": "", "Cell 4": "", "DNC 4": "", "Landline": "", "Landline 2": "", "Landline 3": "", "Landline 4": "", "Phone": "", "Phone 2": "", "Phone 3": "", "Phone 4": "", "Email 1": "", "Email 2": "", "Email 3": "", "Email 4": "" }
}

// Interface for campaign settings
export interface CampaignSettings {
  startTime: string;
  endTime: string;
  timezone: string;
  maxPerHour: number;
  daysOfWeek: string[];
  delayMinutes?: number;
  dailyLimit?: number;
}

// Interface for contact/prospect data
export interface ContactData {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  streetName?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  propertyLink?: string;
  [key: string]: any;
}

// Interface for campaign data
export interface CampaignData {
  name: string;
  script: string;
  senderPhone: string;
  settings: CampaignSettings;
  contacts: ContactData[];
  webhookUrl: string;
}

// Interface for voice clone
export interface VoiceClone {
  id: string;
  name: string;
}

// Interface for campaign list item
export interface Campaign {
  _id: string;
  Name: string;
  "Campaign Status": string;
  "Voice Clone IDs": string[];
  "Hourly Max Sending Rate": number;
  "From Phone Numbers": string[];
  "Scheduled Days": string[];
  "Script": string;
  "Type of Campaign": string;
  "Sending Until": string;
  "Sending From": string;
  "Schedule Timezone": string;
}

// Error handling utility
const handleApiError = (error: any): never => {
  console.error('VoiceDrop API Error:', error);

  if (error.response?.data) {
    console.error('Response data:', error.response.data);
    throw new Error(`VoiceDrop API Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
  }

  throw new Error(`VoiceDrop API Error: ${error.message || 'Unknown error'}`);
};

/**
 * Create a new campaign in VoiceDrop
 */
export async function createCampaign(campaignData: CampaignData): Promise<string> {
  try {
    // Format days of week as expected by VoiceDrop API
    const daysOfWeek = campaignData.settings.daysOfWeek.map(day => {
      const dayMap: Record<string, string> = {
        'Mon': 'monday',
        'Tue': 'tuesday',
        'Wed': 'wednesday',
        'Thu': 'thursday',
        'Fri': 'friday',
        'Sat': 'saturday',
        'Sun': 'sunday'
      };
      return dayMap[day] || day.toLowerCase();
    });

    // Format start/end times to 24-hour format if needed
    const formatTime = (timeString: string): string => {
      // If already in 24-hour format, return as is
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString;
      }

      // Convert 12-hour format to 24-hour
      const [time, modifier] = timeString.split(' ');
      let [hours, minutes] = time.split(':');

      if (hours === '12') {
        hours = '00';
      }

      if (modifier === 'PM') {
        hours = (parseInt(hours, 10) + 12).toString();
      }

      return `${hours.padStart(2, '0')}:${minutes}`;
    };

    // Create campaign payload
    const payload = {
      name: campaignData.name,
      script: campaignData.script,
      voice_clone_id: DEFAULT_VOICE_CLONE_ID,
      from_number: campaignData.senderPhone,
      schedule: {
        days_of_week: daysOfWeek,
        start_time: formatTime(campaignData.settings.startTime),
        end_time: formatTime(campaignData.settings.endTime),
        timezone: campaignData.settings.timezone.split(' ')[0], // Extract just the timezone code (EST)
        max_per_hour: campaignData.settings.maxPerHour,
        // Include these if they exist
        ...(campaignData.settings.delayMinutes && { delay_minutes: campaignData.settings.delayMinutes }),
        ...(campaignData.settings.dailyLimit && { daily_limit: campaignData.settings.dailyLimit })
      },
      webhook_url: campaignData.webhookUrl
    };

    // Make the API call to VoiceDrop
    const response = await axios.post(
      `${VOICEDROP_API_BASE_URL}/campaigns`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        }
      }
    );

    console.log('Campaign created in VoiceDrop:', response.data);

    // Return the VoiceDrop campaign ID
    return response.data.id;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Add a prospect (contact) to a VoiceDrop campaign
 */
export async function addProspectToCampaign(voicedropCampaignId: string, contact: ContactData): Promise<any> {
  try {
    // Prepare personalization variables
    const personalizationVariables: Record<string, string> = {
      first_name: contact.firstName || '',
      last_name: contact.lastName || ''
    };

    // Add other fields if they exist
    if (contact.streetName) personalizationVariables.street_name = contact.streetName;
    if (contact.address1) personalizationVariables.address = contact.address1;
    if (contact.city) personalizationVariables.city = contact.city;
    if (contact.state) personalizationVariables.state = contact.state;
    if (contact.zip) personalizationVariables.zip = contact.zip;
    if (contact.email) personalizationVariables.email = contact.email;
    if (contact.propertyLink) personalizationVariables.property_link = contact.propertyLink;

    // Add any other custom fields from the contact
    Object.keys(contact).forEach(key => {
      if (!['id', 'firstName', 'lastName', 'phone', 'streetName', 'address1', 'city', 'state', 'zip', 'email', 'propertyLink'].includes(key)) {
        personalizationVariables[key] = String(contact[key] || '');
      }
    });
    const personalizedVarPayload =  {
      "Landline 4": "",
      "Last Name": contact.lastName || '',
      "Mail Zip": "",
      "DNC 4": "",
      "Zip": contact.zip || "",
      "Phone 4": "",
      "Cell 2": "",
      "DNC": "",
      "Phone 2": "",
      "DNC 2": "",
      "Email 4": "",
      "Phone 3": "",
      "Mail City": "",
      "Landline 2": "",
      "Company Name": "",
      "Street Address": contact.address1 || contact.streetName || "",
      "City": contact.city || "",
      "Landline": "",
      "Email 2": "",
      "Mail Address Same": "",
      "Phone": contact.phone || "",
      "State": "",
      "Landline 3": "",
      "First Name": "",
      "Mail Street Address": "",
      "Cell 4": "",
      "Cell 3": "",
      "Mail State": "",
      "Email 3": "",
      "Type": "",
      "DNC 3": "",
      "Status": "",
      "Email 1": contact.email || "",
    } // Create prospect payload
    const payload = {
      prospect_phone: contact.phone,
      personalization_variables: personalizedVarPayload,
      metadata: {
        contact_id: contact.id
      }
    };

    console.log(`SNED Payload` , payload)

    // Make the API call to VoiceDrop
    const response = await axios.post(
      `${VOICEDROP_API_BASE_URL}/campaigns/${voicedropCampaignId}/prospects`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_AUTH_KEY_CAMPAIGN
        }
      }
    );

    console.log(`Prospect ${contact.id} added to campaign ${voicedropCampaignId}:`, response.data);

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update a campaign's status (active, paused, archived)
 */
export async function updateCampaignStatus(voicedropCampaignId: string, status: 'active' | 'paused' | 'archived'): Promise<boolean> {
  try {
    // Make the API call to VoiceDrop
    const response = await axios.patch(
      `${VOICEDROP_API_BASE_URL}/campaigns/${voicedropCampaignId}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        }
      }
    );

    console.log(`Campaign ${voicedropCampaignId} status updated to ${status}:`, response.data);

    return true;
  } catch (error) {
    console.error(`Error updating campaign ${voicedropCampaignId} status:`, error);
    return false;
  }
}

/**
 * Get campaign report data
 */
export async function getCampaignReport(voicedropCampaignId: string): Promise<string> {
  try {
    // Make the API call to VoiceDrop
    const response = await axios.get(
      `${VOICEDROP_API_BASE_URL}/campaigns/${voicedropCampaignId}/reports`,
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        }
      }
    );

    console.log(`Got report link for campaign ${voicedropCampaignId}:`, response.data);

    // Return the CSV URL
    return response.data.csv_url;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * List all campaigns
 */
export async function listCampaigns(): Promise<any[]> {
  try {
    // Make the API call to VoiceDrop with a longer timeout
    const response = await axios.get(
      `${VOICEDROP_API_BASE_URL}/campaigns`,
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        },
        timeout: 15000 // 15 second timeout to prevent long hanging requests
      }
    );

    console.log('VoiceDrop campaigns API response:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error listing campaigns:', error);
    throw error;
  }
}

/**
 * Utility to fetch and process a CSV from a URL
 */
export async function fetchAndParseCSV(csvUrl: string): Promise<any[]> {
  try {
    // Fetch the CSV
    const response = await axios.get(csvUrl);
    const csvData = response.data;

    // Simple CSV parser (consider using a proper CSV library in production)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map((header: string) => header.trim());

    const results = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map((value: string) => value.trim());
      const entry: Record<string, string> = {};

      headers.forEach((header: string, index: number) => {
        entry[header] = values[index] || '';
      });

      results.push(entry);
    }

    return results;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

/**
 * Get campaign statistics
 */
export async function getCampaignStatistics(voicedropCampaignId: string): Promise<any> {
  try {
    // Get report URL
    const csvUrl = await getCampaignReport(voicedropCampaignId);

    // Parse the CSV
    const results = await fetchAndParseCSV(csvUrl);

    // Calculate statistics
    const stats = {
      total: results.length,
      delivered: results.filter(r => r.status === 'delivered' || r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
      pending: results.filter(r => r.status === 'pending' || r.status === 'scheduled').length,
      callbacks: results.filter(r => r.callback === 'true' || r.status === 'callback').length
    };

    return {
      stats,
      details: results
    };
  } catch (error) {
    console.error(`Error getting campaign ${voicedropCampaignId} statistics:`, error);
    return {
      stats: {
        total: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        callbacks: 0
      },
      details: []
    };
  }
}

/**
 * List all voice clones
 */
export async function listVoiceClones(): Promise<VoiceClone[]> {
  try {
    // Make the API call to VoiceDrop with a longer timeout
    const response = await axios.get(
      `${VOICEDROP_API_BASE_URL}/voice-clones`,
      {
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        },
        timeout: 45000 // 15 second timeout to prevent long hanging requests
      }
    );

    console.log('Voice clones list response:', response.data);

    // Return the voice clones
    return response.data;
  } catch (error) {
    console.error('Error fetching voice clones:', error);
    throw error; // Rethrow to be handled by caller
  }
} 