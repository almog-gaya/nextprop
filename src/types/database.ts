/**
 * Business entity
 */
export interface Business {
  id: string;
  name: string;
  user_id?: string;
  contact_email?: string;
  phone_number?: string;
  custom_twilio_number?: string;
  custom_twilio_sid?: string;
  twilio_verify_sid?: string;
  status: 'pending_verification' | 'verified' | 'suspended';
  verification_attempts: number;
  verified_at?: string;
  last_verification_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Verification attempt
 */
export interface VerificationAttempt {
  id: string;
  business_id: string;
  phone_number: string;
  twilio_sid: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Verification check
 */
export interface VerificationCheck {
  id: string;
  business_id: string;
  verification_attempt_id: string;
  code: string;
  twilio_sid: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Message entity
 */
export interface Message {
  id: string;
  twilio_sid: string;
  business_id?: string;
  from_number: string;
  to_number: string;
  body: string;
  status: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  updated_at?: string;
}

/**
 * New message creation type
 */
export type MessageCreate = Omit<Message, 'id' | 'created_at' | 'updated_at'>;

/**
 * Business create type
 */
export type BusinessCreate = Omit<Business, 'id' | 'created_at' | 'updated_at'>;

/**
 * Business update type
 */
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Verification attempt create type
 */
export type VerificationAttemptCreate = Omit<VerificationAttempt, 'id' | 'created_at' | 'updated_at'>;

/**
 * Verification check create type
 */
export type VerificationCheckCreate = Omit<VerificationCheck, 'id' | 'created_at' | 'updated_at'>;

/**
 * Message update type
 */
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Database schema type
 */
export interface Database {
  public: {
    businesses: Business;
    verification_attempts: VerificationAttempt;
    verification_checks: VerificationCheck;
    messages: Message;
  }
} 