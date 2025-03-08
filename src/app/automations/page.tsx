"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, PlusIcon, PlayIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { 
  AutomationFlow, 
  CommunicationChannel, 
  startAutomation, 
  getAutomationStatus,
  cancelAutomation 
} from '@/lib/automationService';
import DashboardLayout from '@/components/DashboardLayout';

export default function AutomationsPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState<Record<string, boolean>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});
  
  // Form state for new automation
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    searchQuery: 'Properties in Miami under $1M',
    contactCount: 100,
    pipeline: 'leads',
    communicationChannels: [] as CommunicationChannel[],
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    count: 100
  });

  // Load existing automations from localStorage on mount
  useEffect(() => {
    const savedAutomations = localStorage.getItem('automations');
    if (savedAutomations) {
      try {
        setAutomations(JSON.parse(savedAutomations));
      } catch (e) {
        console.error('Failed to parse saved automations:', e);
      }
    }
  }, []);

  // Save automations to localStorage whenever they change
  useEffect(() => {
    if (automations.length > 0) {
      localStorage.setItem('automations', JSON.stringify(automations));
    }
  }, [automations]);

  // Poll for updates on active jobs
  useEffect(() => {
    const jobIds = Object.keys(activeJobs);
    if (jobIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const jobId of jobIds) {
        try {
          const status = await getAutomationStatus(jobId);
          setActiveJobs(prev => ({
            ...prev,
            [jobId]: status
          }));

          // If the job is completed, remove it from active jobs
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            setTimeout(() => {
              setActiveJobs(prev => {
                const { [jobId]: _, ...rest } = prev;
                return rest;
              });
            }, 5000); // Keep it visible for 5 seconds after completion
          }
        } catch (error) {
          console.error(`Error polling job ${jobId}:`, error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const toggleDetails = (id: string) => {
    setIsDetailsOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (channel: CommunicationChannel) => {
    setFormData(prev => {
      const channels = [...prev.communicationChannels];
      if (channels.includes(channel)) {
        return {
          ...prev,
          communicationChannels: channels.filter(c => c !== channel)
        };
      } else {
        return {
          ...prev,
          communicationChannels: [...channels, channel]
        };
      }
    });
  };

  const handleCreateAutomation = () => {
    if (!formData.name || formData.communicationChannels.length === 0) {
      toast.error('Please provide a name and select at least one communication channel');
      return;
    }

    const newAutomation: AutomationFlow = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      steps: {
        source: 'zillow',
        contactCount: formData.contactCount,
        pipeline: formData.pipeline,
        communicationChannels: formData.communicationChannels,
        schedule: {
          frequency: formData.frequency,
          count: formData.count
        }
      }
    };

    setAutomations(prev => [...prev, newAutomation]);
    setIsCreating(false);
    // Reset form
    setFormData({
      name: '',
      description: '',
      searchQuery: 'Properties in Miami under $1M',
      contactCount: 100,
      pipeline: 'leads',
      communicationChannels: [],
      frequency: 'daily',
      count: 100
    });
    
    toast.success('Automation created successfully!');
  };

  const handleDeleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(automation => automation.id !== id));
    toast.success('Automation deleted');
  };

  const handleActivateAutomation = (id: string) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === id 
          ? { ...automation, status: 'active' as const, lastRun: new Date().toISOString() } 
          : automation
      )
    );
    toast.success('Automation activated! It will start running based on the schedule.');
  };

  const handleRunNow = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (!automation) return;

    toast.loading('Starting automation job...', { id: `job-${id}` });

    try {
      const result = await startAutomation(
        automation.name,
        automation.description,
        formData.searchQuery,
        automation.steps.contactCount,
        automation.steps.pipeline,
        automation.steps.communicationChannels,
        automation.steps.schedule.frequency,
        automation.steps.schedule.count
      );

      toast.success('Automation started successfully!', { id: `job-${id}` });
      
      // Add to active jobs
      setActiveJobs(prev => ({
        ...prev,
        [result.jobId]: {
          jobId: result.jobId,
          status: 'initializing',
          progress: 0,
          automationId: id
        }
      }));

      // Update automation with last run time
      setAutomations(prev => 
        prev.map(a => 
          a.id === id 
            ? { ...a, lastRun: new Date().toISOString() } 
            : a
        )
      );
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automation', { id: `job-${id}` });
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelAutomation(jobId);
      toast.success('Job cancelled successfully');
      
      // Update active jobs
      setActiveJobs(prev => {
        const { [jobId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel job');
    }
  };

  // The content of the page that will be wrapped by DashboardLayout
  const pageContent = (
    <div className="container mx-auto px-4 py-8">
      {/* Active Jobs Section */}
      {Object.keys(activeJobs).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>
          <div className="grid grid-cols-1 gap-4">
            {Object.values(activeJobs).map((job: any) => (
              <div key={job.jobId} className="bg-white p-4 shadow rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      {automations.find(a => a.id === job.automationId)?.name || 'Job'} ({job.status})
                    </h3>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${job.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelJob(job.jobId)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    title="Cancel Job"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                {job.statistics && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Processed: {job.statistics.contactsProcessed} / {job.statistics.totalContacts}</p>
                    <p>Duplicates: {job.statistics.duplicatesFound}</p>
                    <p>Opportunities: {job.statistics.opportunitiesCreated}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCreating ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Automation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Automation Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 'Zillow Daily Lead Processor'"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="What does this automation do?"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zillow Search Query
                </label>
                <input
                  type="text"
                  name="searchQuery"
                  value={formData.searchQuery}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 'Properties in Miami under $1M'"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Count
                </label>
                <input
                  type="number"
                  name="contactCount"
                  value={formData.contactCount}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Pipeline
                </label>
                <select
                  name="pipeline"
                  value={formData.pipeline}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="leads">Leads</option>
                  <option value="deals">Deals</option>
                  <option value="closings">Closings</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Channels*
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email"
                      checked={formData.communicationChannels.includes('email')}
                      onChange={() => handleCheckboxChange('email')}
                      className="mr-2"
                    />
                    <label htmlFor="email">Email</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sms"
                      checked={formData.communicationChannels.includes('sms')}
                      onChange={() => handleCheckboxChange('sms')}
                      className="mr-2"
                    />
                    <label htmlFor="sms">SMS</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="voicemail"
                      checked={formData.communicationChannels.includes('voicemail')}
                      onChange={() => handleCheckboxChange('voicemail')}
                      className="mr-2"
                    />
                    <label htmlFor="voicemail">Ringless Voicemail</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="call"
                      checked={formData.communicationChannels.includes('call')}
                      onChange={() => handleCheckboxChange('call')}
                      className="mr-2"
                    />
                    <label htmlFor="call">Automated Calls</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacts Per Run
                </label>
                <input
                  type="number"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="1000"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAutomation}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Automation
            </button>
          </div>
        </div>
      ) : null}

      {automations.length === 0 && !isCreating ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first automation to start streamlining your workflow.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Automation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {automations.map((automation) => (
            <div key={automation.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div 
                className="px-6 py-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleDetails(automation.id)}
              >
                <div className="flex items-center">
                  <div 
                    className={`w-3 h-3 rounded-full mr-3 ${
                      automation.status === 'active' ? 'bg-green-500' : 
                      automation.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{automation.name}</h3>
                    <p className="text-sm text-gray-500">Created {new Date(automation.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {automation.status !== 'active' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateAutomation(automation.id);
                      }}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                      title="Activate"
                    >
                      <PlayIcon className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunNow(automation.id);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                    title="Run Now"
                  >
                    <ClockIcon className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAutomation(automation.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  
                  <ChevronDownIcon 
                    className={`w-5 h-5 transition-transform ${isDetailsOpen[automation.id] ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
              
              {isDetailsOpen[automation.id] && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600">{automation.description || 'No description provided.'}</p>
                      
                      <h4 className="font-medium text-gray-700 mt-4 mb-2">Status</h4>
                      <p className="text-gray-600 capitalize">{automation.status}</p>
                      
                      {automation.lastRun && (
                        <>
                          <h4 className="font-medium text-gray-700 mt-4 mb-2">Last Run</h4>
                          <p className="text-gray-600">{new Date(automation.lastRun).toLocaleString()}</p>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Workflow</h4>
                      <ol className="list-decimal list-inside text-gray-600 space-y-1">
                        <li>Zillow property scraping</li>
                        <li>Get {automation.steps.contactCount} contacts</li>
                        <li>Add as contacts (with duplicate checking)</li>
                        <li>Add to {automation.steps.pipeline} pipeline</li>
                        <li>
                          Send via: {automation.steps.communicationChannels.map(c => 
                            c === 'voicemail' ? 'Ringless Voicemail' : 
                            c.charAt(0).toUpperCase() + c.slice(1)
                          ).join(', ')}
                        </li>
                        <li>Schedule: {automation.steps.schedule.count} contacts {automation.steps.schedule.frequency}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Automations">
      <div className="flex justify-between items-center mb-8 px-4 pt-4">
        <h1 className="text-3xl font-bold text-gray-900"></h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Automation
        </button>
      </div>
      {pageContent}
      <Toaster position="top-right" />
    </DashboardLayout>
  );
} 