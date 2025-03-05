'use client';

import { useState, useEffect } from 'react';

export default function TwilioDemoPage() {
  // Business state
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification state
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [verificationSid, setVerificationSid] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  
  // SMS state
  const [smsTo, setSmsTo] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsSid, setSmsSid] = useState<string | null>(null);
  
  // Load businesses on component mount
  useEffect(() => {
    loadBusinesses();
  }, []);
  
  async function loadBusinesses() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/businesses');
      
      if (!response.ok) {
        throw new Error(`Error fetching businesses: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
      setError(err.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName,
          contact_email: businessEmail,
          phone_number: businessPhone,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBusinesses([data.business, ...businesses]);
      
      // Reset form
      setBusinessName('');
      setBusinessEmail('');
      setBusinessPhone('');
      
      alert('Business created successfully!');
    } catch (err: any) {
      console.error('Failed to create business:', err);
      setError(err.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSendVerification(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedBusiness) {
      setError('Please select a business first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setVerificationStatus(null);
      setVerificationSid(null);
      
      const response = await fetch(`/api/businesses/${selectedBusiness}/verify/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: verifyPhone,
          channel: 'sms',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVerificationStatus(data.status);
      setVerificationSid(data.sid);
      
      alert(`Verification code sent to ${verifyPhone}!`);
    } catch (err: any) {
      console.error('Failed to send verification:', err);
      setError(err.message || 'Failed to send verification');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCheckVerification(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedBusiness) {
      setError('Please select a business first');
      return;
    }
    
    if (!verificationSid) {
      setError('Please send a verification code first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setVerificationResult(null);
      
      const response = await fetch(`/api/businesses/${selectedBusiness}/verify/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: verifyPhone,
          code: verifyCode,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setVerificationResult('Verification successful! Phone number is verified.');
      } else {
        setVerificationResult(`Verification failed. Status: ${data.status}`);
      }
    } catch (err: any) {
      console.error('Failed to check verification:', err);
      setError(err.message || 'Failed to check verification');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSendSMS(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSmsSent(false);
      setSmsSid(null);
      
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: smsTo,
          body: smsBody,
          businessId: selectedBusiness || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSmsSent(true);
      setSmsSid(data.sid);
      
      alert(`SMS sent to ${smsTo}!`);
      
      // Reset form
      setSmsBody('');
    } catch (err: any) {
      console.error('Failed to send SMS:', err);
      setError(err.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Twilio Integration Demo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Management */}
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Business Management</h2>
          
          <form onSubmit={handleCreateBusiness} className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Phone Number (E.164)</label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </form>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Select Business</h3>
            {businesses.length === 0 ? (
              <p className="text-gray-500">No businesses created yet.</p>
            ) : (
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Select a Business --</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Phone Verification */}
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Phone Verification</h2>
          
          <form onSubmit={handleSendVerification} className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Phone Number (E.164)</label>
              <input
                type="tel"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !selectedBusiness}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
          
          {verificationStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
              <p>Status: <span className="font-medium">{verificationStatus}</span></p>
              <p className="text-xs text-gray-500">SID: {verificationSid}</p>
            </div>
          )}
          
          <form onSubmit={handleCheckVerification}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Verification Code</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !verificationSid || !selectedBusiness}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Verification Code'}
            </button>
          </form>
          
          {verificationResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded">
              <p>{verificationResult}</p>
            </div>
          )}
        </div>
        
        {/* Send SMS */}
        <div className="border p-4 rounded shadow-sm md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Send SMS</h2>
          
          <form onSubmit={handleSendSMS}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">To (E.164)</label>
              <input
                type="tel"
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
                placeholder="+15551234567"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send SMS'}
            </button>
          </form>
          
          {smsSent && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded">
              <p>SMS sent successfully!</p>
              <p className="text-xs text-gray-500">SID: {smsSid}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 