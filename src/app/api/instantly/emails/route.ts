import { NextRequest, NextResponse } from 'next/server';
import { getEmails, getCampaign } from '@/lib/instantlyApi';
import { getAuthToken } from '@/lib/authUtils';

// Interface for Campaign type
interface InstantlyCampaign {
  id?: string;
  name?: string;
  status?: number;
  tags?: string[];
  [key: string]: any; // Allow for additional properties
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
async function isCampaignForUser(campaignId: string, userEmail: string): Promise<boolean> {
  if (!userEmail) return false; // If no user email, don't show any campaigns (stricter security)
  
  try {
    // Get campaign details
    const response = await getCampaign(campaignId);
    if (response.error || !response.data) return false;
    
    const campaign = response.data as InstantlyCampaign;
    
    // Check for user identifier in the campaign name
    // Format: [user@example.com] Campaign Name
    if (campaign.name && campaign.name.includes(`[${userEmail}]`)) {
      return true;
    }
    
    // Alternative: check for email in campaign tags if available
    if (campaign.tags && Array.isArray(campaign.tags) && campaign.tags.includes(userEmail)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking campaign ownership:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;
    const startingAfterTimestamp = searchParams.get('startingAfterTimestamp') || undefined;
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user has access to this campaign
    const userEmail = await getUserEmail(request);
    console.log('Emails route - User email from token:', userEmail);
    
    // If no user email is found, return error for security
    if (!userEmail) {
      console.log('No user email found, access denied');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!(await isCampaignForUser(campaignId, userEmail))) {
      return NextResponse.json(
        { error: 'You do not have access to this campaign' },
        { status: 403 }
      );
    }
    
    const response = await getEmails(campaignId, limit, startingAfterTimestamp);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json({ emails: response.data });
  } catch (error: any) {
    console.error('Error in GET instantly/emails:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 