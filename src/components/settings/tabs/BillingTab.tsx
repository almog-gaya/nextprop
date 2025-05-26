import { useState, useEffect } from "react";
import { CurrencyDollarIcon, PhoneIcon, MicrophoneIcon, EnvelopeIcon, ChartBarIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { getBillingUsage, type UsageData, type CustomerData, getSubscription, UsageResult } from "@/lib/billingService";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingTab() {
  const { user } = useAuth();
  // State management
  const [phoneNumberCount, setPhoneNumberCount] = useState<number>(0);
  const [billingData, setBillingData] = useState<UsageResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isManagingBilling, setIsManagingBilling] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Fetch billing data on component mount
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.locationId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get current date and first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const data = await getBillingUsage(user.locationId);

        setBillingData(data);
        setStartDate(data.startDate);
        setEndDate(data.endDate);
        setCustomer(data.customer);
      } catch (err) {
        console.error("Error fetching billing data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch billing data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.locationId]);

  // Fetch phone numbers count on component mount
  useEffect(() => {
    fetch("/api/voicemail/phone-numbers")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.numbers)) {
          setPhoneNumberCount(data.numbers.length);
        }
      })
      .catch((err) => {
        console.error("Could not fetch phone numbers:", err);
      });
  }, []);

  const handleManageBilling = async () => {
    try {
      setIsManagingBilling(true);
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user?.locationId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating portal session:", error);
      setError("Failed to open billing portal. Please try again.");
    } finally {
      setIsManagingBilling(false);
    }
  };

  // Calculate total bill
  const calculateTotal = () => {
    if (!billingData) return 0;

    return (
      billingData.base.price +
      billingData.usage.phone.totalPrice +
      billingData.usage.sms.totalPrice +
      billingData.usage.rvm.totalPrice +
      billingData.usage.email.totalPrice +
      billingData.usage.otherIntegrations
    );
  };

  if (isLoading) {
    return (
      <div className="nextprop-card">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nextprop-card">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleManageBilling}
            disabled={isManagingBilling}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            {isManagingBilling ? "Opening Portal..." : "Manage Billing"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nextprop-card">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary */}
        <section className="bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 shadow p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Current Bill</h2>
              <div className="text-gray-500 text-sm">
                {startDate && endDate ? (
                  `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`
                ) : (
                  "Loading billing period..."
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-10 w-10 text-purple-500" />
              <span className="text-4xl font-bold text-purple-800">${calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </section>
        {/* Current Subscription Status */}
        <section className="bg-white border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900">Subscription Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700">
                {billingData?.status === "active" ? "Active Subscription" : billingData?.status === "trialing" ? "Trial Period" : "No Active Subscription"}
              </p>
              {billingData?.status === "active" || billingData?.status === "trialing" && (
                <p className="text-sm text-gray-500">
                  Plan: {billingData.base.name} - ${billingData.base.price.toLocaleString()} / month
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Phone Numbers: {phoneNumberCount}</p>
            </div>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="border border-gray-200 shadow p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-5 text-gray-900">Price Breakdown</h2>
          <div className="divide-y divide-gray-100 bg-white bg-opacity-75 rounded-lg overflow-hidden border border-gray-100">
            {/* Base Fee Plan */}
            <div className="flex items-center py-4 px-4 hover:bg-gray-50">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <CreditCardIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Base Fee</div>
                <div className="text-gray-500 text-xs">Monthly subscription fee</div>
              </div>
              <div className="hidden md:block w-32 text-center text-gray-700">{billingData ? billingData.base.name : "—"}</div>
              <div className="w-24 text-right text-gray-700">${billingData ? billingData.base.price : "-"}</div>
              <div className="w-28 text-right font-semibold text-gray-900">
                ${billingData ? billingData.base.price.toLocaleString() : "—"}
              </div>
            </div>

            {/* Phone Numbers */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <PhoneIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Phone Numbers</div>
                  <div className="text-gray-500 text-xs">Active numbers on your account</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">{billingData.usage.phone.total} numbers</div>
                <div className="w-24 text-right text-gray-700">${billingData.usage.phone.unitPrice.toFixed(2)}</div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.phone.totalPrice.toLocaleString()}</div>
              </div>
            )}

            {/* SMS */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <PhoneIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-gray-500 text-xs">Outbound messages</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">{billingData.usage.sms.total.toLocaleString()} SMS</div>
                <div className="w-24 text-right text-gray-700">${billingData.usage.sms.unitPrice.toFixed(3)}</div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.sms.totalPrice.toLocaleString()}</div>
              </div>
            )}
            {/* AI SMS */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <PhoneIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">AI SMS</div>
                  <div className="text-gray-500 text-xs">AI-assisted messages</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">
                  {billingData.usage.aiSms.total.toLocaleString()} AI SMS
                </div>
                <div className="w-24 text-right text-gray-700">${billingData.usage.aiSms.unitPrice.toFixed(3)}</div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.aiSms.totalPrice.toLocaleString()}</div>
              </div>
            )}

            {/* RVM */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <MicrophoneIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">RVM</div>
                  <div className="text-gray-500 text-xs">Ringless Voicemail</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">
                  {billingData.usage.rvm.total.toLocaleString()} rvm units
                </div>
                <div className="w-24 text-right text-gray-700">${billingData.usage.rvm.unitPrice.toFixed(3)}</div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.rvm.totalPrice.toLocaleString()}</div>
              </div>
            )}

            {/* Emails */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Emails</div>
                  <div className="text-gray-500 text-xs">Outbound emails sent</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">
                  {billingData.usage.email.total.toLocaleString()} emails
                </div>
                <div className="w-24 text-right text-gray-700">${billingData.usage.email.unitPrice.toFixed(3)}</div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.email.totalPrice.toLocaleString()}</div>
              </div>
            )}

            {/* Other Integrations */}
            {billingData && (
              <div className="flex items-center py-4 px-4 hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Other Integrations</div>
                  <div className="text-gray-500 text-xs">External API usage</div>
                </div>
                <div className="hidden md:block w-32 text-center text-gray-700">—</div>
                <div className="w-24 text-right text-gray-700"></div>
                <div className="w-28 text-right font-semibold text-gray-900">${billingData.usage.otherIntegrations.toLocaleString()}</div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center py-4 px-4 font-bold text-purple-900 text-lg bg-purple-50">
              <div className="flex-1 text-right pr-4">Total</div>
              <div className="w-28 text-right">${calculateTotal().toLocaleString()}</div>
            </div>
          </div>
        </section>

        <div className="mt-6 text-center">
          <button
            onClick={handleManageBilling}
            disabled={isManagingBilling}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            {isManagingBilling ? "Opening Portal..." : "Manage Billing"}
          </button>
        </div>
      </div>
    </div>
  );
}
