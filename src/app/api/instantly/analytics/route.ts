import { NextRequest, NextResponse } from 'next/server';
import { getCampaignAnalytics, getCampaigns } from '@/lib/instantlyApi';
import { getAuthToken, getTemporaryDemoEmail } from '@/lib/authUtils';

// Interface for analytics response data
interface InstantlyAnalytics {
  campaign_id?: string;
  campaign_name?: string;
  leads_count?: number;
  emails_sent_count?: number;
  opens_count?: number;
  opens_rate?: number;
  clicks_count?: number;
  clicks_rate?: number;
  replies_count?: number;
  replies_rate?: number;
  bounces_count?: number;
  bounces_rate?: number;
  [key: string]: any;
}

// Interface for API responses
interface AnalyticsResponse {
  items?: InstantlyAnalytics[];
  analytics?: InstantlyAnalytics | InstantlyAnalytics[];
  [key: string]: any;
}

// Interface for Campaign type
interface InstantlyCampaign {
  id: string;
  name: string;
  status: number;
  [key: string]: any;
}

// Helper function to extract user email from auth token
async function getUserEmail(request: NextRequest): Promise<string | null> {
  const token = getAuthToken(request);
  // Only log token info once, not the full token for security
  console.log('Token exists:', !!token);
  if (!token) return null;
  
  try {
    // First, check if this might be a session token rather than a JWT
    try {
      // For session tokens, they might be encoded as JSON directly
      const sessionData = JSON.parse(token);
      if (sessionData && sessionData.email) {
        return sessionData.email;
      }
    } catch (e) {
      // Not a JSON token, continue with JWT checks
    }
    
    // Try JWT format
    const parts = token.split('.');
    
    if (parts.length === 3) {
      // Standard JWT format
      try {
        // Base64 decoding can fail if the token is not properly formatted
        // Use a more robust base64 decoding that handles URL-safe base64
        const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = atob(base64Payload);
        
        const payload = JSON.parse(decodedPayload);
        
        // Check common fields where email might be stored
        const email = payload.email || payload.sub || payload.preferred_username || null;
        return email;
      } catch (decodeError) {
        console.error('Error decoding JWT payload');
      }
    } 
    
    // If we get here, try a simple token extraction approach
    // Some auth systems store the email directly in the token or use a simple encoding
    
    // Method 1: Check if token contains an email pattern
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = token.match(emailPattern);
    if (emailMatch && emailMatch[0]) {
      return emailMatch[0];
    }
    
    // Method 2: Check if token might be base64 encoded directly
    try {
      const directDecoded = atob(token);
      const directDecodedEmailMatch = directDecoded.match(emailPattern);
      if (directDecodedEmailMatch && directDecodedEmailMatch[0]) {
        return directDecodedEmailMatch[0];
      }
    } catch (e) {
      // Not base64 encoded
    }
    
    // If all extraction methods fail, return null
    console.error('Failed to extract email from token');
    return null;
  } catch (error) {
    console.error('Error processing token');
    return null;
  }
}

// Helper function to check if a campaign belongs to a user
function isCampaignForUser(campaignName: string, userEmail: string): boolean {
  if (!userEmail) return false; // If no user email, don't show any campaigns
  
  // Check for user identifier in the campaign name
  // Format: [user@example.com] Campaign Name
  return campaignName.includes(`[${userEmail}]`);
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserEmail(request);
    
    // Use the fallback demo email when token extraction fails
    // This is a temporary solution until the token issue is fixed
    const effectiveEmail = userEmail || getTemporaryDemoEmail();
    
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    // Call the real API
    const response = await getCampaignAnalytics(campaignId || undefined);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      );
    }

    try {
      // Process the response data
      let analyticsData = response.data || [];
      
      // If user email is available and no specific campaign ID was provided,
      // filter analytics to only include campaigns that belong to this user
      if (effectiveEmail && !campaignId && Array.isArray(analyticsData)) {
        analyticsData = analyticsData.filter((analytics) => {
          if (!analytics.campaign_name) return false;
          return isCampaignForUser(analytics.campaign_name, effectiveEmail);
        });
      }
      
      return NextResponse.json({ analytics: analyticsData });
    } catch (error: any) {
      console.error('Error processing analytics data:', error.message);
      return NextResponse.json(
        { error: 'Error processing analytics data' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in GET instantly/analytics:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 