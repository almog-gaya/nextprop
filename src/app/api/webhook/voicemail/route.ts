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
    
    // Process the webhook data for campaign updates
    if (webhookData.metadata && webhookData.metadata.campaignId) {
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
          
          // Check if we should send the next voicemail
          if (campaign.status === 'active') {
            // Find the next pending contact
            const nextContact = campaign.contacts.find((c: any) => c.status === 'pending');
            
            if (nextContact) {
              // Check if we're within the daily limit
              const sentToday = campaign.contacts.filter((c: any) => {
                if (c.sentAt) {
                  const sentDate = new Date(c.sentAt);
                  const today = new Date();
                  return sentDate.getDate() === today.getDate() &&
                         sentDate.getMonth() === today.getMonth() &&
                         sentDate.getFullYear() === today.getFullYear();
                }
                return false;
              }).length;
              
              if (sentToday < campaign.dailyLimit) {
                // We'll schedule it according to the delay - in a real app you'd use a proper job queue
                nextContact.status = 'scheduled';
                
                // In a real implementation, you would set up a cron job or queue
                // For this demo, we're just logging it
                console.log(`Should schedule next contact ${nextContact.id} in ${campaign.delayMinutes} minutes`);
              }
            } else {
              // No more pending contacts, campaign is complete
              campaign.status = 'completed';
            }
          }
        }
      }
    } else if (webhookData.callback && webhookData.phone) {
      // This is a callback event - someone called back after receiving a voicemail
      console.log('Callback received from', webhookData.phone);
      
      // Find the contact by phone number
      let foundContact = null;
      let foundCampaign = null;
      
      for (const campaign of campaigns) {
        const contact = campaign.contacts.find((c: any) => c.phone === webhookData.phone);
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
        
        console.log(`Contact ${foundContact.id} called back, updating status and moving opportunity`);
      }
    }
    
    // Respond to VoiceDrop with a success message
    return NextResponse.json({ success: true, message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve webhook responses
export async function GET() {
  return NextResponse.json({ responses: webhookResponses });
} 