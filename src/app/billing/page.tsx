'use client'
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { CreditCardIcon, CurrencyDollarIcon, ChartBarIcon, EnvelopeIcon, PhoneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

const BASE_SUBSCRIPTION = 1000;
const SMS_USAGE = 2000;
const SMS_UNIT_PRICE = 0.01;
const RVM_USAGE = 500;
const RVM_UNIT_PRICE = 0.05;
const EMAIL_USAGE = 4000;
const EMAIL_UNIT_PRICE = 0.002;
const OTHER_INTEGRATIONS = 200;
const PHONE_NUMBER_UNIT_PRICE = 7;

export default function BillingPage() {
  const [phoneNumberCount, setPhoneNumberCount] = useState<number | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(125);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState<boolean>(false);
  const [autoRechargeThreshold, setAutoRechargeThreshold] = useState<number>(50);
  const [autoRechargeAmount, setAutoRechargeAmount] = useState<number>(100);
  const [isRecharging, setIsRecharging] = useState<boolean>(false);

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
  const phoneNumbersSubtotal = (phoneNumberCount ?? 0) * PHONE_NUMBER_UNIT_PRICE;
  const items = [
    {
      label: 'Base Subscription',
      description: 'Platform access',
      icon: CurrencyDollarIcon,
      usage: 1,
      unit: 'fixed',
      unitPrice: BASE_SUBSCRIPTION,
      subtotal: BASE_SUBSCRIPTION,
    },
    {
      label: 'Phone Numbers',
      description: 'Active numbers on your account',
      icon: PhoneIcon,
      usage: phoneNumberCount ?? '—',
      unit: 'numbers',
      unitPrice: PHONE_NUMBER_UNIT_PRICE,
      subtotal: phoneNumbersSubtotal,
      loading: phoneNumberCount === null,
      error: phoneNumberError,
    },
    {
      label: 'SMS',
      description: 'Outbound messages',
      icon: PhoneIcon,
      usage: SMS_USAGE,
      unit: 'SMS',
      unitPrice: SMS_UNIT_PRICE,
      subtotal: SMS_USAGE * SMS_UNIT_PRICE,
    },
    {
      label: 'RVM',
      description: 'Ringless Voicemail',
      icon: MicrophoneIcon,
      usage: RVM_USAGE,
      unit: 'rvm units',
      unitPrice: RVM_UNIT_PRICE,
      subtotal: RVM_USAGE * RVM_UNIT_PRICE,
    },
    {
      label: 'Emails',
      description: 'Outbound emails sent',
      icon: EnvelopeIcon,
      usage: EMAIL_USAGE,
      unit: 'emails',
      unitPrice: EMAIL_UNIT_PRICE,
      subtotal: EMAIL_USAGE * EMAIL_UNIT_PRICE,
    },
    {
      label: 'Other Integrations',
      description: 'External API usage',
      icon: ChartBarIcon,
      usage: 1,
      unit: 'various',
      unitPrice: OTHER_INTEGRATIONS,
      subtotal: OTHER_INTEGRATIONS,
    },
  ];

  const total = items.reduce((sum, item) => sum + (typeof item.subtotal === 'number' ? item.subtotal : 0), 0);

  return (
    <DashboardLayout title="Billing & Usage">
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Summary */}
        <section className="nextprop-card bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Current Bill</h2>
              <div className="text-gray-500 text-sm">June 1 – June 30, 2024</div>
            </div>
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-10 w-10 text-purple-500" />
              <span className="text-4xl font-bold text-purple-800">${total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Usage Balance */}
        <section className="nextprop-card bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 shadow p-6 rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Usage Balance</h2>
              <div className="text-gray-600 text-sm mb-3">For pay-as-you-go services</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-purple-800">${currentBalance.toLocaleString()}</span>
                <span className="ml-2 text-sm text-gray-500">available</span>
              </div>
              {currentBalance < autoRechargeThreshold && autoRechargeEnabled && (
                <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md inline-block">
                  Auto-recharge will occur when balance falls below ${autoRechargeThreshold}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 bg-white bg-opacity-50 p-4 rounded-lg border border-purple-100">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recharge Amount</label>
                <div className="flex items-center">
                  <span className="text-gray-500 border border-r-0 rounded-l-md px-3 py-2 bg-gray-50">$</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(Number(e.target.value))}
                    className="border rounded-r-md px-3 py-2 w-full"
                    min="10"
                    step="10"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button 
                  className="nextprop-primary-button flex-1 py-2 px-4"
                  onClick={handleRecharge}
                  disabled={isRecharging}
                >
                  {isRecharging ? 'Processing...' : 'Recharge Now'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Auto-Recharge Settings */}
        {/* <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
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
        </section> */}

        {/* Price Breakdown */}
        <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900">Price Breakdown</h2>
          <div className="divide-y divide-gray-100 bg-white bg-opacity-75 rounded-lg overflow-hidden border border-gray-100">
            {items.map((item, idx) => (
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

        {/* Payment Method (Mock) */}
        <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Payment Method</h2>
          <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200">
                <CreditCardIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <span className="font-medium block">Visa ending in 1234</span>
                <span className="text-gray-500 text-sm">Exp 08/26</span>
              </div>
            </div>
            <button className="nextprop-outline-button py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">Update Payment Method</button>
          </div>
        </section>

        {/* Billing Contact (Mock) */}
        <section className="nextprop-card border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Billing Contact</h2>
          <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200">
                <EnvelopeIcon className="h-6 w-6 text-gray-600" />
              </div>
              <span className="font-medium">billing@yourcompany.com</span>
            </div>
            <button className="nextprop-outline-button py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">Update Email</button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 