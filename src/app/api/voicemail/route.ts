import { NextResponse } from 'next/server';
import axios from 'axios';
import { addProspectToCampaign } from '@/lib/voicedropCampaignService';
import { getAuthHeaders } from '@/lib/enhancedApi';



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