'use client';

import { useState, useEffect } from 'react';
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
  const [results, setResults] = useState<{ success: number; failed: number; pending: number }>({ 
    success: 0, 
    failed: 0,
    pending: 0 
  });
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string>('');
  const [delayBetweenCalls, setDelayBetweenCalls] = useState<number>(5);
  const [dailyLimit, setDailyLimit] = useState<number>(50);
  const [campaignStatus, setCampaignStatus] = useState<'not_started' | 'in_progress' | 'paused' | 'completed'>('not_started');
  const [currentBatchProgress, setCurrentBatchProgress] = useState<number>(0);

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

  const calculateEstimatedCompletion = () => {
    if (selectedContacts.length === 0) return 'N/A';
    
    const remainingContacts = selectedContacts.length - (results.success + results.failed);
    const totalMinutes = remainingContacts * delayBetweenCalls;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else if (totalMinutes < 24 * 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes ? `${minutes} minutes` : ''}`;
    } else {
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      return `${days} day${days !== 1 ? 's' : ''} ${hours ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDelayBetweenCalls(parseInt(e.target.value, 10));
  };
  
  const handleDailyLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDailyLimit(parseInt(e.target.value, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!script) {
      setError('Please fill in the script field.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setCampaignStatus('in_progress');
    
    let successCount = 0;
    let failedCount = 0;
    let pendingCount = selectedContacts.length;
    
    try {
      // Process each contact sequentially with delay
      for (let i = 0; i < selectedContacts.length; i++) {
        const contact = selectedContacts[i];

        // Check if we've hit the daily limit
        if (i > 0 && i % dailyLimit === 0) {
          // Display a message about daily limit reached
          setError(`Daily limit of ${dailyLimit} reached. Remaining voicemails will be sent tomorrow.`);
          // Set the pending count
          pendingCount = selectedContacts.length - i;
          setResults({
            success: successCount,
            failed: failedCount,
            pending: pendingCount
          });
          break;
        }
        
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
          pendingCount--;
        } catch (err) {
          console.error('Error sending voicemail to', contact.name, ':', err);
          failedCount++;
          pendingCount--;
        }
        
        // Update the results after each call
        setResults({
          success: successCount,
          failed: failedCount,
          pending: pendingCount
        });
        
        // Update batch progress percentage for current batch
        setCurrentBatchProgress(Math.min(100, Math.round((i + 1) / Math.min(dailyLimit, selectedContacts.length) * 100)));
        
        // Add delay between calls (only if not the last contact)
        if (i < selectedContacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenCalls * 60 * 1000));
        }
      }
      
      if (results.pending === 0) {
        setCampaignStatus('completed');
      }
    } catch (err) {
      console.error('Error in bulk sending:', err);
      setError('An error occurred during bulk sending. Please try again.');
    } finally {
      if (results.pending === 0) {
        setIsSubmitting(false);
        setCampaignStatus('completed');
      } else {
        setCampaignStatus('paused');
      }
    }
  };
  
  const handlePauseResume = () => {
    if (campaignStatus === 'in_progress') {
      setCampaignStatus('paused');
    } else if (campaignStatus === 'paused') {
      setCampaignStatus('in_progress');
      // Logic to resume sending would go here
    }
  };
  
  const handleBack = () => {
    setShowContactForm(true);
    setResults({ success: 0, failed: 0, pending: 0 });
  };
  
  return (
    <DashboardLayout title="Bulk Voicemail Sending">
      <div className="m-6">
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
        <div className="space-y-6">
          <div className="nextprop-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1e1b4b]">Send Bulk Voicemails</h3>
              <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
                <PhoneIcon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mb-6 border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">Selected Contacts</h4>
                {!isSubmitting && (
                  <button 
                    type="button" 
                    onClick={handleBack}
                    className="text-sm text-[#7c3aed] hover:text-[#6d28d9]"
                  >
                    Change Selection
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedContacts.length} contacts will receive voicemails
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Delivery settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="delay-between-calls" className="block text-sm font-medium text-gray-700 mb-2">
                      Delay Between Voicemails
                    </label>
                    <select
                      id="delay-between-calls"
                      className="nextprop-input w-full rounded-md shadow-sm"
                      value={delayBetweenCalls.toString()}
                      onChange={handleDelayChange}
                      disabled={isSubmitting}
                    >
                      <option value="1">1 minute</option>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Estimated completion time: {calculateEstimatedCompletion()}
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="daily-limit" className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Sending Limit
                    </label>
                    <select
                      id="daily-limit"
                      className="nextprop-input w-full rounded-md shadow-sm"
                      value={dailyLimit.toString()}
                      onChange={handleDailyLimitChange}
                      disabled={isSubmitting}
                    >
                      <option value="10">10 voicemails</option>
                      <option value="25">25 voicemails</option>
                      <option value="50">50 voicemails</option>
                      <option value="100">100 voicemails</option>
                      <option value="250">250 voicemails</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum voicemails to send per day
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                      Voicemail Script
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateDefaultScript}
                      className="text-xs text-[#7c3aed] hover:text-[#6d28d9]"
                      disabled={isSubmitting && campaignStatus !== 'paused'}
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
                    className="nextprop-input w-full rounded-md shadow-sm py-3 px-4"
                    rows={4}
                    disabled={isSubmitting && campaignStatus !== 'paused'}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use {'{{'}'first_name'{'}}'}' and {'{{'}'street_name'{'}}'}' as placeholders for personalization
                  </p>
                </div>
                
                {error && (
                  <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
                    <p>{error}</p>
                  </div>
                )}
                
                {(results.success > 0 || results.failed > 0 || results.pending > 0) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h4 className="font-medium text-[#1e1b4b] mb-4">Campaign Progress</h4>
                    
                    {/* Progress bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">Current Batch Progress</span>
                          <span className="text-[#7c3aed]">{currentBatchProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#7c3aed] h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${currentBatchProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">Overall Campaign Progress</span>
                          <span className="text-green-600">{Math.round((results.success + results.failed) / selectedContacts.length * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.round((results.success + results.failed) / selectedContacts.length * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="grid grid-cols-3 gap-4 mt-5 border-t border-gray-100 pt-5">
                      <div className="text-center">
                        <div className="text-green-600 font-semibold text-xl">{results.success}</div>
                        <div className="text-sm text-gray-500 mt-1">Delivered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-semibold text-xl">{results.failed}</div>
                        <div className="text-sm text-gray-500 mt-1">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-semibold text-xl">{results.pending}</div>
                        <div className="text-sm text-gray-500 mt-1">Pending</div>
                      </div>
                    </div>
                    
                    {isSubmitting && (
                      <div className="mt-4 flex items-center justify-center p-3 bg-blue-50 rounded-md border border-blue-100">
                        <svg className="animate-spin mr-2 h-4 w-4 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Next voicemail scheduled in {delayBetweenCalls} minute{delayBetweenCalls !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-4 pt-2">
                  {campaignStatus === 'not_started' ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 bg-[#7c3aed] text-white rounded-md shadow-sm hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] flex justify-center items-center"
                    >
                      <PhoneIcon className="w-5 h-5 mr-2" />
                      Start Campaign ({selectedContacts.length} Contacts)
                    </button>
                  ) : campaignStatus === 'in_progress' ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseResume}
                        className="flex-1 py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md shadow-sm flex justify-center items-center"
                      >
                        Pause Campaign
                      </button>
                      <div className="flex-1 bg-gray-100 rounded-md shadow-sm flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-5 w-5 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium">Campaign Running</span>
                        </div>
                      </div>
                    </>
                  ) : campaignStatus === 'paused' ? (
                    <button
                      type="button"
                      onClick={handlePauseResume}
                      className="flex-1 py-3 px-4 bg-[#7c3aed] text-white rounded-md shadow-sm hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] flex justify-center items-center"
                    >
                      Resume Campaign
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 bg-[#7c3aed] text-white rounded-md shadow-sm hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] flex justify-center items-center"
                    >
                      Create New Campaign
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 