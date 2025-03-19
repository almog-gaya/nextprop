import { NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  createCampaign as createVoicedropCampaign,
  addProspectToCampaign,
  updateCampaignStatus,
  getCampaignStatistics,
  listCampaigns
} from '@/lib/voicedropCampaignService';

// Store campaigns in memory for demo
// In a real app, this would be in a database
export let campaigns: any[] = [];

// Let's add a simple cache for campaigns
let cachedCampaigns: any[] = [];
let lastCacheTime = 0;

// Sample campaigns to use if API fails and no cache is available
const sampleCampaigns = [
  {
    "Name": "Reey",
    "_id": "1741117009238x851709874282168300",
    "Campaign Status": "Completed",
    "Voice Clone IDs": [
        "Es45QkMNPudcZKVRZWPs"
    ],
    "Hourly Max Sending Rate": 25,
    "From Phone Numbers": [
        "9295953158",
        "4155328726",
        "9294051405",
        "9292052968",
        "9294159655",
        "9294922151",
        "7867517909"
    ],
    "Scheduled Days": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ],
    "Script": " Hai {{First Name}} uh, its Ray. I'm an investor from Toronto based in Miami. Uh, I noticed you tried selling your property in Haialea but it didn't sell ... if it’s still relevant i’d be happy to give you a cash offer with a quick closing. Whenever you have time feel free to call or text me back. Thanks.",
    "Type of Campaign": "AI Voice RVM",
    "Sending Until": "3:00 PM",
    "Sending From": "9:00 AM",
    "Schedule Timezone": "EST (New York)"
},
{
  "Name": "Rey Divorced",
  "_id": "1742260014630x107958174440751100",
  "Campaign Status": "Active",
  "Voice Clone IDs": [
      "Es45QkMNPudcZKVRZWPs"
  ],
  "Hourly Max Sending Rate": 50,
  "From Phone Numbers": [
      "7867517909"
  ],
  "Scheduled Days": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
  ],
  "Script": "Hi {{First Name}} it's Rey here, I'm an investor from Toronto based in Miami.Uh, I noticed you own a property in {{Mail City}} for quite some time now and I thought it might be interesting for you to hear an offer. Uhm, cash of course with a quick closing. Call me when you can or text me. Thanks ",
  "Type of Campaign": "AI Voice RVM",
  "Sending Until": "4:00 PM",
  "Sending From": "10:00 AM",
  "Schedule Timezone": "EST (New York)"
},
];

