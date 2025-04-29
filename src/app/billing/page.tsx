import DashboardLayout from '@/components/DashboardLayout';
import { CreditCardIcon, CurrencyDollarIcon, ChartBarIcon, EnvelopeIcon, PhoneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

const mockBilling = {
  period: 'June 1 – June 30, 2024',
  total: 1253,
  items: [
    {
      label: 'Base Subscription',
      description: 'Platform access',
      icon: CurrencyDollarIcon,
      usage: 1,
      unit: 'fixed',
      unitPrice: 1000,
      subtotal: 1000,
    },
    {
      label: 'SMS',
      description: 'Outbound messages',
      icon: PhoneIcon,
      usage: 2000,
      unit: 'SMS',
      unitPrice: 0.01,
      subtotal: 20,
    },
    {
      label: 'RVM',
      description: 'Ringless Voicemail',
      icon: MicrophoneIcon,
      usage: 500,
      unit: 'rvm units',
      unitPrice: 0.05,
      subtotal: 25,
    },
    {
      label: 'Emails',
      description: 'Outbound emails sent',
      icon: EnvelopeIcon,
      usage: 4000,
      unit: 'emails',
      unitPrice: 0.002,
      subtotal: 8,
    },
    {
      label: 'Other Integrations',
      description: 'External API usage',
      icon: ChartBarIcon,
      usage: 1,
      unit: 'various',
      unitPrice: 200,
      subtotal: 200,
    },
  ],
};

export default function BillingPage() {
  return (
    <DashboardLayout title="Billing & Usage">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Summary */}
        <section className="nextprop-card bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-900 mb-1">Current Bill</h2>
              <div className="text-gray-500 text-sm">{mockBilling.period}</div>
            </div>
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
              <span className="text-3xl font-bold text-purple-800">${mockBilling.total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="nextprop-card border border-gray-200 shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Price Breakdown</h2>
          <div className="divide-y divide-gray-100">
            {mockBilling.items.map((item, idx) => (
              <div key={item.label} className="flex items-center py-4">
                <div className="flex-shrink-0 mr-4">
                  <item.icon className="h-8 w-8 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-gray-500 text-xs">{item.description}</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">
                  {item.unit === 'fixed' ? '—' : `${item.usage.toLocaleString()} ${item.unit}`}
                </div>
                <div className="w-24 text-right text-gray-700">
                  {item.unit === 'fixed' ? '' : `$${item.unitPrice.toFixed(3)}`}
                </div>
                <div className="w-28 text-right font-semibold text-gray-900">
                  ${item.subtotal.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="flex items-center py-4 font-bold text-purple-900 text-lg">
              <div className="flex-1 text-right pr-4">Total</div>
              <div className="w-28 text-right">${mockBilling.total.toLocaleString()}</div>
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