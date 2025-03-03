# Instantly API Integration Guide

## Overview
This guide documents our integration with the Instantly.ai API for email campaign automation. Instantly provides a powerful platform for sending personalized emails at scale with features like scheduling, tracking, and analytics.

## API Base URL
- Base URL: `https://api.instantly.ai/api/v2`

## Authentication
All API calls require an Authorization header with a Bearer token:
```
Authorization: Bearer YOUR_API_KEY
```

## Key Endpoints

### Campaigns

#### Get Campaign Details
```
GET /campaigns/{campaign_id}
```
Returns detailed information about a campaign including email gap settings, schedules, and other configuration.

#### Get Campaign Analytics
```
GET /campaigns/analytics?campaign_id={campaign_id}
```
Returns analytics for the campaign including leads count, contacted count, open/reply rates, and more.

### Leads

#### List Leads
```
POST /leads/list
```
Body parameters:
- `campaign`: Campaign ID
- `limit`: Number of leads to return (default: 100)
- `starting_after`: ID to start after for pagination
- `email`: Optional filter by email

Returns a list of leads associated with the campaign with their current status.

#### Add Lead
```
POST /leads
```
Body parameters:
- `campaign`: Campaign ID
- `email`: Lead's email
- `first_name`: Lead's first name
- `last_name`: Lead's last name
- Other optional fields like company, personalization, etc.

### Emails

#### List Emails
```
GET /emails?campaign_id={campaign_id}&limit={limit}
```
Returns emails that have been sent from the campaign.

#### Starting After Parameter
For pagination, use `starting_after` with the timestamp of the last email or ID of the last lead.

## Lead Status Codes
- 1: Active - Lead is active and will receive emails
- 3: Completed - Lead has completed the sequence
- -1: Bounced - Email address bounced

## Configuration Parameters

### Email Gap
The minimum time between emails (in minutes). Setting this too low may trigger spam filters.

### Email Template
The email template for the campaign, including subject line and body.

## Best Practices

1. Start with a larger email gap (10+ minutes) and gradually decrease if needed
2. Use valid email addresses to avoid bounces
3. Monitor campaign analytics regularly
4. Personalize emails with recipient name and other custom fields
5. Set up proper tracking for opens, clicks, and replies

## Implementation Notes

- The API has a rate limit (not explicitly documented)
- Email sending is sequential and respects the email gap setting
- Status updates may not be immediate; periodically check analytics
- Campaign updates may take a minute to take effect

## Common Issues and Solutions

### Emails not sending
- Check if the campaign is active (status: 1)
- Verify the email gap isn't too large
- Ensure there are valid leads in the campaign
- Check for API authentication issues

### High bounce rate
- Verify email addresses before adding as leads
- Use email validation services
- Remove invalid emails promptly

## Sample Integration Code
```javascript
// Example: Fetching campaign analytics
async function getCampaignAnalytics(campaignId) {
  const response = await fetch(
    `https://api.instantly.ai/api/v2/campaigns/analytics?campaign_id=${campaignId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}
``` 