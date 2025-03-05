 
 
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
  'contacts.readonly', 
].join(' ');

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