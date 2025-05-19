import Stripe from 'stripe';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Initialize Stripe with a conditional check that won't throw during build
let stripe: Stripe | null = null;

// Only initialize if we're in a browser or if the environment variable exists
if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build';
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

const getPlanPriceId = (plan: string): string | undefined => {
  const planKey = plan.toLowerCase();
  switch (planKey) {
    case 'basic':
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC;
    case 'pro':
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
    case 'enterprise':
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE;
    default:
      throw new Error(`Unknown plan: ${plan}`);
  }
};
// Helper function to ensure Stripe is initialized
export const getStripeInstance = () => {
  if (!stripe) {
    if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe secret key. Please add NEXT_PUBLIC_STRIPE_SECRET_KEY to your environment variables.');
    }
    const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
    });
  }
  return stripe;
};

// Create or get Stripe customer
export const getOrCreateCustomer = async (email: string, data: any) => {
  const stripeInstance = getStripeInstance();
  const normalizedEmail = email.toLowerCase();
  const customerRef = doc(db, 'customers', normalizedEmail);
  const customerSnap = await getDoc(customerRef);

  if (customerSnap.exists()) {
    return customerSnap.data().stripeCustomerId;
  }

  // Create new customer
  const customer = await stripeInstance.customers.create({
    email: normalizedEmail,
  });

  // Save customer ID to Firestore
  await setDoc(customerRef, {
    ...data,
    stripeCustomerId: customer.id,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    hasCompletedPayment: false,
  });

  return customer.id;
};

// Create Stripe checkout session
export const createCheckoutSession = async (email: string, data: any) => {
  const priceId = getPlanPriceId(data.plan);
  const stripeInstance = getStripeInstance();
  const customerId = await getOrCreateCustomer(email, {
    ...data,
    priceId: priceId,
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripeInstance.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPlanPriceId(data.plan),
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 30,
    },
    success_url: `${baseUrl}/register?success=true&email=${encodeURIComponent(email)}&plan=${data.plan}&phone=${data.phone}&name=${data.name}`,
    cancel_url: `${baseUrl}/onboarding?canceled=true`,
  });

  return {
    session: session,
    priceId: priceId,
  };
};

// Create portal session
export const createPortalSession = async (email: string) => {
  const stripeInstance = getStripeInstance();
  const normalizedEmail = email.toLowerCase();
  const customerRef = doc(db, 'customers', normalizedEmail);
  const customerSnap = await getDoc(customerRef);

  if (!customerSnap.exists()) {
    throw new Error('No customer found');
  }

  const { stripeCustomerId } = customerSnap.data();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripeInstance.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });

  return session;
}; 