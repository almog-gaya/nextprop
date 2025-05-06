import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, lineItems } = await request.json();

    if (!userId || !email || !lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or get customer
    const customerRef = doc(db, 'customers', userId);
    const customerSnap = await getDoc(customerRef);
    
    let customerId;
    if (!customerSnap.exists()) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;

      // Create customer document in Firestore
      await setDoc(customerRef, {
        stripeCustomerId: customerId,
        email,
        userId,
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
        // ...usageItems.map(item => ({
        //   price: item.priceId,
        //   quantity: item.quantity
        // }))
      ],
      mode: subscriptionItems.length > 0 ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        firebaseUID: userId,
        lineItems: JSON.stringify(lineItems)
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 