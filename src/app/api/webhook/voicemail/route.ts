import { NextResponse } from 'next/server';

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
          contact.status = webhookData.status === 'completed' ? 'delivered' : 'failed';
          contact.result = webhookData;
          contact.completedAt = new Date().toISOString();
          
          // Update campaign progress
          if (webhookData.status === 'completed') {
            campaign.progress.sent++;
          } else {
            campaign.progress.failed++;
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