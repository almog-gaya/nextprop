
import Stripe from 'stripe';
import * as db from './stripeFirestore';

export const handleCheckoutSessionCompleted = async (event: Stripe.Event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    return await db.saveSession(session);
}

// Subscription events
/**
 * 
    Possible values for `status`:
    [incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid, paused]
    
    url: https://docs.stripe.com/api/subscriptions/object#subscription_object-status
 */
export const handleSubscription = async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    return await db.updateSubscription(subscription);
}

// Invoice events
export const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    return await db.saveInvoice(invoice);
}

export const handleInvoicePaymentFailed = async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    return await db.failedPaymentInvoice(invoice);

}



