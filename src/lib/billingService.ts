import { getDoc, getDocs, collection, query, where, Timestamp, doc, Firestore } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Define interfaces
export interface UsageResult {
    base: Plan;
    status: string;
    startDate: Date;
    endDate: Date;
    customer: CustomerData;
    usage: UsageData;
}

export interface Plan {
    name: string;
    price: number;
}

export interface UsageData {
    phone: {
        total: number;
        unitPrice: number;
        totalPrice: number;
    };
    sms: {
        total: number;
        unitPrice: number;
        totalPrice: number;
    };
    rvm: {
        total: number;
        unitPrice: number;
        totalPrice: number;
    };
    email: {
        total: number;
        unitPrice: number;
        totalPrice: number;
    };
    aiSms: {
        total: number;
        unitPrice: number;
        totalPrice: number;
    };
    otherIntegrations: number;
}

export interface CustomerData {
    plan: string;
    subscription: {
        status: string;
        current_period_start: number;
        current_period_end: number;
    };
}

// Define constants
export const subscriptionPlans: { [key: string]: Plan } = {
    basic: {
        name: 'Basic',
        price: process.env.NEXT_PUBLIC_BASIC_PLAN_PRICE ? parseFloat(process.env.NEXT_PUBLIC_BASIC_PLAN_PRICE) : 149.00
    },
    pro: {
        name: 'Pro',
        price: process.env.NEXT_PUBLIC_PRO_PLAN_PRICE ? parseFloat(process.env.NEXT_PUBLIC_PRO_PLAN_PRICE) : 299.00
    },
    enterprise: {
        name: 'Enterprise',
        price: process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_PRICE ? parseFloat(process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_PRICE) : 499.00
    }
};

export const unitPrices = {
    base: 0, // Set to 0 since it’s not used in calculations; adjust if needed
    phone: process.env.NEXT_PUBLIC_PHONE_NUMBER_PRICE? parseFloat(process.env.NEXT_PUBLIC_PHONE_NUMBER_PRICE) : 50, 
    sms: process.env.NEXT_PUBLIC_SMS_PRICE? parseFloat(process.env.NEXT_PUBLIC_SMS_PRICE) : 0.01, 
    aiSms: process.env.NEXT_PUBLIC_AI_SMS_PRICE ? parseFloat(process.env.NEXT_PUBLIC_AI_SMS_PRICE) : 0.07, 
    rvm: process.env.NEXT_PUBLIC_RVM_PRICE ? parseFloat(process.env.NEXT_PUBLIC_RVM_PRICE) : 0.01, 
    email: process.env.NEXT_PUBLIC_EMAIL_PRICE ? parseFloat(process.env.NEXT_PUBLIC_EMAIL_PRICE) : 0.1,  
    otherIntegrations: process.env.NEXT_PUBLIC_OTHER_INTEGRATIONS_PRICE ? parseFloat(process.env.NEXT_PUBLIC_OTHER_INTEGRATIONS_PRICE) : 0  
};

export const getSubscription = async (locationId: string): Promise<CustomerData> => {
    try {
        const customerRef = doc(db as Firestore, 'customers', locationId);
        const customerSnapshot = await getDoc(customerRef);
        if (customerSnapshot.exists()) {
            return customerSnapshot.data() as CustomerData;
        } else {
            throw new Error('Subscription not found');
        }
    } catch (error) {
        console.error('Error fetching subscription:', error);
        throw error;
    }
};

