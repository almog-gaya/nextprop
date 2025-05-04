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
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Summary */}
        <section className="nextprop-card bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-900 mb-1">Current Bill</h2>
              <div className="text-gray-500 text-sm">June 1 – June 30, 2024</div>
            </div>
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
              <span className="text-3xl font-bold text-purple-800">${total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="nextprop-card border border-gray-200 shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Price Breakdown</h2>
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={item.label} className="flex items-center py-4">
                <div className="flex-shrink-0 mr-4">
                  <item.icon className="h-8 w-8 text-purple-400" />
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
            <div className="flex items-center py-4 font-bold text-purple-900 text-lg">
              <div className="flex-1 text-right pr-4">Total</div>
              <div className="w-28 text-right">${total.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* Payment Method (Mock) */}
        <section className="nextprop-card border border-gray-200 shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Payment Method</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCardIcon className="h-6 w-6 text-gray-400" />
              <span className="font-medium">Visa ending in 1234</span>
              <span className="text-gray-500 text-sm">Exp 08/26</span>
            </div>
            <button className="nextprop-outline-button">Update Payment Method</button>
          </div>
        </section>

        {/* Billing Contact (Mock) */}
        <section className="nextprop-card border border-gray-200 shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Billing Contact</h2>
          <div className="flex items-center justify-between">
            <span>billing@yourcompany.com</span>
            <button className="nextprop-outline-button">Update Email</button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 