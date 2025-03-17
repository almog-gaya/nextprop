'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, CheckIcon } from 'lucide-react';

export default function ManualVoicemailPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [recipient, setRecipient] = useState({
    firstName: '',
    phone: '',
    streetName: 'your area'
  });
  const [script, setScript] = useState('');
  
  // Generate default script with placeholders
  const generateDefaultScript = () => {
    setScript(`Hi {{first_name}}, this is ${user?.firstName || 'Adforce'} from NextProp. I noticed you might be interested in properties in your area. I've got some great listings on {{street_name}} that match your criteria. Call me back when you have a chance and we can discuss your needs. Thanks!`);
  };
  
  useEffect(() => {
    generateDefaultScript();
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    if (!script.trim()) {
      toast.error('Voicemail script is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Personalize the script
      const personalizedScript = script
        .replace(/{{first_name}}/g, recipient.firstName || 'there')
        .replace(/{{street_name}}/g, recipient.streetName || 'your area');
      
      // Send the voicemail
      const response = await axios.post('/api/voicemail', {
        message: personalizedScript,
        phone: recipient.phone,
        first_name: recipient.firstName,
        street_name: recipient.streetName
      });
      
      toast.success('Voicemail sent successfully');
      setSent(true);
    } catch (error) {
      console.error('Error sending voicemail:', error);
      toast.error('Failed to send voicemail');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setSent(false);
    setRecipient({
      firstName: '',
      phone: '',
      streetName: 'your area'
    });
    generateDefaultScript();
  };
  
  return (
    <DashboardLayout title="Send Manual Voicemail">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center mb-6">
          <Link href="/ringless-voicemails" className="mr-4 text-purple-600 hover:text-purple-800">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            Send Manual Voicemail
          </h2>
        </div>
        
        {sent ? (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Voicemail Sent Successfully</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your voicemail has been sent to {recipient.firstName || 'your recipient'} at {recipient.phone}.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Send Another Voicemail
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recipient Information
                </h3>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        autoComplete="given-name"
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={recipient.firstName}
                        onChange={(e) => setRecipient({ ...recipient, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        required
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="+1 (555) 123-4567"
                        value={recipient.phone}
                        onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter phone number in international format (e.g., +1 for US)
                    </p>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="streetName" className="block text-sm font-medium text-gray-700">
                      Property Street/Area
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="streetName"
                        id="streetName"
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={recipient.streetName}
                        onChange={(e) => setRecipient({ ...recipient, streetName: e.target.value })}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Used to personalize the message (e.g., "properties on Maple Street")
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Voicemail Script
                  </h3>
                  <button
                    type="button"
                    onClick={generateDefaultScript}
                    className="text-sm text-purple-600 hover:text-purple-500"
                  >
                    Reset to Default
                  </button>
                </div>
                
                <div className="mt-4">
                  <textarea
                    id="script"
                    name="script"
                    rows={8}
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Use {'{{'}'first_name'{'}}'}' and {'{{'}'street_name'{'}}'}' as placeholders for personalization
                </p>
                
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                  <p className="text-sm text-gray-600">
                    {script
                      .replace(/{{first_name}}/g, recipient.firstName || '[First Name]')
                      .replace(/{{street_name}}/g, recipient.streetName || '[Street Name]')}
                  </p>
                </div>
              </div>
              
              <div className="px-4 py-4 sm:px-6 flex justify-end">
                <Link
                  href="/ringless-voicemails"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-3"
                >
                  Cancel
                </Link>
                
                <button
                  type="submit"
                  disabled={loading || !recipient.phone.trim() || !script.trim()}
                  className={`${
                    loading || !recipient.phone.trim() || !script.trim()
                      ? 'bg-purple-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Voicemail'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 