export const getBillingUsage = async (locationId: string, user?: CustomerData): Promise<UsageResult> => {
    try {
        // Validate or fetch customer subscription
        const customer = user && user.subscription && user.plan ? user : await getSubscription(locationId);
        if (!customer || !customer.subscription || !customer.plan) {
            throw new Error('No Active Subscription Found');
        }
        const subscriptionStatus = customer.subscription.status;
        if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
            throw new Error('Subscription is not active or in trialing state');
        }
        const subscribedPlan = customer.plan; // Use customer.plan directly as it’s a Plan object
        if (!subscribedPlan || !subscriptionPlans[subscribedPlan!]) {
            throw new Error(`Invalid subscription plan: ${JSON.stringify(subscribedPlan)}`);
        }

        // Convert subscription period timestamps to Dates
        const currentPeriodStartDate = new Date(customer.subscription.current_period_start * 1000);
        const currentPeriodEndDate = new Date(customer.subscription.current_period_end * 1000);

        // Reference to the usage collection
        const usageRef = collection(db as Firestore, `customers/${locationId}/usage`);

        // Create query to filter by date range
        const q = query(
            usageRef,
            where('createdAt', '>=', Timestamp.fromDate(currentPeriodStartDate)),
            where('createdAt', '<=', Timestamp.fromDate(currentPeriodEndDate))
        );

        // Get all usage documents
        const querySnapshot = await getDocs(q);

        // Initialize counters
        const usageCounts: { [key: string]: number } = {
            AISMS: 0,
            SMS: 0,
            RVM: 0,
            email: 0
        };

        // Count usage by type
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const type = data.type ? String(data.type).toUpperCase() : 'SMS'; // Normalize type and default to SMS
            if (type in usageCounts) {
                usageCounts[type] = (usageCounts[type] || 0) + 1;
            }
        });

        // Log if no usage data is found (for debugging)
        if (querySnapshot.empty) {
            console.log('No usage data found for the specified period');
        }
        const phoneUsageCount = await fetchPhoneNumberUsage(locationId);
        // Calculate totals and return formatted data
        return {
            base: subscriptionPlans[subscribedPlan!],
            status: subscriptionStatus,
            startDate: currentPeriodStartDate,
            endDate: currentPeriodEndDate,
            customer,
            usage: {
                phone: {
                    total: phoneUsageCount,
                    unitPrice: unitPrices.phone,
                    totalPrice: Number(((phoneUsageCount) * unitPrices.phone).toFixed(2))
                },
                sms: {
                    total: usageCounts.SMS,
                    unitPrice: unitPrices.sms,
                    totalPrice: Number((usageCounts.SMS * unitPrices.sms).toFixed(2))
                },
                aiSms: {
                    total: usageCounts.AISMS,
                    unitPrice: unitPrices.aiSms,
                    totalPrice: Number((usageCounts.AISMS * unitPrices.aiSms).toFixed(2))
                },
                rvm: {
                    total: usageCounts.RVM,
                    unitPrice: unitPrices.rvm,
                    totalPrice: Number((usageCounts.RVM * unitPrices.rvm).toFixed(2))
                },
                email: {
                    total: usageCounts.email,
                    unitPrice: unitPrices.email,
                    totalPrice: Number((usageCounts.email * unitPrices.email).toFixed(2))
                },
                otherIntegrations: 0,
            }
        };
    } catch (error) {
        console.error('Error fetching billing usage:', error);
        throw error;
    }
};

const fetchPhoneNumberUsage = async (locationId: string): Promise<number> => {
    const result = await fetch("/api/voicemail/phone-numbers");
    if (!result.ok) {
        return 0;
    }

    const data = await result.json();
    if (data && Array.isArray(data.numbers)) {
        return data.numbers.length;
    } else if (data && typeof data === 'number') {
        console.warn('Unexpected data format:', data);
        return data;
    } else {
        console.warn('Unexpected data format:', data);
        return 0;
    }
}

export const getUserByStripeId = async (stripeId: string) => {
    try {
        const customersRef = collection(db as Firestore, 'customers');
        const q = query(customersRef, where('stripeCustomerId', '==', stripeId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null; // No user found
        }

        const userDoc = querySnapshot.docs[0];
        return userDoc;
    } catch (error) {
        console.error('Error fetching user by Stripe ID:', error);
        throw error;
    }
}

export const getBillingByStripeId = async (stripeId: string) => {
    const customer = await getUserByStripeId(stripeId);
    const locationId = customer?.id;

    if (!locationId) {
        throw new Error('Location ID not found for the customer');
    }
    return await getBillingUsage(locationId);   
}