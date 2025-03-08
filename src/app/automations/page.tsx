"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronDownIcon, 
  PlusIcon, 
  PlayIcon, 
  TrashIcon, 
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { 
  AutomationFlow, 
  CommunicationChannel, 
  startAutomation, 
  getAutomationStatus,
  cancelAutomation 
} from '@/lib/automationService';
import DashboardLayout from '@/components/DashboardLayout';

// Define the types for email and SMS templates
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  message: string;
}

interface VoicemailTemplate {
  id: string;
  name: string;
  audioUrl: string;
  transcription: string;
}

export default function AutomationsPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState<Record<string, boolean>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});
  
  // Wizard step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Default mock templates
  const defaultEmailTemplates: EmailTemplate[] = [
    { id: '1', name: 'Property Introduction', subject: 'New Properties in Your Area', body: 'Hello, we found properties that match your criteria...' },
    { id: '2', name: 'Follow Up Email', subject: 'Following Up on Properties', body: 'Just checking in about the properties we sent...' }
  ];
  
  const defaultSmsTemplates: SmsTemplate[] = [
    { id: '1', name: 'Quick Intro', message: 'Hi! We found properties matching your criteria. Reply YES to learn more.' },
    { id: '2', name: 'Property Alert', message: 'New property alert! Check out this listing: [PROPERTY_LINK]' }
  ];
  
  const defaultVoicemailTemplates: VoicemailTemplate[] = [
    { id: '1', name: 'Brief Introduction', audioUrl: '/audio/intro.mp3', transcription: 'Hello, this is [NAME] from NextProp. We found some properties that match your criteria...' },
    { id: '2', name: 'Callback Request', audioUrl: '/audio/callback.mp3', transcription: 'Hi there, I recently sent you information about some properties. Please call me back at...' }
  ];
  
  // Extended form state for the wizard
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    
    // Step 2: Property Scraper
    searchQuery: 'Properties in Miami under $1M',
    contactCount: 100,
    
    // Step 3: Contact Management
    checkDuplicates: true,
    pipeline: 'leads',
    tags: [] as string[],
    
    // Step 4: Communication Channels
    communicationChannels: [] as CommunicationChannel[],
    emailTemplates: [] as string[],
    smsTemplates: [] as string[],
    voicemailTemplates: [] as string[],
    
    // Step 5: Schedule
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    count: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Available templates for selection
  const [availableTemplates, setAvailableTemplates] = useState({
    email: defaultEmailTemplates,
    sms: defaultSmsTemplates,
    voicemail: defaultVoicemailTemplates
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

  // Add wizard navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  // Handle template selection
  const handleTemplateSelection = (type: 'email' | 'sms' | 'voicemail', id: string, selected: boolean) => {
    setFormData(prev => {
      const fieldName = `${type}Templates` as 'emailTemplates' | 'smsTemplates' | 'voicemailTemplates';
      const currentTemplates = [...prev[fieldName]];
      
      if (selected) {
        if (!currentTemplates.includes(id)) {
          currentTemplates.push(id);
        }
      } else {
        const index = currentTemplates.indexOf(id);
        if (index !== -1) {
          currentTemplates.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        [fieldName]: currentTemplates
      };
    });
  };

  // Add tag to contact
  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag from contact
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
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
    // Reset form and step
    setFormData({
      name: '',
      description: '',
      searchQuery: 'Properties in Miami under $1M',
      contactCount: 100,
      checkDuplicates: true,
      pipeline: 'leads',
      tags: [],
      communicationChannels: [],
      emailTemplates: [],
      smsTemplates: [],
      voicemailTemplates: [],
      frequency: 'daily',
      count: 100,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setCurrentStep(1);
    
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

  // Wizard Step Indicator Component
  const WizardStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Basic Info' },
      { number: 2, title: 'Property Scraper' },
      { number: 3, title: 'Contact Management' },
      { number: 4, title: 'Communication' },
      { number: 5, title: 'Review & Schedule' }
    ];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div 
                className={`flex flex-col items-center cursor-pointer ${index < steps.length - 1 ? 'w-1/5' : ''}`}
                onClick={() => goToStep(step.number)}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    currentStep === step.number
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : currentStep > step.number
                      ? 'bg-green-100 text-green-700 border-green-500'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {currentStep > step.number ? <CheckIcon className="w-5 h-5" /> : step.number}
                </div>
                <span 
                  className={`mt-2 text-sm font-medium ${
                    currentStep === step.number
                      ? 'text-indigo-600'
                      : currentStep > step.number
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 relative">
                  <div className="absolute inset-0 bg-gray-200" />
                  <div 
                    className="absolute inset-0 bg-indigo-600 transition-all duration-300"
                    style={{ width: currentStep > index + 1 ? '100%' : currentStep === index + 1 ? '50%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
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
          <h2 className="text-xl font-semibold mb-6">Create New Automation</h2>
          
          <WizardStepIndicator />
          
          <div className="border-t border-gray-200 pt-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
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
              </div>
            )}
            
            {/* Step 2: Property Scraper */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Scraper Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zillow Search Query*
                  </label>
                  <input
                    type="text"
                    name="searchQuery"
                    value={formData.searchQuery}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Properties in Miami under $1M'"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the search query that will be used to find properties on Zillow.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Contacts to Generate*
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
                  <p className="mt-1 text-sm text-gray-500">
                    Specify how many contact records should be created from the scraped properties.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Property Data Extraction</h4>
                  <p className="text-sm text-yellow-700">
                    The system will extract the following details for each property:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                    <li>Address, City, State, Zip</li>
                    <li>Property Price</li>
                    <li>Bedrooms & Bathrooms</li>
                    <li>Square Footage</li>
                    <li>Year Built</li>
                    <li>Contact Information (if available)</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Step 3: Contact Management */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Management</h3>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="checkDuplicates"
                    name="checkDuplicates"
                    checked={formData.checkDuplicates}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      checkDuplicates: e.target.checked
                    }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="checkDuplicates" className="ml-2 block text-sm text-gray-900">
                    Check for duplicate contacts before adding
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  System will check if contacts already exist in your database using email, phone, and address.
                </p>
                
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
                  <p className="mt-1 text-sm text-gray-500">
                    All generated contacts will be added to this pipeline as opportunities.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600"
                        >
                          <span className="sr-only">Remove tag</span>
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      id="tagInput"
                      placeholder="Add a tag"
                      className="flex-1 p-2 border border-r-0 border-gray-300 rounded-l-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleAddTag(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tagInput') as HTMLInputElement;
                        handleAddTag(input.value);
                        input.value = '';
                      }}
                      className="p-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Tags help categorize your contacts. Press Enter or click Add after typing a tag.
                  </p>
                </div>
              </div>
            )}
            
            {/* Step 4: Communication Channels */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Methods</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Communication Channels*
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="border border-gray-300 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="email"
                          checked={formData.communicationChannels.includes('email')}
                          onChange={() => handleCheckboxChange('email')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="email" className="ml-2 block font-medium text-gray-700">
                          Email
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 ml-6">
                        Send automated email campaigns to contacts.
                      </p>
                      
                      {formData.communicationChannels.includes('email') && (
                        <div className="mt-3 ml-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select Email Templates:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableTemplates.email.map(template => (
                              <div key={template.id} className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`email-template-${template.id}`}
                                  checked={formData.emailTemplates.includes(template.id)}
                                  onChange={(e) => handleTemplateSelection('email', template.id, e.target.checked)}
                                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <div className="ml-2">
                                  <label htmlFor={`email-template-${template.id}`} className="block text-sm font-medium text-gray-700">
                                    {template.name}
                                  </label>
                                  <p className="text-xs text-gray-500">Subject: {template.subject}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-300 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sms"
                          checked={formData.communicationChannels.includes('sms')}
                          onChange={() => handleCheckboxChange('sms')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="sms" className="ml-2 block font-medium text-gray-700">
                          SMS
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 ml-6">
                        Send automated text message campaigns to contacts.
                      </p>
                      
                      {formData.communicationChannels.includes('sms') && (
                        <div className="mt-3 ml-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select SMS Templates:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableTemplates.sms.map(template => (
                              <div key={template.id} className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`sms-template-${template.id}`}
                                  checked={formData.smsTemplates.includes(template.id)}
                                  onChange={(e) => handleTemplateSelection('sms', template.id, e.target.checked)}
                                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <div className="ml-2">
                                  <label htmlFor={`sms-template-${template.id}`} className="block text-sm font-medium text-gray-700">
                                    {template.name}
                                  </label>
                                  <p className="text-xs text-gray-500">{template.message.substring(0, 40)}...</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-300 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="voicemail"
                          checked={formData.communicationChannels.includes('voicemail')}
                          onChange={() => handleCheckboxChange('voicemail')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="voicemail" className="ml-2 block font-medium text-gray-700">
                          Ringless Voicemail
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 ml-6">
                        Deliver voicemail messages directly to contacts' voicemail box.
                      </p>
                      
                      {formData.communicationChannels.includes('voicemail') && (
                        <div className="mt-3 ml-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select Voicemail Templates:</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableTemplates.voicemail.map(template => (
                              <div key={template.id} className="flex items-start">
                                <input
                                  type="checkbox"
                                  id={`voicemail-template-${template.id}`}
                                  checked={formData.voicemailTemplates.includes(template.id)}
                                  onChange={(e) => handleTemplateSelection('voicemail', template.id, e.target.checked)}
                                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <div className="ml-2">
                                  <label htmlFor={`voicemail-template-${template.id}`} className="block text-sm font-medium text-gray-700">
                                    {template.name}
                                  </label>
                                  <p className="text-xs text-gray-500">{template.transcription.substring(0, 40)}...</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-300 rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="call"
                          checked={formData.communicationChannels.includes('call')}
                          onChange={() => handleCheckboxChange('call')}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="call" className="ml-2 block font-medium text-gray-700">
                          Automated Calls
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 ml-6">
                        Schedule automated phone calls to contacts.
                      </p>
                      
                      {formData.communicationChannels.includes('call') && (
                        <div className="mt-3 ml-6 p-2 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                          Call templates must be set up in your phone settings. 
                          Automated calls will use your default call script.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 5: Review & Schedule */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Schedule</h3>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Automation Summary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Name:</span>
                      <span className="text-gray-800">{formData.name || 'Unnamed Automation'}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Description:</span>
                      <span className="text-gray-800">{formData.description || 'No description'}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Property Search:</span>
                      <span className="text-gray-800">{formData.searchQuery}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Contacts to Process:</span>
                      <span className="text-gray-800">{formData.contactCount}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Duplicate Checking:</span>
                      <span className="text-gray-800">{formData.checkDuplicates ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Pipeline:</span>
                      <span className="text-gray-800">{formData.pipeline}</span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Contact Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.length > 0 ? (
                          formData.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">No tags</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-40">Communication:</span>
                      <div className="flex flex-col">
                        {formData.communicationChannels.length > 0 ? (
                          formData.communicationChannels.map(channel => (
                            <div key={channel} className="flex items-center">
                              <span className="text-gray-800 capitalize">{channel}</span>
                              {channel === 'email' && formData.emailTemplates.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({formData.emailTemplates.length} templates)
                                </span>
                              )}
                              {channel === 'sms' && formData.smsTemplates.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({formData.smsTemplates.length} templates)
                                </span>
                              )}
                              {channel === 'voicemail' && formData.voicemailTemplates.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({formData.voicemailTemplates.length} templates)
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500">No communication channels selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Schedule Delivery</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Ready to Launch</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Your automation is ready to be launched. Click the "Launch Automation" button 
                          below to start the process. You can monitor the progress from the dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step navigation buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </button>
              )}
              
              <div className="flex-1"></div>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateAutomation}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Launch Automation
                  <CheckIcon className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
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