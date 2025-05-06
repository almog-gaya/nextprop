import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key. Please add NEXT_PUBLIC_STRIPE_SECRET_KEY to your environment variables.');
}

// Initialize Stripe
export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Load Stripe.js
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing Stripe publishable key. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.');
  }
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
};

// Create or get Stripe customer
export const getOrCreateCustomer = async (userId: string, email: string) => {
  const customerRef = doc(db, 'customers', userId);
  const customerSnap = await getDoc(customerRef);

  if (customerSnap.exists()) {
    return customerSnap.data().stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      firebaseUID: userId,
    },
  });

  // Save customer ID to Firestore
  await setDoc(customerRef, {
    stripeCustomerId: customer.id,
    email,
    userId,
  });

  return customer.id;
};

// Create Stripe checkout session
export const createCheckoutSession = async (userId: string, priceId: string, email: string) => {
  const customerId = await getOrCreateCustomer(userId, email);
  
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
    success_url: `${baseUrl}/billing?success=true`,
    cancel_url: `${baseUrl}/billing?canceled=true`,
  });

  return session;
};

// Create portal session
export const createPortalSession = async (userId: string) => {
  const customerRef = doc(db, 'customers', userId);
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