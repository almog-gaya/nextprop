import twilio from 'twilio';

export const accountSid = process.env.TWILIO_ACCOUNT_SID;
export const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Missing Twilio credentials');
}

const client = twilio(accountSid, authToken);

export const getTwilioClient = (subaccountSid?: string) => {
  if (subaccountSid) {
    return twilio(accountSid, authToken, { accountSid: subaccountSid });
  }
  return client;
}; 