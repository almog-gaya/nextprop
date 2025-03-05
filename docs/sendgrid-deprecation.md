# SendGrid Service Deprecation Notice

## Overview

The SendGrid email service integration in NextProp.AI is being deprecated and will be removed in a future release. This document provides information about the deprecation timeline, impact, and migration guidance.

## Timeline

- **Current Status**: Deprecated (warnings will appear in logs and API responses)
- **End of Support**: To be determined (will be announced with at least 30 days' notice)
- **Removal Date**: To be determined (will be announced with at least 60 days' notice)

## Impact

The following components are affected by this deprecation:

1. `src/utils/emailService.ts` - SendGrid-based email service
2. `src/app/api/email/test/route.ts` - SendGrid test endpoint
3. Any code that directly imports and uses SendGrid (`@sendgrid/mail`)

## Temporary Solution

During the transition period, the existing SendGrid implementation will continue to function, but will display deprecation warnings in logs and API responses. You should plan to migrate to the new email service as soon as it becomes available.

## Migration Path

A new email service implementation is being developed to replace SendGrid. The new implementation will provide similar functionality but may use a different email service provider.

### Migration Steps

1. **Monitor for Updates**: Watch for announcements about the new email service.
2. **Review Documentation**: When available, review the documentation for the new email service.
3. **Update Environment Variables**: Update your environment variables to include the new provider's credentials.
4. **Update Code**: Replace imports from `src/utils/emailService.ts` with imports from `src/utils/newEmailService.ts`.
5. **Test**: Thoroughly test the new implementation to ensure it meets your requirements.

### Code Migration Example

Current usage:

```typescript
import { sendEmail } from 'src/utils/emailService';

// Send email using SendGrid
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'This is a test email',
  html: '<p>This is a test email</p>'
});
```

Future usage (after migration is complete):

```typescript
import { sendEmail } from 'src/utils/newEmailService';

// Send email using new provider
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'This is a test email',
  html: '<p>This is a test email</p>'
});
```

## FAQ

### Why is SendGrid being deprecated?

This decision is part of a strategic initiative to standardize our service providers and improve the reliability and features of our email communication system.

### Will there be functionality changes?

The core email functionality will remain the same, but there may be additional features or slight differences in the API depending on the selected replacement service.

### What if I need help with migration?

Contact the NextProp.AI support team for assistance with migration planning and implementation.

## Contact

If you have any questions or concerns about this deprecation, please contact the NextProp.AI support team at support@nextprop.ai. 