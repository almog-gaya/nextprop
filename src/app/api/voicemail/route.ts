import { NextResponse } from 'next/server';
import axios from 'axios';

// VoiceDrop API configuration 
const VOICEDROP_API_KEY = 'vd_L6JGDq5Vj924Eq7k7Mb1';
const VOICEDROP_API_BASE_URL = 'https://api.voicedrop.ai/v1';
const DEFAULT_VOICE_CLONE_ID = 'dodUUtwsqo09HrH2RO8w';
const DEFAULT_SENDER_PHONE = '+1 929-415-9655';

// Function to get the base URL of the current request
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Generate the webhook URL based on the current request's origin
    const baseUrl = getBaseUrl(request);
    const webhookUrl = `${baseUrl}/api/webhook/voicemail`;
    
    console.log('Webhook URL:', webhookUrl);
    console.log('Received data:', {
      message: data.message,
      phone: data.phone,
      first_name: data.first_name,
      street_name: data.street_name
    });
    
    // Create the payload for VoiceDrop
    const payload = {
      voice_clone_id: DEFAULT_VOICE_CLONE_ID,
      script: data.message,
      to: data.phone,
      from: DEFAULT_SENDER_PHONE,
      validate_recipient_phone: true,
      send_status_to_webhook: webhookUrl
    };
    
    console.log('Sending request to VoiceDrop API:', payload);
    
    // Make the API call to VoiceDrop
    const response = await axios.post(
      `${VOICEDROP_API_BASE_URL}/ringless_voicemail`, 
      payload,
      { 
        headers: {
          'Content-Type': 'application/json',
          'auth-key': VOICEDROP_API_KEY
        }
      }
    );
    
    console.log('VoiceDrop API response:', response.data);
    
    // Return the response
    return NextResponse.json({
      ...response.data,
      webhookUrl: webhookUrl // Include the webhook URL in the response
    });
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