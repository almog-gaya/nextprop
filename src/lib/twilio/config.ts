import twilio from 'twilio';

// Get credentials from environment variables
export const accountSid = process.env.TWILIO_ACCOUNT_SID;
export const authToken = process.env.TWILIO_AUTH_TOKEN;

// Validate credentials
if (!accountSid || !authToken) {
  throw new Error('Missing Twilio credentials. Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your environment variables.');
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export const getTwilioClient = () => {
  return client;
};

export const getTwilioClientBySid = (sid: string) => {
  if (!sid) {
    throw new Error('Missing Twilio SID');
  }
  return twilio(accountSid, authToken, { accountSid: sid });
};

export async function test() {
  try {
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