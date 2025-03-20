import { NextResponse } from 'next/server';
import axios from 'axios';
import { addProspectToCampaign } from '@/lib/voicedropCampaignService';
import { getAuthHeaders } from '@/lib/enhancedApi';

// VoiceDrop API configuration 
const VOICEDROP_API_KEY = 'vd_L6JGDq5Vj924Eq7k7Mb1';
const VOICEDROP_API_BASE_URL = 'https://api.voicedrop.ai/v1';
const DEFAULT_VOICE_CLONE_ID = 'dodUUtwsqo09HrH2RO8w';


// Function to get the base URL of the current request
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const {locationId} = await getAuthHeaders();
    // Parse the request body
    const data = await request.json(); 
    // Use provided sender phone or default
    const fromPhone = data.from || 'no_phone_number';
    // {
    //   "customer_id": "bahadur",
    //   "voice_clone_id" : "dodUUtwsqo09HrH2RO8w",
    //   "name": "My Campaign",
    //   "from_number": "7865162371",
    //   "interval_seconds": 60,
    //   "days": ["Wednesday", "Thursday"],
    //   "time_window": {"start": "00:00", "end": "23:00"},
    //   "timezone": "America/New_York",
    //   "message": "Hi {{first_name}}, I hope you are well. Your apartment at {{street_name}}.",
    //   "contacts": [
    //     {"phone_number": "123-456-7890", "first_name": "Bahadur", "street_name": "i-10"},
    //     {"phone_number": "786-516-2371", "first_name": "Amir", "street_name": "NY Bahadur"}
    //   ]
    // }
    const payload = {
      customer_id: locationId,
      voice_clone_id: data.voiceCloneId || DEFAULT_VOICE_CLONE_ID,
      script: data.message, 
      from: fromPhone, 
      name: data.name || 'My Campaign',
      // Add personalization variables
      personalization_variables: {
        first_name: data.first_name,
        street_name: data.street_name,
        ...(data.last_name && { last_name: data.last_name }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.zip && { zip: data.zip }),
        ...(data.email && { email: data.email }),
        ...(data.property_link && { property_link: data.property_link })
      },
      // Add scheduling metadata
      metadata: {
        startTime: data.startTime || "10:00 AM",
        endTime: data.endTime || "4:00 PM",
        timezone: data.timezone || "EST (New York)",
        maxPerHour: data.maxPerHour || 100,
        daysOfWeek: data.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri"]
      }
    };
    
   
  } catch (error) {
    console.error('Error making VoiceDrop API call:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 