import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

// Store webhook responses for demonstration purposes
// In a production app, this would be in a database
export const webhookResponses: any[] = [];

// Find campaigns in memory (in production, get these from a database)
// This references the campaigns variable from the campaigns API route
// In production, use a proper database query
let campaigns: any[] = [];
try {
  // This is a hack for development - in production use a database
  // We're trying to access the campaigns variable from the other module
  const campaignsModule = require('../../voicemail/campaigns/route');
  campaigns = campaignsModule.campaigns;
} catch (error) {
  console.error('Could not access campaigns:', error);
  // Initialize empty array if we can't access the module
  campaigns = [];
}

// Function to get the user's GHL API token from cookies
async function getGhlToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ghl_access_token');
  const locationId = cookieStore.get('ghl_location_id');
  
  return {
    token: token?.value,
    locationId: locationId?.value
  };
}

// Function to move an opportunity to a new stage based on voicemail status
async function moveOpportunityStage(contactId: string, voicemailStatus: string) {
  try {
    const { token, locationId } = await getGhlToken();
    
    if (!token || !locationId) {
      console.error('Missing GHL token or locationId');
      return;
    }
    
    // First, find the opportunity associated with this contact
    // In a real implementation, you would query your database
    // Here we're using the GHL API
    const opportunityResponse = await axios.get(
      `https://services.leadconnectorhq.com/locations/${locationId}/opportunities`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          contactId: contactId,
          limit: 1
        }
      }
    );
    
    const opportunities = opportunityResponse.data?.opportunities || [];
    if (opportunities.length === 0) {
      console.log(`No opportunity found for contact ID: ${contactId}`);
      return;
    }
    
    const opportunity = opportunities[0];
    console.log(`Found opportunity: ${opportunity.id} in stage: ${opportunity.pipelineStageId}`);
    
    // Get pipeline stages to find the next stage
    const pipelinesResponse = await axios.get(
      `https://services.leadconnectorhq.com/locations/${locationId}/pipelines/${opportunity.pipelineId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    
    const pipeline = pipelinesResponse.data;
    if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
      console.error('Pipeline or stages not found');
      return;
    }
    
    // Find current stage index
    const currentStageIndex = pipeline.stages.findIndex(
      (stage: any) => stage.id === opportunity.pipelineStageId
    );
    
    if (currentStageIndex === -1) {
      console.error('Current stage not found in pipeline');
      return;
    }
    
    // Determine the target stage based on voicemail status
    let targetStageIndex = currentStageIndex;
    let stageName = '';
    
    switch(voicemailStatus) {
      case 'completed':
      case 'delivered':
        // Move to "Voicemail Received" stage
        stageName = 'Voicemail Received';
        targetStageIndex = currentStageIndex + 1;
        break;
        
      case 'failed':
      case 'undeliverable':
        // Move to "Undeliverable" stage
        stageName = 'Undeliverable';
        targetStageIndex = currentStageIndex + 1;
        break;
        
      case 'callback_received':
        // Move to "Call Back" stage
        stageName = 'Call Back';
        targetStageIndex = currentStageIndex + 2; // Skip ahead 2 stages
        break;
        
      default:
        // Don't move for other statuses
        console.log(`No stage change for status: ${voicemailStatus}`);
        return;
    }
    
    // Ensure target stage exists
    if (targetStageIndex >= pipeline.stages.length) {
      console.log('Cannot move opportunity: already at final stage or no suitable stage found');
      return;
    }
    
    // Find a stage with the appropriate name, or use the next stage
    let targetStage = pipeline.stages[targetStageIndex];
    const namedStage = pipeline.stages.find((stage: any) => 
      stage.name.toLowerCase().includes(stageName.toLowerCase())
    );
    
    if (namedStage) {
      targetStage = namedStage;
    }
    
    // Move the opportunity to the new stage
    await axios.patch(
      `https://services.leadconnectorhq.com/locations/${locationId}/opportunities/${opportunity.id}`,
      {
        pipelineStageId: targetStage.id
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    
    console.log(`Moved opportunity ${opportunity.id} to stage: ${targetStage.name}`);
    return true;
  } catch (error) {
    console.error('Error moving opportunity stage:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Parse the incoming webhook data
    const webhookData = await request.json();
    
    console.log('Received webhook from VoiceDrop:', webhookData);
    
    // Store the webhook data
    webhookResponses.unshift({
      timestamp: new Date().toISOString(),
      data: webhookData
    });
    
    // Keep only the latest 50 responses
    if (webhookResponses.length > 50) {
      webhookResponses.length = 50;
    }
    
    // Handle different webhook formats - campaign API or legacy format
    
    // Campaign API format: contains campaign_id
    if (webhookData.campaign_id) {
      // Find our local campaign by VoiceDrop campaign ID
      const campaign = campaigns.find((c: any) => c.voicedropCampaignId === webhookData.campaign_id);
      
      if (!campaign) {
        console.log(`Campaign not found for VoiceDrop ID: ${webhookData.campaign_id}`);
        return NextResponse.json({ success: false, message: 'Campaign not found' });
      }
      
      // Find the contact by phone number
      const recipientPhone = webhookData.to || webhookData.recipient_phone;
      if (!recipientPhone) {
        console.log('No recipient phone number in webhook data');
        return NextResponse.json({ success: true });
      }
      
      // Normalize phone number for comparison
      const normalizedRecipientPhone = recipientPhone.replace(/\D/g, '');
      
      const contact = campaign.contacts.find((c: any) => {
        const normalizedContactPhone = c.phone.replace(/\D/g, '');
        return normalizedContactPhone.includes(normalizedRecipientPhone) || 
               normalizedRecipientPhone.includes(normalizedContactPhone);
      });
      
      if (!contact) {
        console.log(`Contact not found for phone: ${recipientPhone}`);
        return NextResponse.json({ success: true });
      }
      
      // Update contact status based on webhook data
      const status = webhookData.status || webhookData.event_type;
      
      if (status === 'delivered' || status === 'completed') {
        contact.status = 'delivered';
        contact.deliveredAt = webhookData.timestamp || new Date().toISOString();
        
        // Try to move opportunity
        if (contact.id) {
          moveOpportunityStage(contact.id, 'delivered');
        }
      } else if (status === 'failed' || status === 'error') {
        contact.status = 'failed';
        contact.error = webhookData.reason || webhookData.message || 'Unknown error';
        
        // Try to move opportunity
        if (contact.id) {
          moveOpportunityStage(contact.id, 'failed');
        }
      } else if (status === 'callback' || webhookData.is_callback) {
        contact.status = 'callback_received';
        contact.callbackAt = webhookData.timestamp || new Date().toISOString();
        
        // Try to move opportunity
        if (contact.id) {
          moveOpportunityStage(contact.id, 'callback_received');
        }
      }
      
      // Update campaign progress counts
      updateCampaignProgress(campaign);
      
      return NextResponse.json({ success: true });
    }
    
    // Legacy format: contains metadata with campaignId
    else if (webhookData.metadata && webhookData.metadata.campaignId) {
      const { campaignId, contactId } = webhookData.metadata;
      
      // Find the campaign
      const campaign = campaigns.find((c: any) => c.id === campaignId);
      
      if (campaign) {
        // Find the contact
        const contact = campaign.contacts.find((c: any) => c.id === contactId);
        
        if (contact) {
          // Update contact status
          const status = webhookData.status === 'completed' ? 'delivered' : webhookData.status;
          contact.status = status;
          contact.result = webhookData;
          contact.completedAt = new Date().toISOString();
          
          // Update campaign progress
          if (webhookData.status === 'completed') {
            campaign.progress.sent++;
            
            // Try to move the opportunity to the next stage
            if (contactId) {
              moveOpportunityStage(contactId, 'completed');
            }
          } else if (webhookData.status === 'failed') {
            campaign.progress.failed++;
            
            // Try to move the opportunity to undeliverable stage
            if (contactId) {
              moveOpportunityStage(contactId, 'failed');
            }
          }
          
          campaign.progress.pending = Math.max(0, campaign.progress.pending - 1);
        }
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Callback event from custom format
    else if (webhookData.callback && webhookData.phone) {
      // Find the contact by phone number
      let foundContact = null;
      let foundCampaign = null;
      
      for (const campaign of campaigns) {
        const contact = campaign.contacts.find((c: any) => {
          // Normalize phone numbers for comparison
          const contactPhone = c.phone.replace(/\D/g, '');
          const callbackPhone = webhookData.phone.replace(/\D/g, '');
          return contactPhone.includes(callbackPhone) || callbackPhone.includes(contactPhone);
        });
        
        if (contact) {
          foundContact = contact;
          foundCampaign = campaign;
          break;
        }
      }
      
      if (foundContact && foundContact.id) {
        // Update the contact status
        foundContact.status = 'callback_received';
        foundContact.callbackAt = new Date().toISOString();
        
        // Move the opportunity to the "Call Back" stage
        moveOpportunityStage(foundContact.id, 'callback_received');
        
        // Update campaign progress
        if (foundCampaign) {
          updateCampaignProgress(foundCampaign);
        }
        
        console.log(`Contact ${foundContact.id} called back, updating status and moving opportunity`);
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Unknown format
    return NextResponse.json({ success: true, message: 'Webhook received but format not recognized' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Helper function to update campaign progress counts
function updateCampaignProgress(campaign: any) {
  if (!campaign || !campaign.contacts) return;
  
  // Count contacts by status
  const counts = campaign.contacts.reduce((acc: any, contact: any) => {
    const status = contact.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Update campaign progress
  campaign.progress = {
    total: campaign.contacts.length,
    sent: counts.delivered || 0,
    pending: counts.pending || 0,
    failed: counts.failed || 0,
    callbacks: counts.callback_received || 0
  };
}

// GET endpoint to retrieve webhook responses
export async function GET() {
  return NextResponse.json({ responses: webhookResponses });
} 