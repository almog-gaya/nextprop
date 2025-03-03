import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, createCampaign } from '@/lib/instantlyApi';
import { getAuthToken, getTemporaryDemoEmail } from '@/lib/authUtils';

// Interface for Campaign type
interface InstantlyCampaign {
  id: string;
  name: string;
  status: number;
  timestamp_created?: string;
  timestamp_updated?: string;
  daily_limit?: number;
  [key: string]: any; // Allow for additional properties
}

// Interface for Instantly API response
interface InstantlyResponse {
  items?: InstantlyCampaign[];
  next_starting_after?: string;
  [key: string]: any;
}

// Helper function to extract user email from auth token
async function getUserEmail(request: NextRequest): Promise<string | null> {
  const token = getAuthToken(request);
  if (!token) return null;
  
  try {
    // Parse the JWT token to get user info (assuming JWT format)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.email || null;
    }
    return null;
  } catch (error) {
    // Silent error - just return null
    return null;
  }
}

// Helper function to check if a campaign belongs to a user
function isCampaignForUser(campaign: InstantlyCampaign, userEmail: string): boolean {
  if (!userEmail) return false; // If no user email, don't show any campaigns (stricter security)
  
  // Check for user identifier in the campaign name
  // Format: [user@example.com] Campaign Name
  if (campaign.name.includes(`[${userEmail}]`)) {
    return true;
  }
  
  // Alternative: check for email in campaign tags if available
  if (campaign.tags && Array.isArray(campaign.tags) && campaign.tags.includes(userEmail)) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserEmail(request);
    
    // Use the fallback demo email when token extraction fails
    // This is a temporary solution until the token issue is fixed
    const effectiveEmail = userEmail || getTemporaryDemoEmail();
    
    // Temporarily disabled this check to use the fallback email
    /*
    // If no user email is found, return an empty array for security
    if (!userEmail) {
      console.log('No user email found, returning empty campaigns list');
      return NextResponse.json({ campaigns: [] });
    }
    */
    
    const response = await getCampaigns();
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }

    // Handle the Instantly API response which has campaigns inside an 'items' array
    const campaigns = [];

    try {
      // Check if the response has an 'items' property that contains the campaigns
      const apiResponse = response.data as InstantlyResponse;
      
      if (apiResponse && Array.isArray(apiResponse.items)) {
        // Transform the response data to match our application's expected format
        for (const campaign of apiResponse.items) {
          // Only include campaigns that belong to the current user
          const belongs = isCampaignForUser(campaign, effectiveEmail);
          
          if (belongs) {
            campaigns.push({
              id: campaign.id || '',
              name: campaign.name || '',
              status: mapCampaignStatus(campaign.status),
              created_at: campaign.timestamp_created || '',
              updated_at: campaign.timestamp_updated || '',
              daily_limit: campaign.daily_limit || 0,
              leads_count: 0, // This info might not be directly available
              emails_sent_count: 0, // This info might not be directly available
              opens_count: 0, // This info might not be directly available
              replies_count: 0 // This info might not be directly available
            });
          }
        }
      } else if (Array.isArray(apiResponse)) {
        // In case the API changes and returns an array directly
        for (const campaign of apiResponse as unknown as InstantlyCampaign[]) {
          // Only include campaigns that belong to the current user
          if (isCampaignForUser(campaign, effectiveEmail)) {
            campaigns.push({
              id: campaign.id || '',
              name: campaign.name || '',
              status: mapCampaignStatus(campaign.status),
              created_at: campaign.timestamp_created || '',
              updated_at: campaign.timestamp_updated || '',
              daily_limit: campaign.daily_limit || 0,
              leads_count: 0,
              emails_sent_count: 0,
              opens_count: 0,
              replies_count: 0
            });
          }
        }
      } else {
        console.error('Unexpected API response format:', response.data);
      }
    } catch (err) {
      console.error('Error processing API response:', err);
    }
    
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error in GET instantly/campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to map Instantly.ai status codes to our application's status strings
function mapCampaignStatus(statusCode: number): string {
  // According to the API response, status appears to be numeric
  switch (statusCode) {
    case 1:
      return 'active';
    case 2:
      return 'paused';
    case 3:
      return 'completed';
    case 0:
      return 'draft';
    default:
      return 'unknown';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userEmail = await getUserEmail(request);
    
    // Use the fallback demo email when token extraction fails
    // This is a temporary solution until the token issue is fixed
    const effectiveEmail = userEmail || getTemporaryDemoEmail();
    console.log('Using email for campaign creation:', effectiveEmail);
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }
    
    // Add user email to campaign name if available
    let campaignName = body.name;
    campaignName = `[${effectiveEmail}] ${campaignName}`;
    
    // Create campaign
    const campaignData = {
      name: campaignName,
      email_gap: body.emailGap || 10, // Default to 10 minutes between emails
      email_list: body.emailList || [],
      sequences: body.sequences || [{
        steps: [{
          type: 'email',
          delay: 0,
          variants: [{
            subject: body.subject || 'New Campaign',
            body: body.body || 'New campaign created from NextProp app'
          }]
        }]
      }],
      daily_limit: body.dailyLimit || 100,
      stop_on_reply: body.stopOnReply ?? true,
      random_wait_max: body.randomWaitMax || 1,
      prioritize_new_leads: body.prioritizeNewLeads ?? true
    };
    
    const response = await createCampaign(campaignData);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }
    
    // Format the response to match our application's expected format
    const rawCampaign = response.data as InstantlyCampaign;
    const campaign = {
      id: rawCampaign?.id || '',
      name: rawCampaign?.name || '',
      status: mapCampaignStatus(rawCampaign?.status || 0),
      created_at: rawCampaign?.timestamp_created || new Date().toISOString(),
      updated_at: rawCampaign?.timestamp_updated || new Date().toISOString(),
      daily_limit: rawCampaign?.daily_limit || campaignData.daily_limit,
      leads_count: 0,
      emails_sent_count: 0,
      opens_count: 0,
      replies_count: 0
    };
    
    return NextResponse.json({
      status: 'success',
      campaign
    });
  } catch (error: any) {
    console.error('Error in POST instantly/campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating the campaign' },
      { status: 500 }
    );
  }
} 