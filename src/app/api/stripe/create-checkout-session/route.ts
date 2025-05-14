import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try { 
    const { email, lineItems, isOnboarding, data } = await request.json();

    if(isOnboarding && email) {
        const result = await createCheckoutSession(email, data);
        return NextResponse.json({ url: result.url });
    }

    if (!email || !lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import the getStripeInstance function dynamically to avoid build issues
    const { getStripeInstance } = await import('@/lib/stripe');
    const stripe = getStripeInstance();

    const normalizedEmail = email.toLowerCase();

    // Create or get customer
    const customerRef = doc(db, 'customers', normalizedEmail);
    const customerSnap = await getDoc(customerRef);
    
    let customerId;
    if (!customerSnap.exists()) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: normalizedEmail
      });
      customerId = customer.id;

      // Create customer document in Firestore
      await setDoc(customerRef, {
        stripeCustomerId: customerId,
        email: normalizedEmail,
        createdAt: new Date().toISOString()
      });
    } else {
      customerId = customerSnap.data().stripeCustomerId;
    }

    // Separate items by type
    const subscriptionItems = lineItems.filter(item => 
      item.priceId === 'price_1RLgbhRkvhtKflplpF4JvHLt',
    );

    const usageItems = lineItems.filter(item => 
      item.priceId === 'price_1RLi6XRkvhtKflplfY87xdsK' || // PHONE
      item.priceId === 'price_1RLgdERkvhtKflplFXLn0RUI' || // SMS
      item.priceId === 'price_1RLh15RkvhtKflplFEgt3SgD' || // RVM
      item.priceId === 'price_1RLgkvRkvhtKflpl5XOwSvaq'    // EMAIL
    );

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        // For subscription items, include quantity
        ...subscriptionItems.map(item => ({
          price: item.priceId,
          quantity: item.quantity
        })),
        // For usage items, include quantity as one-time payment
        ...usageItems.map(item => ({
          price: item.priceId,
          quantity: item.quantity
        }))
      ],
      mode: subscriptionItems.length > 0 ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        email: normalizedEmail,
        lineItems: JSON.stringify(lineItems)
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 