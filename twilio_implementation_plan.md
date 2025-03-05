# Twilio SMS & Verification Implementation Plan

## Phase 1: Core Twilio Integration

### Setup & Environment Configuration
- [ ] Register Twilio account and verify ownership
- [ ] Purchase Twilio phone number for SMS communications
- [ ] Set up Twilio API credentials (SID, Auth Token)
- [ ] Add environment variables to project
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `TWILIO_VERIFY_SERVICE_SID` (if using a single default service)

### Backend Twilio Service Implementation
- [ ] Install Twilio packages
  ```bash
  npm install twilio @twilio/conversations
  ```
- [ ] Create base Twilio client service
  ```typescript
  // src/lib/twilio.ts
  import { Twilio } from 'twilio';
  
  const twilioClient = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  export default twilioClient;
  ```
- [ ] Implement basic SMS sending functionality
  ```typescript
  // src/lib/sms.ts
  import twilioClient from './twilio';
  
  export async function sendSMS(to: string, body: string) {
    return twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  }
  ```

### Replace GoHighLevel Mock Implementations

#### Conversations API Endpoint
- [ ] Update conversation list endpoint with Twilio integration
  - `src/app/api/conversations/route.ts`
  - Fetch conversations from Twilio
  - Format to match existing UI expectations

#### Messages API Endpoint
- [ ] Update conversation messages endpoint with Twilio integration
  - `src/app/api/conversations/[id]/messages/route.ts`
  - Fetch messages from specific Twilio conversation
  - Format to match UI expectations

#### Send Message Endpoint
- [ ] Update send message endpoint with Twilio integration
  - `src/app/api/conversations/messages/route.ts`
  - Send message via Twilio
  - Handle conversation creation if needed

### Incoming Message Webhooks
- [ ] Create Twilio webhook endpoint
  ```typescript
  // src/app/api/webhooks/twilio-sms/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { TwiML } from 'twilio';
  
  export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const body = formData.get('Body') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    
    // Process incoming message
    // Add to conversation
    
    const twiml = new TwiML.MessagingResponse();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
  ```
- [ ] Configure webhook URL in Twilio console
- [ ] Add webhook signature validation for security

### Twilio Verify Service for Basic Verification
- [ ] Create default verification service
  ```typescript
  // src/lib/verify.ts
  import twilioClient from './twilio';
  
  export async function sendVerificationCode(phoneNumber: string, channel = 'sms') {
    return twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel
      });
  }
  
  export async function checkVerificationCode(phoneNumber: string, code: string) {
    return twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code
      });
  }
  ```

### Basic Testing
- [ ] Test SMS sending/receiving
- [ ] Test conversations list fetching
- [ ] Test message history loading
- [ ] Test basic verification flow

## Phase 2: Multi-Tenant Business Verification

