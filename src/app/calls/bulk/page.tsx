'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PhoneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import BulkUploadForm from '@/components/BulkUploadForm';
import Link from 'next/link';
import { makeAutomatedCall } from '@/lib/callService';
import { CallData } from '@/components/AutomatedCallForm';

interface BulkContact {
  name: string;
  phone: string;
  street_name: string;
}

export default function BulkCallsPage() {
  const [selectedContacts, setSelectedContacts] = useState<BulkContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string>('');

  const handleContactsSelect = (contacts: BulkContact[]) => {
    setSelectedContacts(contacts);
    setShowContactForm(false);
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
  };

  const handleGenerateDefaultScript = () => {
    setScript("{{first_name}}! Hey, it's Rey here, I just called you regarding your property at {{street_name}}, I believe it could be a good fit for us, of course, a cash offer and a quick closing. Let me know when's a good time to call you again!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!script) {
      setError('Please fill in the script field.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // Process each contact sequentially
      for (const contact of selectedContacts) {
        try {
          // Replace placeholders with actual values
          const firstName = contact.name.split(' ')[0];
          const personalizedScript = script
            .replace(/{{first_name}}/g, firstName)
            .replace(/{{street_name}}/g, contact.street_name);
          
          const callData: CallData = {
            first_name: firstName,
            phone: contact.phone,
            street_name: contact.street_name,
            script: personalizedScript
          };
          
          await makeAutomatedCall(callData);
          successCount++;
        } catch (err) {
          console.error('Error sending voicemail to', contact.name, ':', err);
          failedCount++;
        }
        
        // Update the results after each call
        setResults({
          success: successCount,
          failed: failedCount
        });
      }
    } catch (err) {
      console.error('Error in bulk sending:', err);
      setError('An error occurred during bulk sending. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    setShowContactForm(true);
    setResults({ success: 0, failed: 0 });
  };
  
  return (
    <DashboardLayout title="Bulk Voicemail Sending">
      <div className="mb-4">
        <Link 
          href="/calls" 
          className="inline-flex items-center text-sm text-[#7c3aed] hover:text-[#6d28d9]"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Calls
        </Link>
      </div>
      
      {showContactForm ? (
        <BulkUploadForm 
          onContactsSelect={handleContactsSelect} 
          isLoading={isSubmitting} 
        />
      ) : (
        <div className="nextprop-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#1e1b4b]">Send Bulk Voicemails</h3>
            <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
              <PhoneIcon className="w-5 h-5" />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-700">Selected Contacts</h4>
              <button 
                type="button" 
                onClick={handleBack}
                className="text-sm text-[#7c3aed] hover:text-[#6d28d9]"
              >
                Change Selection
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {selectedContacts.length} contacts will receive voicemails
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                    Voicemail Script
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDefaultScript}
                    className="text-xs text-[#7c3aed]"
                  >
                    Generate Default
                  </button>
                </div>
                <textarea
                  id="script"
                  name="script"
                  required
                  value={script}
                  onChange={handleScriptChange}
                  placeholder="Enter your script. Use {{first_name}} and {{street_name}} as placeholders."
                  className="nextprop-input py-2 px-3 w-full rounded-md"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{'}'first_name'{'}}'}' and {'{{'}'street_name'{'}}'}' as placeholders for personalization
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 p-4 rounded-md text-red-800">
                  <p>{error}</p>
                </div>
              )}
              
              {(results.success > 0 || results.failed > 0) && (
                <div className={`p-4 rounded-md ${results.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <h4 className="font-medium text-gray-900 mb-2">Sending Results</h4>
                  <p className="text-sm">
                    <span className="text-green-700">{results.success} successful</span>
                    {results.failed > 0 && (
                      <span className="text-red-700 ml-3">{results.failed} failed</span>
                    )}
                  </p>
                  {isSubmitting && (
                    <p className="text-xs text-gray-500 mt-1">
                      Processing... ({results.success + results.failed} of {selectedContacts.length} completed)
                    </p>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="nextprop-button w-full flex justify-center items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Voicemails ({results.success + results.failed}/{selectedContacts.length})...
                  </>
                ) : (
                  <>
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Send Voicemails to {selectedContacts.length} Contacts
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
} 