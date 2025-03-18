import { NextResponse } from 'next/server';
import axios from 'axios';

// Array to store call webhook responses for demo purposes
// In production, use a database
export const callWebhookResponses: any[] = [];

// Find campaigns in memory
let campaigns: any[] = [];
try {
  const campaignsModule = require('../../voicemail/campaigns/route');
  campaigns = campaignsModule.campaigns;
} catch (error) {
  console.error('Could not access campaigns:', error);
  campaigns = [];
}

export async function POST(request: Request) {
  try {
    // Parse the incoming webhook data
    const webhookData = await request.json();
    
    console.log('Received call webhook:', webhookData);
    
    // Store the webhook data
    callWebhookResponses.unshift({
      timestamp: new Date().toISOString(),
      data: webhookData
    });
    
    // Keep only the latest 50 responses
    if (callWebhookResponses.length > 50) {
      callWebhookResponses.length = 50;
    }
    
    // Process the call data
    if (webhookData.caller_number || webhookData.from_number) {
      const callerNumber = webhookData.caller_number || webhookData.from_number;
      
      // Normalize the phone number (remove spaces, dashes, etc.)
      const normalizedNumber = callerNumber.replace(/\D/g, '');
      
      // Find the contact in any campaign by phone number
      let foundContact = null;
      let foundCampaign = null;
      
      for (const campaign of campaigns) {
        const contact = campaign.contacts.find((c: any) => {
          // Normalize the contact's phone number for comparison
          const contactNumber = c.phone.replace(/\D/g, '');
          return contactNumber.includes(normalizedNumber) || normalizedNumber.includes(contactNumber);
        });
        
        if (contact) {
          foundContact = contact;
          foundCampaign = campaign;
          break;
        }
      }
      
      if (foundContact) {
        console.log(`Detected callback from contact ${foundContact.id}`);
        
        // Update the contact status
        foundContact.status = 'callback_received';
        foundContact.callbackAt = new Date().toISOString();
        
        // Trigger voicemail webhook to update opportunity stage
        try {
          // Use the webhook URL from the campaign or a default
          const webhookUrl = foundCampaign?.webhookUrl || `${new URL(request.url).origin}/api/webhook/voicemail`;
          
          await axios.post(webhookUrl, {
            callback: true,
            phone: foundContact.phone,
            metadata: {
              contactId: foundContact.id,
              campaignId: foundCampaign?.id
            }
          });
        } catch (error) {
          console.error('Error triggering voicemail webhook for callback:', error);
        }
      }
    }
    
    // Respond with success
    return NextResponse.json({ success: true, message: 'Call webhook received successfully' });
  } catch (error) {
    console.error('Error processing call webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing call webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve webhook responses
export async function GET() {
  return NextResponse.json({ responses: callWebhookResponses });
} 