### Database Schema for Businesses
- [ ] Create business model and schema
  ```typescript
  // src/types/business.ts
  export interface Business {
    id: string;
    name: string;
    contactEmail: string;
    phoneNumber: string;
    verifyServiceId: string;
    hasCustomNumber: boolean;
    customTwilioNumber?: string;
    brandingSid?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- [ ] Set up database migrations/tables
- [ ] Create business CRUD operations
  - Create/Register business
  - Update business settings
  - Delete/Deactivate business

### Multi-Tenant Verification Service
- [ ] Implement business registration function
  ```typescript
  // src/lib/business-verify.ts
  export async function registerBusinessVerification(business: Business) {
    const verifyService = await twilioClient.verify.v2.services.create({
      friendlyName: `${business.name} Verification`,
      codeLength: 6
    });
    
    return verifyService.sid;
  }
  ```
- [ ] Business-specific verification functions
  ```typescript
  export async function sendBusinessVerification(
    businessId: string,
    phoneNumber: string,
    channel = 'sms'
  ) {
    const business = await db.businesses.findUnique({
      where: { id: businessId }
    });
    
    if (!business?.verifyServiceId) {
      throw new Error('Business verification not configured');
    }
    
    return twilioClient.verify.v2.services(business.verifyServiceId)
      .verifications.create({
        to: phoneNumber,
        channel
      });
  }
  ```
- [ ] Function to check business verification codes
  ```typescript
  export async function checkBusinessVerification(
    businessId: string,
    phoneNumber: string,
    code: string
  ) {
    const business = await db.businesses.findUnique({
      where: { id: businessId }
    });
    
    if (!business?.verifyServiceId) {
      throw new Error('Business verification not configured');
    }
    
    return twilioClient.verify.v2.services(business.verifyServiceId)
      .verificationChecks.create({
        to: phoneNumber,
        code
      });
  }
  ```

### Business API Endpoints
- [ ] Create business management endpoints
  - `/api/businesses` - GET, POST endpoints
  - `/api/businesses/[id]` - GET, PUT, DELETE endpoints
- [ ] Create business verification endpoints
  - `/api/businesses/[id]/verify/send` - Send verification
  - `/api/businesses/[id]/verify/check` - Check verification code

### Verification Logging & Analytics
- [ ] Create schema for verification attempts
  ```typescript
  export interface VerificationAttempt {
    id: string;
    businessId: string;
    phoneNumber: string;
    channel: string;
    status: string;
    sid: string;
    createdAt: Date;
  }
  ```
- [ ] Create schema for verification checks
  ```typescript
  export interface VerificationCheck {
    id: string;
    attemptId: string;
    businessId: string;
    phoneNumber: string;
    code: string;
    status: string;
    success: boolean;
    createdAt: Date;
  }
  ```
- [ ] Implement logging for all verification events

## Phase 3: Advanced Features & UI

### 10DLC Registration for US Businesses
- [ ] Implement 10DLC registration workflow
  ```typescript
  // src/lib/10dlc.ts
  export async function register10DLCBrand(businessId: string, businessInfo: any) {
    const business = await db.businesses.findUnique({
      where: { id: businessId }
    });
    
    // Create Twilio Messaging Service Brand Registration
    const brand = await twilioClient.messaging.v1.brandRegistrations.create({
      businessName: business.name,
      // other required fields from businessInfo
    });
    
    // Store brand SID
    await db.businesses.update({
      where: { id: businessId },
      data: { brandingSid: brand.sid }
    });
    
    return brand;
  }
  ```
- [ ] Implement 10DLC campaign registration
- [ ] Create 10DLC registration forms/UI

### Custom Verification Templates
- [ ] Implement template management for businesses
  ```typescript
  export async function updateBusinessTemplate(
    businessId: string,
    templateContent: string
  ) {
    const business = await db.businesses.findUnique({
      where: { id: businessId }
    });
    
    // Update Twilio verification service with custom template
    await twilioClient.verify.v2.services(business.verifyServiceId)
      .update({
        // Set appropriate template fields
      });
    
    return true;
  }
  ```
- [ ] Create UI for businesses to manage templates
- [ ] Support variable substitution in templates

### Dedicated Phone Numbers
- [ ] Function to provision dedicated numbers
  ```typescript
  export async function provisionDedicatedNumber(
    businessId: string,
    areaCode?: string
  ) {
    // Search for available phone numbers
    const numbers = await twilioClient.availablePhoneNumbers('US')
      .local.list({ areaCode, limit: 10 });
    
    if (numbers.length === 0) {
      throw new Error('No numbers available');
    }
    
    // Purchase the first available number
    const number = await twilioClient.incomingPhoneNumbers
      .create({ phoneNumber: numbers[0].phoneNumber });
    
    // Update business with dedicated number
    await db.businesses.update({
      where: { id: businessId },
      data: {
        hasCustomNumber: true,
        customTwilioNumber: number.phoneNumber
      }
    });
    
    return number;
  }
  ```
- [ ] Update SMS sending to use dedicated numbers when available
- [ ] Create UI for number management

### White-Labeled Verification UI
- [ ] Create verification UI components
- [ ] Implement business-specific branding
- [ ] Create embeddable verification widgets

### Dashboard & Analytics
- [ ] Create verification analytics dashboard
  - Success rates
  - Verification volumes
  - Cost tracking
- [ ] Implement usage reports for businesses
- [ ] Create admin dashboard for platform oversight

## Phase 4: Optimization & Scaling

### Performance Optimization
- [ ] Implement caching for verification services
- [ ] Optimize database queries
- [ ] Add rate limiting per business

### High-Volume Solutions
- [ ] Implement short code provisioning for high-volume clients
- [ ] Set up queue system for heavy traffic periods
- [ ] Implement horizontal scaling for webhook handling

### Cost Management
- [ ] Create detailed billing tracking
- [ ] Implement tiered pricing models
- [ ] Set up usage alerts and caps

### Compliance & Security
- [ ] Implement advanced security measures
  - IP whitelisting
  - Fraud detection
- [ ] Add compliance documentation
- [ ] Create audit logs for all verification activities 