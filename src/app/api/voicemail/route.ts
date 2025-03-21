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
    const payload = await request.json();  
    payload.customer_id = locationId;
    const response = await fetch('https://backend.iky.link/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ENHANCED_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return NextResponse.json(data);
   
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