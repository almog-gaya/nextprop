'use client'
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { CreditCardIcon, CurrencyDollarIcon, ChartBarIcon, EnvelopeIcon, PhoneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { getStripe } from '@/lib/stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

// Stripe price IDs for one-time payments
const PRICE_IDS = {
  BASE_SUBSCRIPTION: 'price_1RLgbhRkvhtKflplpF4JvHLt',  // Keep this as recurring
  PHONE_NUMBER: 'price_1RLi6XRkvhtKflplfY87xdsK',       // Keep this as recurring
  SMS: 'price_1RLgdERkvhtKflplFXLn0RUI',               // Change to one-time
  RVM: 'price_1RLh15RkvhtKflplFEgt3SgD',                // Change to one-time
  EMAIL: 'price_1RLgkvRkvhtKflpl5XOwSvaq'              // Change to one-time
}; 

// Add a comment explaining the price types
// Note: SMS, RVM, and EMAIL prices need to be one-time prices in your Stripe account
// Please create new one-time prices in your Stripe dashboard and update these IDs

const SMS_USAGE = 2000; 
const RVM_USAGE = 500; 
const EMAIL_USAGE = 4000; 

// Pricing constants
const PRICING = {
  BASE_SUBSCRIPTION: 1000,
  PHONE_NUMBER: 7,
  SMS: 0.01,
  RVM: 0.05,
  EMAIL: 0.002
};

export default function BillingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [phoneNumberCount, setPhoneNumberCount] = useState<number | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(125);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState<boolean>(false);
  const [autoRechargeThreshold, setAutoRechargeThreshold] = useState<number>(50);
  const [autoRechargeAmount, setAutoRechargeAmount] = useState<number>(100);
  const [isRecharging, setIsRecharging] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData();
    }
  }, [user?.id]);

  // Handle success/cancel URLs
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      toast.success('Subscription activated successfully!');
      fetchSubscriptionData(); // Refresh subscription data
    } else if (canceled) {
      toast.error('Subscription process was canceled');
    }
  }, [searchParams]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const customerRef = doc(db, 'customers', user!.id);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        const customerData = customerSnap.data();
        setSubscription(customerData.stripeRole || null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading('all');
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          mode: 'subscription', // Specify subscription mode
          lineItems: items.map(item => {
            // For metered items (SMS, RVM, Email), don't specify quantity
            if ([PRICE_IDS.SMS, PRICE_IDS.RVM, PRICE_IDS.EMAIL].includes(item.priceId)) {
              return {
                priceId: item.priceId
              };
            }
            // For subscription items (Base Subscription, Phone Numbers), use subscription mode
            return {
              priceId: item.priceId,
              quantity: getQuantityForPrice(item.priceId)
            };
          })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await getStripe();
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getQuantityForPrice = (priceId: string) => {
    switch (priceId) {
      case PRICE_IDS.SMS:
        return SMS_USAGE;
      case PRICE_IDS.RVM:
        return RVM_USAGE;
      case PRICE_IDS.EMAIL:
        return EMAIL_USAGE;
      case PRICE_IDS.PHONE_NUMBER:
        return phoneNumberCount || 0;
      default:
        return 1;
    }
  };

  const handleManageSubscription = async () => {
    try {
      toast.loading('Opening customer portal...');
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to open customer portal');
    }
  };

  useEffect(() => {
    fetch('/api/voicemail/phone-numbers')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.numbers)) {
          setPhoneNumberCount(data.numbers.length);
        } else {
          setPhoneNumberCount(0);
        }
      })
      .catch(err => {
        setPhoneNumberError('Could not fetch phone numbers');
        setPhoneNumberCount(0);
      });
  }, []);

  const handleRecharge = () => {
    setIsRecharging(true);
    // Simulate API call for recharging
    setTimeout(() => {
      setCurrentBalance(currentBalance + rechargeAmount);
      setIsRecharging(false);
    }, 1000);
  };

  // Calculate totals
  const phoneNumbersSubtotal = (phoneNumberCount ?? 0) * PRICING.PHONE_NUMBER;
  const items = [
    {
      label: 'Base Subscription',
      description: 'Platform access',
      icon: CurrencyDollarIcon,
      usage: 1,
      unit: 'fixed',
      unitPrice: PRICING.BASE_SUBSCRIPTION,
      subtotal: PRICING.BASE_SUBSCRIPTION,
      priceId: PRICE_IDS.BASE_SUBSCRIPTION
    },
    {
      label: 'Phone Numbers',
      description: 'Active numbers on your account',
      icon: PhoneIcon,
      usage: phoneNumberCount ?? '—',
      unit: 'numbers',
      unitPrice: PRICING.PHONE_NUMBER,
      subtotal: phoneNumbersSubtotal,
      loading: phoneNumberCount === null,
      error: phoneNumberError,
      priceId: PRICE_IDS.PHONE_NUMBER
    },
    {
      label: 'SMS',
      description: 'Outbound messages',
      icon: PhoneIcon,
      usage: SMS_USAGE,
      unit: 'SMS',
      unitPrice: PRICING.SMS,
      subtotal: SMS_USAGE * PRICING.SMS,
      priceId: PRICE_IDS.SMS
    },
    {
      label: 'RVM',
      description: 'Ringless Voicemail',
      icon: MicrophoneIcon,
      usage: RVM_USAGE,
      unit: 'rvm units',
      unitPrice: PRICING.RVM,
      subtotal: RVM_USAGE * PRICING.RVM,
      priceId: PRICE_IDS.RVM
    },
    {
      label: 'Emails',
      description: 'Outbound emails sent',
      icon: EnvelopeIcon,
      usage: EMAIL_USAGE,
      unit: 'emails',
      unitPrice: PRICING.EMAIL,
      subtotal: EMAIL_USAGE * PRICING.EMAIL,
      priceId: PRICE_IDS.EMAIL
    }
  ];

  const total = items.reduce((sum, item) => sum + (typeof item.subtotal === 'number' ? item.subtotal : 0), 0);

  return (
    <DashboardLayout title="Billing & Usage">
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pay Now Card */}
          <div className="nextprop-card bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Pay Usage</h3>
            <p className="text-gray-600 text-sm mb-4">Pay for your current usage</p>
            <div className="text-2xl font-bold text-purple-800 mb-4">
              ${total.toLocaleString()}
            </div>
            <button
              onClick={handleCheckout}
              className="w-full nextprop-primary-button py-2 px-4"
              disabled={checkoutLoading === 'all' || total === 0}
            >
              {checkoutLoading === 'all' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Pay Now'
              )}
            </button>
          </div>

          {/* Recharge Card */}
          <div className="nextprop-card bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 shadow p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Recharge Balance</h3>
            <p className="text-gray-600 text-sm mb-4">Add funds to your account</p>
            <div className="flex items-center mb-4">
              <span className="text-gray-500 border border-r-0 rounded-l-md px-3 py-2 bg-white">$</span>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                className="border rounded-r-md px-3 py-2 w-full"
                min="10"
                step="10"
              />
            </div>
            <button 
              className="w-full nextprop-primary-button py-2 px-4"
              onClick={handleRecharge}
              disabled={isRecharging}
            >
              {isRecharging ? 'Processing...' : 'Recharge Now'}
            </button>
          </div>

          {/* Customer Portal Card */}
          <div className="nextprop-card bg-gradient-to-r from-green-100 to-green-50 border border-green-200 shadow p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Manage Billing</h3>
            <p className="text-gray-600 text-sm mb-4">View invoices and manage payment methods</p>
            <button
              onClick={handleManageSubscription}
              className="w-full nextprop-outline-button py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Open Customer Portal
            </button>
          </div>
        </section>

        {/* Current Balance */}
        <section className="nextprop-card bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Current Balance</h2>
              <div className="text-gray-500 text-sm">
                {loading ? (
                  <span className="animate-pulse">Loading balance...</span>
                ) : (
                  `Available balance: $${currentBalance.toLocaleString()}`
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-10 w-10 text-purple-500" />
              <span className="text-4xl font-bold text-purple-800">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `$${currentBalance.toLocaleString()}`
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Auto-Recharge Settings */}
        <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900">Auto-Recharge Settings</h2>
          
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={autoRechargeEnabled}
                  onChange={(e) => setAutoRechargeEnabled(e.target.checked)}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Enable Auto-Recharge</span>
              </label>
            </div>
          </div>
          
          <div className={`space-y-6 ${autoRechargeEnabled ? 'opacity-100' : 'opacity-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Threshold Balance</label>
                <div className="flex items-center">
                  <span className="text-gray-500 border border-r-0 rounded-l-md px-3 py-2 bg-white">$</span>
                  <input
                    type="number"
                    value={autoRechargeThreshold}
                    onChange={(e) => setAutoRechargeThreshold(Number(e.target.value))}
                    className="border rounded-r-md px-3 py-2 w-full"
                    min="10"
                    step="10"
                    disabled={!autoRechargeEnabled}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Auto-recharge when balance falls below this amount</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Recharge Amount</label>
                <div className="flex items-center">
                  <span className="text-gray-500 border border-r-0 rounded-l-md px-3 py-2 bg-white">$</span>
                  <input
                    type="number"
                    value={autoRechargeAmount}
                    onChange={(e) => setAutoRechargeAmount(Number(e.target.value))}
                    className="border rounded-r-md px-3 py-2 w-full"
                    min="20"
                    step="10"
                    disabled={!autoRechargeEnabled}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Amount to add when auto-recharge triggers</p>
              </div>
            </div>
            
            <div className="bg-purple-50 text-purple-700 p-4 rounded-lg mt-5">
              <p className="text-sm">
                When enabled, your account will automatically recharge <span className="font-semibold">${autoRechargeAmount}</span> when your balance falls below <span className="font-semibold">${autoRechargeThreshold}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900">Price Breakdown</h2>
          <div className="divide-y divide-gray-100 bg-white bg-opacity-75 rounded-lg overflow-hidden border border-gray-100">
            {items.map((item) => (
              <div key={item.label} className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <item.icon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-gray-500 text-xs">{item.description}</div>
                  {item.error && <div className="text-xs text-red-500 mt-1">{item.error}</div>}
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">
                  {item.loading ? <span className="animate-pulse">Loading…</span> : (item.unit === 'fixed' ? '—' : `${item.usage.toLocaleString()} ${item.unit}`)}
                </div>
                <div className="w-24 text-right text-gray-700">
                  {item.unit === 'fixed' ? '' : `$${item.unitPrice.toFixed(3)}`}
                </div>
                <div className="w-28 text-right font-semibold text-gray-900">
                  ${typeof item.subtotal === 'number' ? item.subtotal.toLocaleString() : '—'}
                </div>
              </div>
            ))}
            <div className="flex items-center py-4 px-4 font-bold text-purple-900 text-lg bg-purple-50">
              <div className="flex-1 text-right pr-4">Total</div>
              <div className="w-28 text-right">${total.toLocaleString()}</div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 