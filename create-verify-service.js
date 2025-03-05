
const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

async function createVerifyService() {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const service = await client.verify.v2.services.create({
      friendlyName: 'Default Verification Service'
    });
    console.log('Verify Service created successfully!');
    console.log('Service SID:', service.sid);
    return service.sid;
  } catch (error) {
    console.error('Error creating Verify Service:', error);
  }
}

createVerifyService(); 