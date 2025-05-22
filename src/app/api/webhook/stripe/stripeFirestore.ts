import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import Stripe from 'stripe';

12
export const saveSession = async (session: Stripe.Checkout.Session) => {
    const customerId = session.customer!.toString();
    const user = await getUserByStripeId(customerId);
    const userId = user.id;

    const sessionRef = doc(db, `customers/${customerId}`, 'checkout_sessions', session.id);
    return await setDoc(sessionRef, {
        ...session,
        hasCompletedPayment: true,
    }, { merge: true });
}

export const saveInvoice = async (invoice: Stripe.Invoice) => {
    const customerId = invoice.customer!.toString();
    const user = await getUserByStripeId(customerId);
    const userId = user.id;
    const userRef = doc(db, `customers/${userId}`);
    const invoiceRef = doc(db, `customers/${userId}/invoices/${invoice.id}`);

    await updateDoc(userRef, { 'hasCompletedPayment': true });
    return await setDoc(invoiceRef, {
        ...invoice,
    }, { merge: true });
}
export const failedPaymentInvoice = async (invoice: Stripe.Invoice) => {
    const customerId = invoice.customer!.toString();
    const user = await getUserByStripeId(customerId);
    const userId = user.id;
    const invoiceRef = doc(db, `customers/${userId}/invoices/${invoice.id}`);
    return await setDoc(invoiceRef, {
        ...invoice,
    }, { merge: true });
}
export const updateSubscription = async (subscription: Stripe.Subscription) => {
    const customerId = subscription.customer.toString();
    const userQuery = query(collection(db, 'customers'), where('stripeCustomerId', '==', customerId));
    const userSnapshot = await getDocs(userQuery);

    // Check if a matching document exists
    if (!userSnapshot.empty) {
        const userRef = userSnapshot.docs[0].ref;
        return await setDoc(userRef, {
            subscription: subscription,

        }, { merge: true });
    } else {
        throw new Error(`No user found with customerId: ${customerId}`);
    }
};


export const getUserByStripeId = async (stripeCustomerId: string) => {
    const userQuery = query(collection(db, 'customers'), where('stripeCustomerId', '==', stripeCustomerId));
    const userSnapshot = await getDocs(userQuery);
    if (userSnapshot.empty) {
        throw new Error(`No user found with customerId: ${stripeCustomerId}`);
    }
    return userSnapshot.docs[0];
}
