"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  CheckIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { 
  startAutomation, 
  getAutomationStatus,
  cancelAutomation 
} from '@/lib/automationService';
import DashboardLayout from '@/components/DashboardLayout';
import { Pipeline } from '@/types';

// Brand color constants
const BRAND = {
  primary: 'rgb(79, 70, 229)', // indigo-600
  primaryHover: 'rgb(67, 56, 202)', // indigo-700
  primaryLight: 'rgb(224, 231, 255)', // indigo-100
  primaryLightHover: 'rgb(199, 210, 254)', // indigo-200
  secondary: 'rgb(16, 185, 129)', // emerald-500
  secondaryHover: 'rgb(5, 150, 105)', // emerald-600
  secondaryLight: 'rgb(209, 250, 229)', // emerald-100
  error: 'rgb(220, 38, 38)', // red-600
  errorHover: 'rgb(185, 28, 28)', // red-700
  errorLight: 'rgb(254, 226, 226)', // red-100
  gray: 'rgb(107, 114, 128)', // gray-500
  grayLight: 'rgb(243, 244, 246)', // gray-100
  grayDark: 'rgb(55, 65, 81)', // gray-700
  white: 'rgb(255, 255, 255)',
  black: 'rgb(17, 24, 39)', // gray-900
};

export default function AutomationsPage() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  
  const [propertyConfig, setPropertyConfig] = useState({
    searchQuery: '',
    propertyCount: 20,
    pipelineId: '',
    smsTemplate: {
      id: 'sms1',
      name: 'Property Alert SMS',
      message: 'Hi {{firstName}}, this is {{userName}} from NextProp. I\'m reaching out about your property. I noticed it\'s been on the market for 90+ days. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.'
    }
  });

  // Fetch pipelines on mount
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch('/api/pipelines');
        if (!response.ok) throw new Error('Failed to fetch pipelines');
        const data = await response.json();

        let pipelineData: Pipeline[] = [];
        if (Array.isArray(data) && data.length > 0) {
          pipelineData = data.map((pipeline: any) => ({
            id: pipeline.id,
            name: pipeline.name,
            stages: pipeline.stages || []
          }));
        } else if (data.pipelines && Array.isArray(data.pipelines)) {
          pipelineData = data.pipelines.map((pipeline: any) => ({
            id: pipeline.id,
            name: pipeline.name,
            stages: pipeline.stages || []
          }));
        } else {
          const extractedArrays = Object.values(data).filter(value =>
            Array.isArray(value) && value.length > 0 && value[0] && 'id' in value[0] && 'name' in value[0]
          );
          if (extractedArrays.length > 0) {
            pipelineData = (extractedArrays[0] as any[]).map((pipeline: any) => ({
              id: pipeline.id,
              name: pipeline.name,
              stages: pipeline.stages || []
            }));
          }
        }

        setPipelines(pipelineData);
      } catch (error) {
        console.error('Error fetching pipelines:', error);
        toast.error('Failed to load pipelines');
      } finally {
        setLoadingPipelines(false);
      }
    };

    fetchPipelines();
  }, []);

  // Load automation status from localStorage on mount
  useEffect(() => {
    const savedStatus = localStorage.getItem('propertyAutomationEnabled');
    if (savedStatus === 'true') {
      setIsAutomationEnabled(true);
    }
    
    const savedJobId = localStorage.getItem('activePropertyAutomationJob');
    if (savedJobId) {
      setActiveJobId(savedJobId);
      setIsJobRunning(true);
    }
  }, []);

  // Save automation status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('propertyAutomationEnabled', isAutomationEnabled.toString());
  }, [isAutomationEnabled]);

  // Poll for updates on active job
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const status = await getAutomationStatus(activeJobId);
        setJobStatus(status);

        // If the job is completed, remove it from active jobs
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          setTimeout(() => {
            setIsJobRunning(false);
            setActiveJobId(null);
            localStorage.removeItem('activePropertyAutomationJob');
          }, 5000); // Keep it visible for 5 seconds after completion
        }
      } catch (error) {
        console.error(`Error polling job:`, error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  // Handle input changes for property config
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For property count, enforce the maximum limit of 20
    if (name === 'propertyCount') {
      const count = parseInt(value, 10);
      const validCount = isNaN(count) ? 20 : Math.min(Math.max(1, count), 20);
      setPropertyConfig(prev => ({
        ...prev,
        [name]: validCount
      }));
    } else {
      setPropertyConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle SMS template change
  const handleSmsTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPropertyConfig(prev => ({
      ...prev,
      smsTemplate: {
        ...prev.smsTemplate,
        message: e.target.value
      }
    }));
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end, text.length);
    const newText = `${beforeText}{{${placeholder}}}${afterText}`;
    
    setPropertyConfig(prev => ({
      ...prev,
      smsTemplate: {
        ...prev.smsTemplate,
        message: newText
      }
    }));
    
    // Set focus back to textarea with cursor position after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + placeholder.length + 4; // +4 for {{ and }}
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Toggle automation on/off
  const toggleAutomation = () => {
    const newStatus = !isAutomationEnabled;
    setIsAutomationEnabled(newStatus);
    
    if (newStatus) {
      toast.success('Daily property automation enabled');
    } else {
      toast.error('Daily property automation disabled');
    }
  };

  // Start the automation job manually
  const handleRunNow = async () => {
    if (isJobRunning) return;
    
    if (!propertyConfig.searchQuery) {
      toast.error('Please enter a search query for properties');
      return;
    }

    if (!propertyConfig.pipelineId) {
      toast.error('Please select a pipeline');
      return;
    }

    toast.loading('Starting property automation...', { id: 'property-job' });
    setIsJobRunning(true);

    try {
      const result = await startAutomation(
        'Daily Property SMS Automation',
        'Automated property scraping and SMS sending',
        propertyConfig.searchQuery,
        propertyConfig.propertyCount,
        propertyConfig.pipelineId,
        ['sms'],
        'daily',
        propertyConfig.propertyCount
      );

      toast.success('Automation started successfully!', { id: 'property-job' });
      
      // Save job ID
      setActiveJobId(result.jobId);
      localStorage.setItem('activePropertyAutomationJob', result.jobId);
      
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automation', { id: 'property-job' });
      setIsJobRunning(false);
    }
  };

  // Cancel the running job
  const handleCancelJob = async () => {
    if (!activeJobId) return;
    
    try {
      await cancelAutomation(activeJobId);
      toast.success('Job cancelled successfully');
      
      setIsJobRunning(false);
      setActiveJobId(null);
      localStorage.removeItem('activePropertyAutomationJob');
      
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel job');
    }
  };

  return (
    <DashboardLayout title="Property Automation">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BuildingLibraryIcon className="h-7 w-7 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Daily Property Automation</h1>
          </div>
          <p className="text-gray-600 mb-6 ml-10">
            This automation will scrape {propertyConfig.propertyCount} properties daily and send an SMS message to each.
          </p>

          {/* Main Automation Card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <BuildingLibraryIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Property Scraper + SMS</h2>
                  <p className="text-gray-500">Daily property scraping with SMS notification</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`mr-3 text-sm font-medium ${
                  isAutomationEnabled ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                  {isAutomationEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button 
                  onClick={toggleAutomation}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    isAutomationEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className="sr-only">Enable automation</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isAutomationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Property Search Configuration */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redfin Search URL*
                </label>
                <input
                  type="text"
                  name="searchQuery"
                  value={propertyConfig.searchQuery}
                  onChange={handlePropertyInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="e.g., 'https://www.redfin.com/city/11203/FL/Miami/filter/..'"
                  disabled={isJobRunning}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Paste a Redfin search URL with your desired filters already applied.
                </p>
              </div>

              {/* Pipeline Selection */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline*
                </label>
                <div className="w-1/2">
                  <select
                    value={propertyConfig.pipelineId}
                    onChange={(e) => setPropertyConfig(prev => ({ ...prev, pipelineId: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    disabled={isJobRunning || loadingPipelines}
                  >
                    <option value="">Select a pipeline</option>
                    {pipelines.map((pipeline) => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                  {loadingPipelines && (
                    <p className="mt-1 text-sm text-gray-500">Loading pipelines...</p>
                  )}
                  {!loadingPipelines && pipelines.length === 0 && (
                    <p className="mt-1 text-sm text-red-500">No pipelines available. Please create a pipeline first.</p>
                  )}
                </div>
              </div>

              {/* Property Count Configuration */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Properties Per Day
                </label>
                <div className="w-1/3">
                  <input
                    type="number"
                    name="propertyCount"
                    value={propertyConfig.propertyCount}
                    onChange={handlePropertyInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    min="1"
                    max="20"
                    disabled={isJobRunning}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Limited to a maximum of 20 properties per day.
                  </p>
                </div>
              </div>

              {/* SMS Template Configuration */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-3">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600 mr-2" />
                  <h3 className="text-md font-medium text-gray-900">SMS Template</h3>
                </div>
                <textarea
                  ref={textareaRef}
                  value={propertyConfig.smsTemplate.message}
                  onChange={handleSmsTemplateChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-32 font-mono text-sm"
                  placeholder="Enter your SMS template with placeholders like {{firstName}}, {{propertyAddress}}, etc."
                  disabled={isJobRunning}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 mr-1 self-center">Insert: </span>
                  {['firstName', 'userName', 'propertyAddress', 'propertyPrice', 'propertyLink'].map(placeholder => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => insertPlaceholder(placeholder)}
                      className="px-3 py-1.5 text-sm rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:shadow-sm transition-all flex items-center"
                      disabled={isJobRunning}
                    >
                      <TagIcon className="h-3 w-3 mr-1.5" />
                      {`{{${placeholder}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  {isJobRunning ? (
                    <button
                      onClick={handleCancelJob}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 shadow-sm"
                    >
                      Cancel Job
                    </button>
                  ) : (
                    <button
                      onClick={handleRunNow}
                      disabled={!propertyConfig.searchQuery || !isAutomationEnabled}
                      className={`px-4 py-2 rounded-md transition-colors duration-200 shadow-sm ${
                        !propertyConfig.searchQuery || !isAutomationEnabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Run Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job Status Card */}
          {isJobRunning && jobStatus && (
            <div className="bg-white p-6 shadow-md rounded-lg border border-gray-100">
              <div className="flex items-center mb-3">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  jobStatus.status === 'completed' ? 'bg-emerald-500' : 
                  jobStatus.status === 'failed' ? 'bg-red-500' : 
                  'bg-indigo-500 animate-pulse'
                }`}></div>
                <h3 className="font-medium text-gray-900">Job Status: {jobStatus.status}</h3>
              </div>
              <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${jobStatus.progress || 0}%` }}
                ></div>
              </div>
              {jobStatus.statistics && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between mb-1">
                    <span>Properties Processed:</span>
                    <span className="font-medium">{jobStatus.statistics.contactsProcessed || 0} / {jobStatus.statistics.totalContacts || propertyConfig.propertyCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMS Messages Sent:</span>
                    <span className="font-medium">{jobStatus.statistics.messageSent || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
} 