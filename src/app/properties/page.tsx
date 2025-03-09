'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

// Define response types
interface ContactData {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface OriginalContactData {
  name: string;
  email: string;
  phone: string;
  address: {
    line: string;
    city: string;
    state_code: string;
    postal_code: string;
  };
}

interface PipelineData {
  success: boolean;
  message?: string;
  opportunity?: any;
  error?: string;
}

interface ScrapedContactResult {
  success: boolean;
  index: number;
  contact?: ContactData;
  originalContact?: OriginalContactData;
  pipeline?: PipelineData;
  error?: string;
}

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('Miami property under $1,000,000');
  const [isScraping, setIsScraping] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [completionMessage, setCompletionMessage] = useState<{ title: string; message: string; actions: { label: string; href: string }[] } | null>(null);

  // Generate leads for multiple properties (default 100)
  const handleScrapeContacts = async () => {
    setIsScraping(true);
    setProgressPercentage(0);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailureCount(0);
    setCurrentStatus('');
    setCompletionMessage(null);

    try {
      // Start the scraping process
      setCurrentStatus('Starting contact generation...');
      
      // Call the API to start processing
      const startResponse = await fetch('/api/contacts/scrape-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 100, delayMs: 500 }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(`Failed to start contact scraping: ${errorData.error || startResponse.statusText}`);
      }

      // Process batches of data
      let startIndex = 0;
      const batchSize = 5; // Smaller batch size
      const totalContacts = 100;
      let allResults: ScrapedContactResult[] = [];
      
      // Record pipeline failures for reporting
      let pipelineFailures = 0;

      while (startIndex < totalContacts) {
        setCurrentStatus(`Processing contacts ${startIndex + 1}-${Math.min(startIndex + batchSize, totalContacts)} of ${totalContacts}...`);
        
        // Fetch the next batch
        const batchResponse = await fetch(`/api/contacts/scrape-contacts?startIndex=${startIndex}&batchSize=${batchSize}`);
        
        if (!batchResponse.ok) {
          const errorData = await batchResponse.json();
          throw new Error(`Failed to process contact batch: ${errorData.error || batchResponse.statusText}`);
        }
        
        const batchData = await batchResponse.json();
        console.log(`Batch ${startIndex}-${batchData.endIndex} results:`, batchData);
        
        // Track successful and failed contacts
        const batchSuccesses = batchData.results.filter((r: {success: boolean}) => r.success).length;
        const batchFailures = batchData.results.filter((r: {success: boolean}) => !r.success).length;
        
        // Count pipeline failures (contacts created but failed to add to pipeline)
        const batchPipelineFailures = batchData.results.filter((r: ScrapedContactResult) => 
          r.success && r.pipeline && !r.pipeline.success
        ).length;
        pipelineFailures += batchPipelineFailures;
        
        // Update counts
        setSuccessCount(prev => prev + batchSuccesses);
        setFailureCount(prev => prev + batchFailures);
        setProcessedCount(prev => prev + batchData.results.length);
        
        // Calculate progress
        const newProgressPercentage = Math.round(((startIndex + batchData.results.length) / totalContacts) * 100);
        setProgressPercentage(newProgressPercentage);
        
        // Update results
        allResults = [...allResults, ...batchData.results];
        
        // Move to next batch
        startIndex = batchData.endIndex;
      }

      // Calculate final success rate
      const totalSuccessful = allResults.filter((r: ScrapedContactResult) => r.success).length;
      const totalFailed = allResults.filter((r: ScrapedContactResult) => !r.success).length;
      const successRate = Math.round((totalSuccessful / totalContacts) * 100);

      // Set completion message based on results
      if (pipelineFailures > 0) {
        setCurrentStatus(`Completed processing ${totalContacts} contacts. ${totalSuccessful} contacts created, but ${pipelineFailures} failed to add to pipeline.`);
      } else {
        setCurrentStatus(`Completed processing ${totalContacts} contacts. ${totalSuccessful} successful, ${totalFailed} failed (${successRate}% success rate).`);
      }
      
      // Set appropriate completion message
      if (totalSuccessful > 0) {
        setCompletionMessage({
          title: "Contact Generation Complete",
          message: `${totalSuccessful} contacts have been created${pipelineFailures === 0 ? ' and added to the leads pipeline' : ''}.
                   ${pipelineFailures > 0 ? `${pipelineFailures} contacts failed to be added to the pipeline.` : ''}
                   ${totalFailed > 0 ? `${totalFailed} contacts failed to be created (${successRate}% success rate).` : ''}`,
          actions: [
            {
              label: "View Contacts",
              href: "/contacts"
            },
            {
              label: "Check Pipeline",
              href: "/opportunities"
            }
          ]
        });
      } else {
        setCompletionMessage({
          title: "Contact Generation Failed",
          message: "No contacts were created successfully. See console logs for details.",
          actions: []
        });
      }
    } catch (error) {
      console.error('Error generating contacts:', error);
      setProgressPercentage(0);
      setCurrentStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCompletionMessage({
        title: "Contact Generation Failed",
        message: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        actions: []
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Generate a single lead for testing
  const handleGenerateSingleLead = async () => {
    setIsScraping(true);
    setProgressPercentage(0);
    setCurrentStatus('Generating a single lead for testing...');
    setCompletionMessage(null);

    try {
      // Start with POST to initialize
      const startResponse = await fetch('/api/contacts/scrape-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 1, delayMs: 100 }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(`Failed to start contact generation: ${errorData.error || startResponse.statusText}`);
      }

      // Fetch single contact
      const response = await fetch('/api/contacts/scrape-contacts?startIndex=0&batchSize=1');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate test lead: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Test lead generation result:", data);
      
      // Check if successful
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        
        if (result.success) {
          setProgressPercentage(100);
          
          // Check pipeline status
          if (result.pipeline && result.pipeline.success) {
            setCurrentStatus('Test lead generated successfully and added to pipeline!');
          } else {
            const pipelineError = result.pipeline?.error || 'Unknown pipeline error';
            setCurrentStatus(`Test lead created but failed to add to pipeline: ${pipelineError}`);
          }
          
          setCompletionMessage({
            title: "Test Lead Generated",
            message: `Lead was created with ID: ${result.contact?.id || 'Unknown'}. ${result.pipeline?.success ? 'Successfully added to pipeline.' : 'Failed to add to pipeline.'}`,
            actions: [
              {
                label: "View Contact",
                href: "/contacts"
              },
              {
                label: "Check Pipeline",
                href: "/opportunities"
              }
            ]
          });
        } else {
          throw new Error(`Failed to create test lead: ${result.error || 'Unknown error'}`);
        }
      } else {
        throw new Error('No results returned from API');
      }
    } catch (error) {
      console.error('Error generating test lead:', error);
      setProgressPercentage(0);
      setCurrentStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCompletionMessage({
        title: "Test Lead Generation Failed",
        message: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        actions: []
      });
    } finally {
      setIsScraping(false);
    }
  };

  // New function to check authentication
  const checkAuthentication = async () => {
    try {
      setCurrentStatus('Checking authentication...');
      setIsScraping(true);
      setProgressPercentage(30);
      
      const response = await fetch('/api/contacts/auth-check');
      const data = await response.json();
      
      console.log('Auth check result:', data);
      
      if (data.status === 'success') {
        // If we have pipelines, log them
        if (data.pipelines && data.pipelines.length > 0) {
          // Find the Leads pipeline if it exists
          const leadsPipeline = data.pipelines.find((p: any) => 
            p.name.toLowerCase().includes('lead') || 
            p.name.toLowerCase().includes('opportunity')
          );
          
          let message = `Authentication successful! Found ${data.pipelines.length} pipelines.`;
          
          if (leadsPipeline) {
            message += ` Recommended Pipeline ID: ${leadsPipeline.id}`;
            
            // If we have stages, recommend the first stage
            if (leadsPipeline.stages && leadsPipeline.stages.length > 0) {
              message += `, First Stage ID: ${leadsPipeline.stages[0].id}`;
            }
          }
          
          setCurrentStatus(message);
          setProgressPercentage(100);
          
          setCompletionMessage({
            title: "Authentication Check Successful",
            message: message,
            actions: []
          });
        } else {
          setCurrentStatus('Authentication successful, but no pipelines found.');
          setProgressPercentage(100);
          
          setCompletionMessage({
            title: "Authentication Check Successful",
            message: "You are authenticated but no pipelines were found. Please create a pipeline in GHL first.",
            actions: []
          });
        }
      } else {
        setCurrentStatus(`Authentication failed: ${data.message}`);
        setProgressPercentage(100);
        
        setCompletionMessage({
          title: "Authentication Check Failed",
          message: `Error: ${data.message}. Auth status: ${JSON.stringify(data.auth)}`,
          actions: []
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setCurrentStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgressPercentage(100);
      
      setCompletionMessage({
        title: "Authentication Check Failed",
        message: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        actions: []
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <DashboardLayout title="Properties">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg mb-8">
          <div className="p-6 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-3">Generate Leads Automatically</h2>
            <p className="mb-4">
              Need more leads? Our AI can generate 100 realistic property buyer contacts with just one click. All contacts are automatically added to your "Review New Lead" pipeline stage.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Find Properties</h2>

          {/* Search Input and Generate Button */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                  placeholder="Enter property search criteria"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleScrapeContacts}
                  disabled={isScraping}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm text-white font-medium ${
                    isScraping ? 'bg-gray-500' : 'bg-purple-700 hover:bg-purple-800'
                  }`}
                >
                  {isScraping ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5" />
                      Generate 100 Leads
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleGenerateSingleLead}
                  disabled={isScraping}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Test (1 Lead)
                </button>
                
                <button
                  onClick={checkAuthentication}
                  disabled={isScraping}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm bg-blue-50 border border-blue-300 text-blue-700 font-medium hover:bg-blue-100"
                >
                  Check Auth
                </button>
              </div>
            </div>
          </div>

          {/* Completion Message */}
          {completionMessage && (
            <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md text-sm text-green-700">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium mb-1">{completionMessage.title}</p>
                  <p>{completionMessage.message}</p>
                  {completionMessage.actions.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      {completionMessage.actions.map((action, index) => (
                        <a 
                          key={index}
                          href={action.href}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          {action.label} →
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Scraping Status Modal */}
        {isScraping && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Generating Contacts</h3>
              
              <div className="mb-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-gray-600">
                    {processedCount} contacts processed
                  </span>
                  <span className="text-sm font-medium">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                    <span>Successful</span>
                  </div>
                  <span className="font-medium">{successCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                    <span>Failed</span>
                  </div>
                  <span className="font-medium">{failureCount}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>{currentStatus}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  onClick={() => setIsScraping(false)}
                  disabled={progressPercentage < 100}
                >
                  {progressPercentage < 100 ? 'Processing...' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 