// Function to get the base URL of the current request
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// GET endpoint to retrieve campaigns
export async function GET(request: Request) {
  try {
    // Check if we have a recent cache (less than 5 minutes old)
    const now = Date.now();
    const cacheAge = now - lastCacheTime;
    const useCache = cachedCampaigns.length > 0 && cacheAge < 5 * 60 * 1000;
    
    if (useCache) {
      console.log('Using cached campaigns, age:', Math.round(cacheAge/1000), 'seconds');
      return NextResponse.json(cachedCampaigns);
    }
    
    // Fetch campaigns from VoiceDrop API
    const voicedropCampaigns = await listCampaigns();
    
    // Update cache
    cachedCampaigns = voicedropCampaigns;
    lastCacheTime = now;
    
    // Return campaigns from API
    return NextResponse.json(voicedropCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    // If we have cached data, return that instead of an error
    if (cachedCampaigns.length > 0) {
      console.log('Returning cached campaigns after API error');
      return NextResponse.json(cachedCampaigns);
    }
    
    // Return sample campaigns since API is failing and no cache exists
    console.log('Returning sample campaigns as fallback');
    return NextResponse.json(sampleCampaigns);
  }
}

// POST to create a new campaign
export async function POST(request: Request) {
  try {
    // Generate the webhook URL for status updates
    const baseUrl = getBaseUrl(request);
    const webhookUrl = `${baseUrl}/api/webhook/voicemail`;
    
    // Parse the request body
    const data = await request.json();
    const { 
      contacts, 
      script, 
      delayMinutes = 5, 
      dailyLimit = 50, 
      senderPhone,
      startTime = "10:00 AM",
      endTime = "4:00 PM",
      timezone = "EST (New York)",
      maxPerHour = 100,
      daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    } = data;
    
    // Validate required data
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Contacts are required' }, { status: 400 });
    }
    
    if (!script || typeof script !== 'string') {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }
    
    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ error: 'At least one day of the week must be selected' }, { status: 400 });
    }
    
    // Use provided sender phone number or fall back to default
    const fromPhone = senderPhone;
    if (!fromPhone) {
      return NextResponse.json({ error: 'Sender phone number is required' }, { status: 400 });
    }
    
    // Generate a campaign ID for our system
    const campaignId = uuidv4();
    
    // Create the campaign in VoiceDrop
    const campaignSettings = {
      startTime,
      endTime, 
      timezone,
      maxPerHour,
      daysOfWeek,
      delayMinutes,
      dailyLimit
    };
    
    let voicedropCampaignId;
    
    try {
      // Create the campaign in VoiceDrop
      voicedropCampaignId = await createVoicedropCampaign({
        name: data.name || `Campaign ${new Date().toISOString()}`,
        script,
        senderPhone: fromPhone,
        settings: campaignSettings,
        contacts, // Not actually used by the function, just for interface compliance
        webhookUrl
      });
    } catch (error) {
      console.error('Error creating VoiceDrop campaign:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Error creating VoiceDrop campaign' }, 
        { status: 500 }
      );
    }
    
    // Create our local campaign object
    const campaign = {
      id: campaignId,
      voicedropCampaignId, // Store the VoiceDrop campaign ID for future calls
      name: data.name || `Campaign ${new Date().toISOString()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      script,
      delayMinutes,
      dailyLimit,
      fromPhone,
      startTime,
      endTime,
      timezone,
      maxPerHour,
      daysOfWeek,
      contacts: contacts.map((contact: any) => ({
        ...contact,
        status: 'pending',
        retries: 0
      })),
      progress: {
        total: contacts.length,
        sent: 0,
        pending: contacts.length,
        failed: 0
      },
      webhookUrl
    };
    
    // Add prospects to the VoiceDrop campaign
    const prospectPromises = contacts.map(async (contact: any) => {
      try {
        const result = await addProspectToCampaign(voicedropCampaignId, contact);
        return {
          contact,
          success: true,
          result
        };
      } catch (error) {
        console.error(`Error adding prospect ${contact.id} to campaign:`, error);
        return {
          contact,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    // Wait for all prospects to be added
    const prospectResults = await Promise.allSettled(prospectPromises);
    
    // Count successes and failures
    const successfulProspects = prospectResults.filter(
      r => r.status === 'fulfilled' && (r.value as any).success
    ).length;
    
    const failedProspects = prospectResults.filter(
      r => r.status === 'rejected' || !(r.status === 'fulfilled' && (r.value as any).success)
    ).length;
    
    // Update campaign progress
    campaign.progress.sent = successfulProspects;
    campaign.progress.failed = failedProspects;
    campaign.progress.pending = campaign.progress.total - successfulProspects - failedProspects;
    
    // Store the campaign in our memory/database
    campaigns.push(campaign);
    
    // Collect any errors
    const errors = prospectResults
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as any).success))
      .map(r => {
        if (r.status === 'rejected') {
          return r.reason;
        } else {
          return (r.value as any).error;
        }
      });
    
    // Return the campaign data
    return NextResponse.json({
      campaign,
      voicedropCampaignId,
      errors: errors.length > 0 ? errors : undefined
    });
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
    
    // Ensure the campaign has a VoiceDrop ID
    if (!campaign.voicedropCampaignId) {
      return NextResponse.json({ 
        error: 'Campaign is not linked to VoiceDrop. This may be a legacy campaign.' 
      }, { status: 400 });
    }
    
    // Handle different actions
    switch(action) {
      case 'pause':
        campaign.status = 'paused';
        // Update status in VoiceDrop
        await updateCampaignStatus(campaign.voicedropCampaignId, 'paused');
        break;
        
      case 'resume':
        campaign.status = 'active';
        // Update status in VoiceDrop
        await updateCampaignStatus(campaign.voicedropCampaignId, 'active');
        break;
        
      case 'cancel':
        campaign.status = 'cancelled';
        // Mark contacts as cancelled
        campaign.contacts.forEach((contact: any) => {
          if (contact.status === 'pending') {
            contact.status = 'cancelled';
          }
        });
        campaign.progress.pending = 0;
        // Update status in VoiceDrop (archive)
        await updateCampaignStatus(campaign.voicedropCampaignId, 'archived');
        break;
        
      case 'updateDelay':
        if (delayMinutes) {
          campaign.delayMinutes = delayMinutes;
          // Note: This doesn't update the VoiceDrop campaign as there's no endpoint for it
          // You would need to recreate the campaign to update this
        }
        break;
        
      case 'updateLimit':
        if (dailyLimit) {
          campaign.dailyLimit = dailyLimit;
          // Note: This doesn't update the VoiceDrop campaign as there's no endpoint for it
        }
        break;
        
      case 'refreshStats':
        // Get the latest stats from VoiceDrop
        try {
          const stats = await getCampaignStatistics(campaign.voicedropCampaignId);
          
          // Update our campaign progress with the latest stats
          campaign.progress = stats.stats;
          
          // Update contact statuses based on the detailed results
          if (stats.details && stats.details.length > 0) {
            stats.details.forEach((detail: any) => {
              // Find the contact by phone number
              const contact = campaign.contacts.find((c: any) => {
                // Normalize phone number for comparison
                const contactPhone = c.phone.replace(/\D/g, '');
                const detailPhone = detail.phone?.replace(/\D/g, '') || '';
                return contactPhone === detailPhone;
              });
              
              if (contact) {
                // Update contact status
                if (detail.status === 'delivered' || detail.status === 'completed') {
                  contact.status = 'delivered';
                } else if (detail.status === 'failed' || detail.status === 'error') {
                  contact.status = 'failed';
                }
                
                // Update other details
                contact.sentAt = detail.sent_at || contact.sentAt;
                contact.deliveredAt = detail.delivered_at;
                
                // Handle callback status
                if (detail.callback === 'true' || detail.status === 'callback') {
                  contact.status = 'callback_received';
                  contact.callbackAt = detail.callback_at || new Date().toISOString();
                }
              }
            });
          }
        } catch (error) {
          console.error('Error refreshing campaign stats:', error);
          return NextResponse.json({ 
            error: 'Failed to refresh campaign statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
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
    
    // Find the campaign
    const campaign = campaigns.find(c => c.id === id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // If the campaign has a VoiceDrop ID, archive it in VoiceDrop
    if (campaign.voicedropCampaignId) {
      try {
        await updateCampaignStatus(campaign.voicedropCampaignId, 'archived');
      } catch (error) {
        console.error('Error archiving VoiceDrop campaign:', error);
        // Continue with deletion even if VoiceDrop update fails
      }
    }
    
    // Remove the campaign from our store
    campaigns = campaigns.filter(c => c.id !== id);
    
    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 