import axios from 'axios';
import {
  createCampaign as createVoicedropCampaign,
  addProspectToCampaign,
  CampaignSettings
} from './voicedropCampaignService';

/**
 * Utility to migrate an existing campaign to the VoiceDrop Campaign API
 * This is used to move legacy campaigns to the new system
 */
export async function migrateCampaign(campaign: any, webhookUrl: string): Promise<string | null> {
  try {
    console.log(`Starting migration for campaign: ${campaign.id} - ${campaign.name}`);
    
    // Validate the campaign has the necessary data
    if (!campaign.script) {
      console.error('Campaign is missing a script');
      return null;
    }
    
    if (!campaign.contacts || !Array.isArray(campaign.contacts) || campaign.contacts.length === 0) {
      console.error('Campaign has no contacts');
      return null;
    }
    
    // Use campaign settings or defaults
    const settings: CampaignSettings = {
      startTime: campaign.startTime || "10:00 AM",
      endTime: campaign.endTime || "4:00 PM",
      timezone: campaign.timezone || "EST (New York)",
      maxPerHour: campaign.maxPerHour || 100,
      daysOfWeek: campaign.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      delayMinutes: campaign.delayMinutes || 5,
      dailyLimit: campaign.dailyLimit || 50
    };
    
    // Create the campaign in VoiceDrop
    console.log('Creating campaign in VoiceDrop...');
    const voicedropCampaignId = await createVoicedropCampaign({
      name: `${campaign.name} (Migrated)`,
      script: campaign.script,
      senderPhone: campaign.fromPhone || '+17867517909', // Default or use campaign's number
      settings,
      contacts: campaign.contacts,
      webhookUrl
    });
    
    console.log(`VoiceDrop campaign created with ID: ${voicedropCampaignId}`);
    
    // Add all contacts as prospects to the VoiceDrop campaign
    console.log(`Adding ${campaign.contacts.length} prospects to VoiceDrop campaign...`);
    
    // Process contacts in batches of 10 for better performance and error handling
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < campaign.contacts.length; i += batchSize) {
      batches.push(campaign.contacts.slice(i, i + batchSize));
    }
    
    // Track results
    let successCount = 0;
    let failureCount = 0;
    
    // Process batches sequentially to avoid overwhelming the API
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i+1}/${batches.length}...`);
      
      // Process each contact in the batch concurrently
      const results = await Promise.allSettled(
        batch.map(async (contact: any) => {
          // Skip contacts that have already been processed
          if (contact.status === 'delivered' || contact.status === 'failed') {
            console.log(`Skipping already processed contact: ${contact.id}`);
            return { success: true, skipped: true };
          }
          
          try {
            await addProspectToCampaign(voicedropCampaignId, contact);
            return { success: true };
          } catch (error) {
            console.error(`Error adding prospect ${contact.id}:`, error);
            return { success: false, error };
          }
        })
      );
      
      // Count successes and failures
      const batchSuccesses = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      const batchFailures = results.length - batchSuccesses;
      
      successCount += batchSuccesses;
      failureCount += batchFailures;
      
      console.log(`Batch ${i+1} complete: ${batchSuccesses} succeeded, ${batchFailures} failed`);
      
      // Sleep between batches to avoid rate limiting
      if (i < batches.length - 1) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Migration complete for campaign ${campaign.id}`);
    console.log(`Total: ${campaign.contacts.length}, Succeeded: ${successCount}, Failed: ${failureCount}`);
    
    // Update the campaign with the VoiceDrop ID
    campaign.voicedropCampaignId = voicedropCampaignId;
    
    return voicedropCampaignId;
  } catch (error) {
    console.error('Error migrating campaign:', error);
    return null;
  }
}

/**
 * Utility to migrate all existing campaigns to the VoiceDrop Campaign API
 */
export async function migrateAllCampaigns(campaigns: any[], baseUrl: string): Promise<{ success: number, failed: number }> {
  const webhookUrl = `${baseUrl}/api/webhook/voicemail`;
  let successCount = 0;
  let failureCount = 0;
  
  console.log(`Starting migration of ${campaigns.length} campaigns`);
  
  for (const campaign of campaigns) {
    // Skip campaigns that already have a VoiceDrop ID
    if (campaign.voicedropCampaignId) {
      console.log(`Campaign ${campaign.id} already has a VoiceDrop ID, skipping`);
      continue;
    }
    
    // Skip completed or cancelled campaigns
    if (campaign.status === 'completed' || campaign.status === 'cancelled') {
      console.log(`Campaign ${campaign.id} is ${campaign.status}, skipping`);
      continue;
    }
    
    try {
      const voicedropCampaignId = await migrateCampaign(campaign, webhookUrl);
      
      if (voicedropCampaignId) {
        // Update the campaign with the VoiceDrop ID
        campaign.voicedropCampaignId = voicedropCampaignId;
        successCount++;
      } else {
        failureCount++;
      }
      
      // Wait 5 seconds between campaigns to avoid API rate limits
      console.log('Waiting 5 seconds before next campaign...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error migrating campaign ${campaign.id}:`, error);
      failureCount++;
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Failed: ${failureCount}`);
  
  return { success: successCount, failed: failureCount };
}

/**
 * API route handler for campaign migration
 */
export async function handleMigrationRequest(request: Request): Promise<Response> {
  try {
    const { campaigns } = await request.json();
    const baseUrl = new URL(request.url).origin;
    
    if (!campaigns || !Array.isArray(campaigns)) {
      return new Response(JSON.stringify({ error: 'Campaigns array is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await migrateAllCampaigns(campaigns, baseUrl);
    
    return new Response(JSON.stringify({
      success: true,
      migrated: result.success,
      failed: result.failed
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in migration request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 