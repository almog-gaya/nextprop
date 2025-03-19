import { NextResponse } from 'next/server';
import axios from 'axios';
import { addProspectToCampaign } from '@/lib/voicedropCampaignService';

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
      last_name: data.last_name,
      street_name: data.street_name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      email: data.email,
      property_link: data.property_link,
      from: data.from,
      startTime: data.startTime,
      endTime: data.endTime,
      timezone: data.timezone,
      maxPerHour: data.maxPerHour,
      daysOfWeek: data.daysOfWeek,
      campaignId: data.campaignId,
      voiceCloneId: data.voiceCloneId
    });
    
    // Use provided sender phone or default
    const fromPhone = data.from || 'no_phone_number';
    
    // If a campaign ID is provided, add the prospect to that campaign
    if (data.campaignId) {
      try {
        // Create a contact object from the data
        const contact = {
          id: `api-${Date.now()}`,
          firstName: data.first_name,
          phone: data.phone,
          streetName: data.street_name,
          // Add any other fields from the data
          ...(data.last_name && { lastName: data.last_name }),
          ...(data.address && { address1: data.address }),
          ...(data.city && { city: data.city }),
          ...(data.state && { state: data.state }),
          ...(data.zip && { zip: data.zip }),
          ...(data.email && { email: data.email }),
          ...(data.property_link && { propertyLink: data.property_link })
        };
        
        console.log(`Adding prospect to campaign ${data.campaignId}:`, contact);
        
        // Add prospect to campaign
        const result = await addProspectToCampaign(data.campaignId, contact);
        
        return NextResponse.json({
          status: 'success',
          message: `Voicemail queued via campaign ${data.campaignId}`,
          campaignId: data.campaignId,
          webhookUrl: webhookUrl
        });
      } catch (error) {
        console.error('Error adding prospect to campaign:', error);
        return NextResponse.json(
          { 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Error adding prospect to campaign'
          }, 
          { status: 500 }
        );
      }
    } else {
      // Use direct ringless voicemail approach
      // Create the payload for VoiceDrop
      const payload = {
        voice_clone_id: data.voiceCloneId || DEFAULT_VOICE_CLONE_ID,
        script: data.message,
        to: data.phone,
        from: fromPhone,
        validate_recipient_phone: true,
        send_status_to_webhook: webhookUrl,
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
    }
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