# Twilio Integration Setup Instructions

This document provides instructions on how to properly set up and configure your Twilio services for our multi-tenant SMS and verification platform.

## 1. Account Setup

1. Visit [Twilio.com](https://www.twilio.com/) and create an account if you don't already have one
2. Once logged in, navigate to the [Twilio Console](https://www.twilio.com/console)
3. Find your Account SID and Auth Token (keep these secure!)

## 2. Purchase a Phone Number

1. In the Twilio Console, navigate to Phone Numbers > Manage > Buy a Number
2. Search for a number with SMS capabilities
3. Purchase the number that suits your needs

## 3. Set Up Environment Variables

Update your `.env.local` file with your Twilio credentials:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**IMPORTANT:** Never commit your `.env.local` file to version control!

## 4. Create a Verify Service

You can create a Verify service through the Twilio Console or programmatically:

### Through the Console:

1. Navigate to Verify > Services
2. Click "Create Verification Service"
3. Give it a friendly name (e.g., "Default Verification Service")
4. Configure other settings as needed
5. Save the service SID and add it to your `.env.local` file:

```
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

### Programmatically:

Using the Twilio SDK in your code:

```javascript
const service = await twilioClient.verify.v2.services.create({
  friendlyName: 'Default Verification Service',
  codeLength: 6
});

console.log('Verify Service SID:', service.sid);
```

## 5. Configure Webhook for Incoming SMS

For the SMS chat application to work properly, you need to configure a webhook for incoming messages:

1. In the Twilio Console, go to Phone Numbers > Manage Numbers
2. Select the phone number you purchased
3. Under "Messaging", set the webhook URL to:
   ```
   https://your-domain.com/api/webhooks/twilio-sms
   ```
4. Make sure the HTTP method is set to POST

## 6. 10DLC Registration (for US A2P Messaging)

If you plan to use 10DLC (10-Digit Long Code) for Application-to-Person messaging in the US:

1. Navigate to Messaging > Compliance > 10DLC in the Twilio Console
2. Create a new Brand Registration with your company information
3. Create a Campaign for that brand
4. Connect your Twilio phone number to the campaign

## 7. Testing Your Integration

Once everything is set up:

1. Visit your application at `/twilio-demo`
2. Create a new business
3. Test sending verification codes
4. Test checking verification codes
5. Test sending SMS messages

## 8. Production Considerations

Before going to production:

1. Implement proper authentication and authorization
2. Set up webhook validation for security
3. Implement rate limiting to prevent abuse
4. Consider using dedicated phone numbers for businesses with high volume
5. Set up monitoring and alerts for error conditions

## 9. Troubleshooting

If you encounter issues:

1. Check the Twilio Console logs for errors
2. Verify your webhook URL is publicly accessible
3. Ensure your environment variables are correctly set
4. Check server logs for detailed error messages

## 10. Additional Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Verify API Documentation](https://www.twilio.com/docs/verify/api)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Twilio Messaging Services Documentation](https://www.twilio.com/docs/messaging/services) 