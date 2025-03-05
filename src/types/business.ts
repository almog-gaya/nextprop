/**
 * Business model for multi-tenant verification
 */
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

/**
 * Verification attempt record
 */
export interface VerificationAttempt {
  id: string;
  businessId: string;
  phoneNumber: string;
  channel: string;
  status: string;
  sid: string;
  createdAt: Date;
}

/**
 * Verification check record
 */
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