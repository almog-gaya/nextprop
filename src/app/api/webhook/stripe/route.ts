import { getStripeInstance } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as handler from './eventHandler';

const endpointSecret = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const sig = req.headers.get('stripe-signature');

        if (!sig || !endpointSecret) {
            return NextResponse.json(
                { error: 'Missing stripe signature or webhook secret' },
                { status: 400 }
            );
        }

        let event;
        try { 
            const stripe = getStripeInstance();
            // Construct the event
            event = stripe!.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err) {
            console.error('Error verifying webhook signature:', err);
            return NextResponse.json(
                { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired':
                handler.handleCheckoutSessionCompleted(event);
                break;
            case 'invoice.payment_succeeded':
            case 'invoice.updated':
                console.log('invoice.payment_succeeded', event);
                handler.handleInvoicePaymentSucceeded(event);
                break;
            case 'invoice.deleted':
            case 'invoice.payment_failed':
            case 'invoice.updated':
                console.log('invoice.payment_failed', event);
                handler.handleInvoicePaymentFailed(event);
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.created':
            case 'customer.subscription.deleted':
            case 'customer.subscription.trial_will_end':
            case 'customer.subscription.resumed':
            case 'customer.subscription.paused':
                handler.handleSubscription(event);



            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};