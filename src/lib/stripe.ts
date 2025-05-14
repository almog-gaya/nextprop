import Stripe from 'stripe';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key. Please add NEXT_PUBLIC_STRIPE_SECRET_KEY to your environment variables.');
}

const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
// Initialize Stripe
export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Create or get Stripe customer
export const getOrCreateCustomer = async (email: string, data: any) => {
  const normalizedEmail = email.toLowerCase();
  const customerRef = doc(db, 'customers', normalizedEmail);
  const customerSnap = await getDoc(customerRef);

  if (customerSnap.exists()) {
    return customerSnap.data().stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: normalizedEmail,
  });

  // Save customer ID to Firestore
  await setDoc(customerRef, {
    ...data,
    stripeCustomerId: customer.id,
    email: normalizedEmail,
    createdAt: new Date().toISOString()
  });

  return customer.id;
};

// Create Stripe checkout session
export const createCheckoutSession = async (email: string, data: any) => {
  const customerId = await getOrCreateCustomer(email, data);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${baseUrl}/onboarding?success=true&email=${encodeURIComponent(email)}`,
    cancel_url: `${baseUrl}/onboarding?canceled=true`,
  });

  return session;
};

// Create portal session
export const createPortalSession = async (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const customerRef = doc(db, 'customers', normalizedEmail);
  const customerSnap = await getDoc(customerRef);
  
  if (!customerSnap.exists()) {
    throw new Error('No customer found');
  }

  const { stripeCustomerId } = customerSnap.data();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });

  return session;
}; 