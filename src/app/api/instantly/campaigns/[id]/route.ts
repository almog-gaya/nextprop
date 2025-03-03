import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, updateCampaign } from '@/lib/instantlyApi';
import { getAuthToken } from '@/lib/authUtils';

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

// Interface for API responses that might contain a campaign
interface CampaignResponse {
  id?: string;
  campaign?: InstantlyCampaign;
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
    console.error('Error extracting user email from token:', error);
    return null;
  }
}

// Helper function to check if a campaign belongs to a user
function isCampaignForUser(campaign: InstantlyCampaign, userEmail: string): boolean {
  if (!userEmail) return true; // If no user email, show all campaigns (fallback)
  
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const userEmail = await getUserEmail(request);
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    const response = await getCampaign(campaignId);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }
    
    // Transform the response to match our application's expected format
    let rawCampaign: InstantlyCampaign | null = null;
    
    // The API may return data directly or nested in some structure
    if (response.data) {
      const apiResponse = response.data as CampaignResponse;
      
      if (apiResponse.id) {
        // Direct campaign object
        rawCampaign = apiResponse as InstantlyCampaign;
      } else if (apiResponse.campaign) {
        // Nested in "campaign" property
        rawCampaign = apiResponse.campaign;
      } else {
        console.error('Unexpected campaign detail response format:', response.data);
      }
    }
    
    if (!rawCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Check if this campaign belongs to the current user
    if (userEmail && !isCampaignForUser(rawCampaign, userEmail)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this campaign' },
        { status: 403 }
      );
    }
    
    const campaign = {
      id: rawCampaign.id || '',
      name: rawCampaign.name || '',
      status: mapCampaignStatus(rawCampaign.status || 0),
      created_at: rawCampaign.timestamp_created || '',
      updated_at: rawCampaign.timestamp_updated || '',
      daily_limit: rawCampaign.daily_limit || 0,
      // Other properties as needed
      leads_count: 0,
      emails_sent_count: 0,
      opens_count: 0,
      replies_count: 0
    };
    
    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error in GET instantly/campaigns/[id]:', error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const userEmail = await getUserEmail(request);
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // First get the campaign to check if user has permission to update it
    const campaignResponse = await getCampaign(campaignId);
    
    if (campaignResponse.error) {
      return NextResponse.json(
        { error: campaignResponse.error },
        { status: campaignResponse.status || 500 }
      );
    }
    
    let rawExistingCampaign: InstantlyCampaign | null = null;
    
    // Extract the campaign from the response
    if (campaignResponse.data) {
      const apiResponse = campaignResponse.data as CampaignResponse;
      
      if (apiResponse.id) {
        rawExistingCampaign = apiResponse as InstantlyCampaign;
      } else if (apiResponse.campaign) {
        rawExistingCampaign = apiResponse.campaign;
      }
    }
    
    // Check if the campaign exists and belongs to the user
    if (!rawExistingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Check if this campaign belongs to the current user
    if (userEmail && !isCampaignForUser(rawExistingCampaign, userEmail)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this campaign' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Prepare update data
    const updateData = { ...body };
    
    const response = await updateCampaign(campaignId, updateData);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }
    
    // Transform the response to match our application's expected format
    let rawCampaign: InstantlyCampaign | null = null;
    
    // The API may return data directly or nested in some structure
    if (response.data) {
      const apiResponse = response.data as CampaignResponse;
      
      if (apiResponse.id) {
        // Direct campaign object
        rawCampaign = apiResponse as InstantlyCampaign;
      } else if (apiResponse.campaign) {
        // Nested in "campaign" property
        rawCampaign = apiResponse.campaign;
      } else {
        console.error('Unexpected campaign update response format:', response.data);
      }
    }
    
    if (!rawCampaign) {
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }
    
    const campaign = {
      id: rawCampaign.id || '',
      name: rawCampaign.name || '',
      status: mapCampaignStatus(rawCampaign.status || 0),
      created_at: rawCampaign.timestamp_created || '',
      updated_at: rawCampaign.timestamp_updated || '',
      daily_limit: rawCampaign.daily_limit || 0,
      // Other properties as needed
      leads_count: 0,
      emails_sent_count: 0,
      opens_count: 0,
      replies_count: 0
    };
    
    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error in PATCH instantly/campaigns/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 