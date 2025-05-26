
import Stripe from 'stripe';
import * as db from './stripeFirestore';
import { getStripeInstance } from '@/lib/stripe';
import { getBillingByStripeId } from '@/lib/billingService';

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
    // is subscription ended? 
    return await db.updateSubscription(subscription);
}

// Invoice events
export const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    return await db.saveInvoice(invoice);
}

/**
 *  This will be triggerred before finalzing the invoice, and adds the usage charges to the
 * the current invoice(that was created for subscription)
 * 
 * So what we are doing is adding the usage charges to the subscription charges so that both invoice are merged togather.
 * 
 */
export async function handleInvoiceUpcoming(event: Stripe.Event) {
    try {
        const invoice = event.data.object as Stripe.Invoice;
        const isSubscriptionCreatedNow = invoice.billing_reason !== 'subscription_create';

        if (isSubscriptionCreatedNow) {
            const stripeCustomerId = invoice.customer!.toString();
            const usageBillingCharges = await _getUsageFromFirebase(stripeCustomerId);

            const stripe = getStripeInstance();

            // Dynamically create invoice items from usageBillingCharges
            for (const [key, value] of Object.entries(usageBillingCharges)) {
                let amount, description;

                // Handle usage types with total/unitPrice/totalPrice structure
                if (typeof value === 'object' && 'totalPrice' in value) {
                    amount = Math.round(value.totalPrice * 100); // Convert to cents
                    description = `${key.charAt(0).toUpperCase() + key.slice(1)} usage for ${invoice.customer} from ${invoice.period_start} to ${invoice.period_end} at $${value.unitPrice}/unit`;
                }
                // Handle flat fee types (e.g., otherIntegrations)
                else if (typeof value === 'number') {
                    amount = Math.round(value * 100); // Convert to cents
                    description = `${key.charAt(0).toUpperCase() + key.slice(1)} for ${invoice.customer} from ${invoice.period_start} to ${invoice.period_end}`;
                } else {
                    console.warn(`Skipping invalid usage type: ${key}`);
                    continue;
                }

                // Only create invoice item if amount is non-zero
                if (amount > 0) {

                    // create new invoice
                    const createdInvoiceItem = await stripe.invoiceItems.create({
                        customer: invoice.customer!.toString(),
                        invoice: invoice.id,
                        amount: amount,
                        currency: 'usd',
                        description: description,
                    });
                }
            }
        } else {
            console.log('Subscription created, no usage charges to add. Skipping invoice item creation.');
        }
    } catch (_) {
        console.error('Error handling invoice finalized event:', _);
    }

}

async function _getUsageFromFirebase(stripeId: string) {

    const result = await getBillingByStripeId(stripeId);
    if (!result) {
        throw new Error(`No subscription found for Stripe ID: ${stripeId}`);
    }
    const usage = result.usage;
    return usage;
}


export const handleInvoicePaymentFailed = async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    return await db.failedPaymentInvoice(invoice);
}



