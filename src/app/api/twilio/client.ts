import Twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error('TWILIO_ACCOUNT_SID is not set');
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('TWILIO_AUTH_TOKEN is not set');
}

export const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); 