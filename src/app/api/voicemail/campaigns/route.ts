import { NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// VoiceDrop API configuration 
const VOICEDROP_API_KEY = 'vd_L6JGDq5Vj924Eq7k7Mb1';
const VOICEDROP_API_BASE_URL = 'https://api.voicedrop.ai/v1';
const DEFAULT_VOICE_CLONE_ID = 'dodUUtwsqo09HrH2RO8w';
const DEFAULT_SENDER_PHONE = '+1 929-415-9655';

// In-memory store for campaigns (in production, use a database)
let campaigns: any[] = [];

// Helper to generate a webhook URL
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// GET all campaigns
export async function GET() {
  return NextResponse.json({ campaigns });
}

// POST to create a new campaign
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { contacts, script, delayMinutes, dailyLimit } = data;
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Contacts are required' }, { status: 400 });
    }
    
    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }
    
    // Generate the webhook URL based on the current request's origin
    const baseUrl = getBaseUrl(request);
    const webhookUrl = `${baseUrl}/api/webhook/voicemail`;
    
    // Create campaign
    const campaignId = uuidv4();
    const now = new Date();
    
    const campaign = {
      id: campaignId,
      name: data.name || `Campaign ${campaignId.substring(0, 8)}`,
      createdAt: now.toISOString(),
      status: 'active',
      script,
      delayMinutes: delayMinutes || 5,
      dailyLimit: dailyLimit || 50,
      contacts: contacts.map((contact: any, index: number) => {
        // Calculate scheduled time based on delay
        const scheduledTime = new Date(now.getTime() + (index * (delayMinutes || 5) * 60 * 1000));
        
        return {
          ...contact,
          status: index === 0 ? 'sending' : 'pending',
          scheduledTime: scheduledTime.toISOString(),
          result: null,
          retries: 0
        };
      }),
      progress: {
        total: contacts.length,
        sent: 0,
        pending: contacts.length,
        failed: 0
      }
    };
    
    // Store the campaign
    campaigns.push(campaign);
    
    // Send the first voicemail immediately
    const firstContact = campaign.contacts[0];
    try {
      // Create the payload for VoiceDrop
      const personalizedScript = script
        .replace(/{{first_name}}/g, firstContact.firstName || '')
        .replace(/{{street_name}}/g, firstContact.streetName || '');
      
      const payload = {
        voice_clone_id: DEFAULT_VOICE_CLONE_ID,
        script: personalizedScript,
        to: firstContact.phone,
        from: DEFAULT_SENDER_PHONE,
        validate_recipient_phone: true,
        send_status_to_webhook: webhookUrl,
        metadata: {
          campaignId,
          contactId: firstContact.id
        }
      };
      
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
      
      // Update the contact with the response
      firstContact.status = 'sent';
      firstContact.result = response.data;
      firstContact.sentAt = new Date().toISOString();
      
      // Update campaign progress
      campaign.progress.sent = 1;
      campaign.progress.pending = campaign.progress.total - 1;
    } catch (error) {
      // Handle error sending the first voicemail
      firstContact.status = 'failed';
      firstContact.error = error instanceof Error ? error.message : 'Unknown error';
      firstContact.retries++;
      
      // Update campaign progress
      campaign.progress.failed = 1;
      campaign.progress.pending = campaign.progress.total - 1;
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// PATCH to update a campaign (pause, resume, etc.)
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, action, delayMinutes, dailyLimit } = data;
    
    // Find the campaign
    const campaignIndex = campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    const campaign = campaigns[campaignIndex];
    
    // Handle different actions
    switch(action) {
      case 'pause':
        campaign.status = 'paused';
        break;
        
      case 'resume':
        campaign.status = 'active';
        break;
        
      case 'cancel':
        campaign.status = 'cancelled';
        // Mark all pending contacts as cancelled
        campaign.contacts.forEach((contact: any) => {
          if (contact.status === 'pending') {
            contact.status = 'cancelled';
          }
        });
        campaign.progress.pending = 0;
        break;
        
      case 'updateDelay':
        if (delayMinutes) {
          campaign.delayMinutes = delayMinutes;
        }
        break;
        
      case 'updateLimit':
        if (dailyLimit) {
          campaign.dailyLimit = dailyLimit;
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Update the campaign in our store
    campaigns[campaignIndex] = campaign;
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// DELETE a campaign
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }
    
    // Find and remove the campaign
    const initialLength = campaigns.length;
    campaigns = campaigns.filter(c => c.id !== id);
    
    if (campaigns.length === initialLength) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 