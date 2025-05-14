import twilio from 'twilio';

// Get credentials from environment variables
export const accountSid = process.env.TWILIO_ACCOUNT_SID;
export const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize client lazily instead of immediately
let clientInstance: ReturnType<typeof twilio> | null = null;

// Helper function to get or create the Twilio client
export const getTwilioClient = () => {
  if (!clientInstance) {
    // Validate credentials at runtime, not during build
    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials. Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your environment variables.');
    }
    clientInstance = twilio(accountSid, authToken);
  }
  return clientInstance;
};

export const getTwilioClientBySid = (sid: string) => {
  if (!sid) {
    throw new Error('Missing Twilio SID');
  }
  
  // Validate credentials at runtime, not during build
  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials. Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your environment variables.');
  }
  
  return twilio(accountSid, authToken, { accountSid: sid });
};

export async function test() {
  try {
    const client = getTwilioClient();
    const account = await client.api.accounts(accountSid as string).fetch();
    return {
      success: true,
      message: 'Twilio credentials are valid',
      account: account
    };
  } catch (error) {
    console.error('Error testing Twilio credentials:', error);
    return {
      success: false,
      message: 'Invalid Twilio credentials'
    };
  }
}