 
 
export async function exchangeCodeForTokens(code: string) {
  try {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to exchange code for tokens');
    }

    return response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}

// Add a new function to check auth status
export const SCOPES = [
  "calendars.readonly",
  "conversations.readonly",
  "conversations.write",
  "contacts.readonly",
  "contacts.write",
  "locations.readonly",
  "locations.write",
  "opportunities.readonly",
  "opportunities.write",
  "businesses.readonly",
  "businesses.write",
  "companies.readonly",
  "calendars.write",
  "calendars/events.readonly",
  "calendars/events.write",
  "calendars/groups.readonly",
  "calendars/groups.write",
  "calendars/resources.readonly",
  "calendars/resources.write",
  "campaigns.readonly",
  "conversations/reports.readonly",
  "conversations/message.write",
  "conversations/message.readonly",
  "conversations/livechat.write",
  "objects/schema.readonly",
  "objects/record.readonly",
  "objects/schema.write",
  "objects/record.write",
  "associations.readonly",
  "associations.write",
  "associations/relation.readonly",
  "associations/relation.write",
  "forms.write",
  "locations/customValues.readonly",
  "locations/customValues.write",
  "locations/customFields.readonly",
  "locations/tasks.readonly",
  "locations/tasks.write",
  "locations/customFields.write",
  "locations/tags.readonly",
  "locations/tags.write",
  "medias.readonly",
  "locations/templates.readonly",
  "medias.write",
  "funnels/page.readonly",
  "funnels/redirect.readonly",
  "funnels/funnel.readonly",
  "funnels/pagecount.readonly",
  "funnels/redirect.write",
  "payments/orders.readonly",
  "payments/orders.write",
  "payments/integration.write",
  "payments/transactions.readonly",
  "payments/integration.readonly",
  "payments/subscriptions.readonly",
  "payments/custom-provider.readonly",
  "products.readonly",
  "payments/custom-provider.write",
  "products.write",
  "products/prices.write",
  "products/prices.readonly",
  "products/collection.readonly",
  "products/collection.write",
  "users.readonly",
  "users.write",
  "workflows.readonly",
  "emails/builder.write",
  "emails/builder.readonly"
].join(" ");

// GHL_CLIENT_ID="67bc8f8b36855ce268c6dff2-m7jaua8i"
// GHL_CLIENT_SECRET="8f6711c5-9eb3-46b2-a0ae-dafb056cab22"

/**
 * Demo:
 clientId: 67c7e02f74be2556d96030df-m7vh9hwi
 sec: f4255b9f-27ea-4a16-8012-91ccacf9196a
 */
export const GHL_AUTH_CONFIG = {
  clientId: '67c7e02f74be2556d96030df-m7vh9hwi',
  clientSecret: 'f4255b9f-27ea-4a16-8012-91ccacf9196a',
  redirectUri: 'http://localhost:3000/api/auth/callback',
  baseUrl: 'https://marketplace.gohighlevel.com',
  tokenUrl: 'https://services.leadconnectorhq.com/oauth/token'
};

export function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: GHL_AUTH_CONFIG.redirectUri,
    client_id: GHL_AUTH_CONFIG.clientId,
    scope: SCOPES
  });

  return `${GHL_AUTH_CONFIG.baseUrl}/oauth/chooselocation?${params.toString()}`;
}

export function checkAuthStatus() {
  if (typeof window === 'undefined') return { isAuthenticated: false };
  
  const cookies = document.cookie.split(';');
  const token = cookies.find(c => c.trim().startsWith('ghl_access_token='));
  const locationId = cookies.find(c => c.trim().startsWith('ghl_location_id='));
  
  return {
    isAuthenticated: !!token,
    hasLocation: !!locationId,
    token: token ? token.split('=')[1] : null,
    locationId: locationId ? locationId.split('=')[1] : null
  };
}