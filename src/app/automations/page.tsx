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
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingLibraryIcon
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
import TemplateEditor from '@/components/TemplateEditor';
import { EmailTemplate, SmsTemplate, VoicemailTemplate } from '@/lib/types';
import TemplateSection from '@/components/TemplateSection';

export default function AutomationsPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState<Record<string, boolean>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});
  
  // Wizard step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | VoicemailTemplate | null>(null);
  const [editingTemplateType, setEditingTemplateType] = useState<'email' | 'sms' | 'voicemail' | null>(null);
  
  // Default mock templates
  const defaultEmailTemplates: EmailTemplate[] = [
    { id: '1', name: 'Property Introduction', subject: 'New Properties in Your Area', body: 'Hello, we found properties that match your criteria...', type: 'introduction' },
    { id: '2', name: 'Follow Up Email', subject: 'Following Up on Properties', body: 'Just checking in about the properties we sent...', type: 'follow-up' }
  ];
  
  const defaultSmsTemplates: SmsTemplate[] = [
    { id: '1', name: 'Quick Intro', message: 'Hi! We found properties matching your criteria. Reply YES to learn more.', type: 'introduction' },
    { id: '2', name: 'Property Alert', message: 'New property alert! Check out this listing: [PROPERTY_LINK]', type: 'property-info' }
  ];
  
  const defaultVoicemailTemplates: VoicemailTemplate[] = [
    { id: '1', name: 'Brief Introduction', audioUrl: '/audio/intro.mp3', transcription: 'Hello, this is [NAME] from NextProp. We found some properties that match your criteria...', type: 'introduction' },
    { id: '2', name: 'Callback Request', audioUrl: '/audio/callback.mp3', transcription: 'Hi there, I recently sent you information about some properties. Please call me back at...', type: 'follow-up' }
  ];
  
  // Available templates for selection
  const [availableTemplates, setAvailableTemplates] = useState({
    email: [
      {
        id: 'email1',
        name: 'Property Introduction',
        subject: 'New Property Alert: {{propertyAddress}}',
        body: 'Hi {{firstName}},\n\nI wanted to bring to your attention a property that might interest you at {{propertyAddress}}. It is currently listed at {{propertyPrice}}.\n\nCheck out more details here: {{propertyLink}}\n\nLet me know if you would like to schedule a viewing.\n\nBest regards,\nYour Agent',
        previewText: 'New property that matches your criteria',
        type: 'introduction' as const,
      },
      {
        id: 'email2',
        name: 'Follow-up Email',
        subject: 'Following up about {{propertyAddress}}',
        body: 'Hello {{firstName}},\n\nI am just following up on the property at {{propertyAddress}} that I shared with you earlier. Have you had a chance to review it?\n\nI would be happy to answer any questions you might have or schedule a viewing.\n\nBest regards,\nYour Agent',
        type: 'follow-up' as const,
      },
    ],
    sms: [
      {
        id: 'sms1',
        name: 'Quick Property Alert',
        message: 'Hi {{firstName}}, new property alert! Check out {{propertyAddress}} - view details at {{propertyLink}}',
        type: 'introduction' as const,
        maxLength: 160,
      },
      {
        id: 'sms2',
        name: 'Viewing Reminder',
        message: 'Reminder: Your viewing for {{propertyAddress}} is scheduled for tomorrow. Reply to confirm.',
        type: 'follow-up' as const,
      },
    ],
    voicemail: [
      {
        id: 'vm1',
        name: 'Property Introduction VM',
        audioUrl: '/sample-voicemails/property-intro.mp3',
        transcription: 'Hi {{firstName}}, this is {{agentName}} from {{companyName}}. I wanted to let you know about a property at {{propertyAddress}} that matches your criteria. Please call me back when you get a chance to discuss this opportunity.',
        duration: 22,
        voiceType: 'ai' as const,
        type: 'introduction' as const,
      },
      {
        id: 'vm2',
        name: 'Follow-up Voicemail',
        audioUrl: '/sample-voicemails/followup.mp3',
        transcription: 'Hello {{firstName}}, this is {{agentName}} following up about the property at {{propertyAddress}} that I mentioned earlier. Please give me a call if you are interested in learning more.',
        duration: 15,
        voiceType: 'female' as const,
        type: 'follow-up' as const,
      },
    ],
  });

  // State for automation form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    searchQuery: '',
    pipeline: 'leads',
    tags: [] as string[],
    communicationChannels: [] as CommunicationChannel[],
    emailTemplates: [] as string[],
    smsTemplates: [] as string[],
    voicemailTemplates: [] as string[],
    schedule: {
      count: 20,
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    },
    checkDuplicates: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
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

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (e.g., schedule.count)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        if (parent === 'schedule') {
          return {
            ...prev,
            schedule: {
              ...prev.schedule,
              [child]: child === 'count' ? Number(value) : value
            }
          };
        }
        
        // Add other nested objects if needed
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (channel: CommunicationChannel) => {
    setFormData(prev => {
      // Toggle the channel
      const updatedChannels = prev.communicationChannels.includes(channel)
        ? prev.communicationChannels.filter(c => c !== channel)
        : [...prev.communicationChannels, channel];
      
      // Clear template selections if channel is disabled
      let updatedData = {
        ...prev,
        communicationChannels: updatedChannels,
      };
      
      if (!updatedChannels.includes('email')) {
        updatedData.emailTemplates = [];
      }
      
      if (!updatedChannels.includes('sms')) {
        updatedData.smsTemplates = [];
      }
      
      if (!updatedChannels.includes('voicemail')) {
        updatedData.voicemailTemplates = [];
      }
      
      return updatedData;
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
        contactCount: formData.schedule.count,
        pipeline: formData.pipeline,
        communicationChannels: formData.communicationChannels,
        schedule: formData.schedule
      }
    };

    setAutomations(prev => [...prev, newAutomation]);
    setIsCreating(false);
    // Reset form and step
    setFormData({
      name: '',
      description: '',
      searchQuery: '',
      pipeline: 'leads',
      tags: [],
      communicationChannels: [],
      emailTemplates: [],
      smsTemplates: [],
      voicemailTemplates: [],
      schedule: {
        count: 20,
        frequency: 'daily',
      },
      checkDuplicates: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
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
    
    // Save activated automation to localStorage
    setTimeout(() => {
      const updatedAutomations = automations.map(automation => 
        automation.id === id 
          ? { ...automation, status: 'active' as const, lastRun: new Date().toISOString() } 
          : automation
      );
      localStorage.setItem('automations', JSON.stringify(updatedAutomations));
      
      // Store job ID for dashboard to display
      const jobId = `job_${id}`;
      const storedJobIds = localStorage.getItem('activeJobIds');
      let activeJobIds = storedJobIds ? JSON.parse(storedJobIds) : [];
      if (!activeJobIds.includes(jobId)) {
        activeJobIds.push(jobId);
        localStorage.setItem('activeJobIds', JSON.stringify(activeJobIds));
      }
    }, 0);
    
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
      
      // Store job ID for dashboard to display
      const storedJobIds = localStorage.getItem('activeJobIds');
      let activeJobIds = storedJobIds ? JSON.parse(storedJobIds) : [];
      if (!activeJobIds.includes(result.jobId)) {
        activeJobIds.push(result.jobId);
        localStorage.setItem('activeJobIds', JSON.stringify(activeJobIds));
      }
      
      // Also ensure automations array is updated in localStorage
      const updatedAutomations = automations.map(a => 
        a.id === id 
          ? { ...a, lastRun: new Date().toISOString() } 
          : a
      );
      localStorage.setItem('automations', JSON.stringify(updatedAutomations));
      
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
      
      // Remove jobId from localStorage
      const storedJobIds = localStorage.getItem('activeJobIds');
      if (storedJobIds) {
        let activeJobIds = JSON.parse(storedJobIds);
        activeJobIds = activeJobIds.filter((id: string) => id !== jobId);
        localStorage.setItem('activeJobIds', JSON.stringify(activeJobIds));
      }
      
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel job');
    }
  };

  // Reorder communication channels
  const moveChannel = (channelIndex: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const channels = [...prev.communicationChannels];
      
      if (direction === 'up' && channelIndex > 0) {
        // Swap with previous item
        [channels[channelIndex], channels[channelIndex - 1]] = [channels[channelIndex - 1], channels[channelIndex]];
      } else if (direction === 'down' && channelIndex < channels.length - 1) {
        // Swap with next item
        [channels[channelIndex], channels[channelIndex + 1]] = [channels[channelIndex + 1], channels[channelIndex]];
      }
      
      return {
        ...prev,
        communicationChannels: channels
      };
    });
  };

  // Display communication sequence in the Communication Methods step
  const renderCommunicationSequence = () => (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Communication Sequence</h4>
      <p className="text-sm text-gray-600 mb-3">
        Define the order in which communications will be sent:
      </p>
      
      <div className="flex flex-col space-y-2">
        {formData.communicationChannels.length > 0 ? (
          formData.communicationChannels.map((channel, index) => (
            <div key={channel} className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-200">
              <div className="flex items-center">
                <span className="h-5 w-5 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium mr-2">
                  {index + 1}
                </span>
                <span className="capitalize text-gray-700">
                  {channel === 'voicemail' ? 'Ringless Voicemail' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                </span>
              </div>
              
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => moveChannel(index, 'up')}
                  disabled={index === 0}
                  className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveChannel(index, 'down')}
                  disabled={index === formData.communicationChannels.length - 1}
                  className={`p-1 rounded ${index === formData.communicationChannels.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No communication channels selected</p>
        )}
      </div>
    </div>
  );

  // Wizard Step Indicator Component
  const WizardStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Property Sources' },
      { number: 2, title: 'Contact Management' },
      { number: 3, title: 'Communication Setup' },
      { number: 4, title: 'Review & Launch' }
    ];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div 
                className={`flex flex-col items-center cursor-pointer ${index < steps.length - 1 ? 'w-1/4' : ''}`}
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
            {/* Step 1: Property Sources */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Sources Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <BuildingLibraryIcon className="h-6 w-6 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Zillow Property Scraper</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search Query*
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
                          Be specific about location, price range, and property type.
                        </p>
                      </div>
                      {/*                       
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Price
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="minPrice"
                              placeholder="100,000"
                              className="p-2 pl-7 w-full border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Price
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="maxPrice"
                              placeholder="1,000,000"
                              className="p-2 pl-7 w-full border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                       */}
                      {/* <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Beds
                          </label>
                          <select
                            name="minBeds"
                            className="p-2 w-full border border-gray-300 rounded-md"
                          >
                            <option value="">Any</option>
                            <option value="1">1+</option>
                            <option value="2">2+</option>
                            <option value="3">3+</option>
                            <option value="4">4+</option>
                            <option value="5">5+</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Baths
                          </label>
                          <select
                            name="minBaths"
                            className="p-2 w-full border border-gray-300 rounded-md"
                          >
                            <option value="">Any</option>
                            <option value="1">1+</option>
                            <option value="2">2+</option>
                            <option value="3">3+</option>
                            <option value="4">4+</option>
                          </select>
                        </div>
                      </div> */}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Contacts to Generate*
                      </label>
                      <input
                        type="number"
                        name="schedule.count"
                        value={formData.schedule.count}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="1"
                        max="1000"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        How many contact records should be created from the scraped properties.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Property Data Extraction</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p className="mb-2">The system will extract the following details:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Address, City, State, Zip</li>
                              <li>Property Price</li>
                              <li>Bedrooms & Bathrooms</li>
                              <li>Square Footage</li>
                              <li>Year Built</li>
                              <li>Contact Information (if available)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="block text-sm font-medium text-gray-700 mb-2">Automation Name (Optional)</h4>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 'Miami Properties Campaign'"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Contact Management */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Management</h3>
                
                <div className="flex items-center">
                  {/* <input
                    type="checkbox"
                    id="checkDuplicates"
                    name="checkDuplicates"
                    checked={formData.checkDuplicates}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      checkDuplicates: true
                    }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                  /> */}
                  {/* <label htmlFor="checkDuplicates" className="ml-2 block text-sm text-gray-900">
                    Check for duplicate contacts before adding
                  </label> */}
                </div>
                {/* <p className="text-sm text-gray-500 ml-6">
                  System will check if contacts already exist in your database using email, phone, and address.
                </p>
                 */}
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
            
            {/* Step 3: Communication Channels */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Methods</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Configuration */}
                  <TemplateSection
                    type="email"
                    title="Email Campaigns"
                    icon={<EnvelopeIcon className="h-5 w-5 text-indigo-600 mr-2" />}
                    enabled={formData.communicationChannels.includes('email')}
                    onToggle={() => handleCheckboxChange('email')}
                    templates={availableTemplates.email}
                    selectedTemplateIds={formData.emailTemplates}
                    onTemplateSelect={(id, selected) => handleTemplateSelection('email', id, selected)}
                    highlightColor="indigo"
                    onSaveTemplate={(template) => {
                      // Update the email template in the availableTemplates
                      setAvailableTemplates(prev => {
                        const updatedTemplates = [...prev.email];
                        const index = updatedTemplates.findIndex(t => t.id === template.id);
                        if (index !== -1) {
                          updatedTemplates[index] = template as EmailTemplate;
                        } else {
                          updatedTemplates.push(template as EmailTemplate);
                        }
                        return {
                          ...prev,
                          email: updatedTemplates
                        };
                      });
                      toast.success('Email template saved successfully');
                    }}
                  />
                  
                  {/* SMS Configuration */}
                  <TemplateSection
                    type="sms"
                    title="SMS Campaigns"
                    icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-2" />}
                    enabled={formData.communicationChannels.includes('sms')}
                    onToggle={() => handleCheckboxChange('sms')}
                    templates={availableTemplates.sms}
                    selectedTemplateIds={formData.smsTemplates}
                    onTemplateSelect={(id, selected) => handleTemplateSelection('sms', id, selected)}
                    highlightColor="green"
                    onSaveTemplate={(template) => {
                      // Update the SMS template in the availableTemplates
                      setAvailableTemplates(prev => {
                        const updatedTemplates = [...prev.sms];
                        const index = updatedTemplates.findIndex(t => t.id === template.id);
                        if (index !== -1) {
                          updatedTemplates[index] = template as SmsTemplate;
                        } else {
                          updatedTemplates.push(template as SmsTemplate);
                        }
                        return {
                          ...prev,
                          sms: updatedTemplates
                        };
                      });
                      toast.success('SMS template saved successfully');
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Voicemail Configuration */}
                  <TemplateSection
                    type="voicemail"
                    title="Ringless Voicemail"
                    icon={<PhoneIcon className="h-5 w-5 text-amber-600 mr-2" />}
                    enabled={formData.communicationChannels.includes('voicemail')}
                    onToggle={() => handleCheckboxChange('voicemail')}
                    templates={availableTemplates.voicemail}
                    selectedTemplateIds={formData.voicemailTemplates}
                    onTemplateSelect={(id, selected) => handleTemplateSelection('voicemail', id, selected)}
                    highlightColor="amber"
                    onSaveTemplate={(template) => {
                      // Update the voicemail template in the availableTemplates
                      setAvailableTemplates(prev => {
                        const updatedTemplates = [...prev.voicemail];
                        const index = updatedTemplates.findIndex(t => t.id === template.id);
                        if (index !== -1) {
                          updatedTemplates[index] = template as VoicemailTemplate;
                        } else {
                          updatedTemplates.push(template as VoicemailTemplate);
                        }
                        return {
                          ...prev,
                          voicemail: updatedTemplates
                        };
                      });
                      toast.success('Voicemail script saved successfully');
                    }}
                  />
                  
                  {/* Call Configuration */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-blue-900">Automated Calls</h4>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="call"
                          checked={formData.communicationChannels.includes('call')}
                          onChange={() => handleCheckboxChange('call')}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="call" className="ml-2 text-sm text-gray-700">
                          Enable
                        </label>
                      </div>
                    </div>
                    
                    {formData.communicationChannels.includes('call') && (
                      <div className="p-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex">
                            <ExclamationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                            <p className="text-sm text-blue-700">
                              Automated calls use your default call script configured in the phone settings.
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Call Schedule
                            </label>
                            <select
                              name="callSchedule"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              defaultValue="business-hours"
                            >
                              <option value="business-hours">Business Hours (9 AM - 5 PM)</option>
                              <option value="morning">Morning Only (9 AM - 12 PM)</option>
                              <option value="afternoon">Afternoon Only (1 PM - 5 PM)</option>
                              <option value="evening">Evening Only (6 PM - 8 PM)</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Call Delay After Lead Creation
                            </label>
                            <select
                              name="callDelay"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              defaultValue="72"
                            >
                              <option value="24">1 Day</option>
                              <option value="48">2 Days</option>
                              <option value="72">3 Days</option>
                              <option value="120">5 Days</option>
                              <option value="168">1 Week</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="skipVoicemailRecipients"
                              defaultChecked={true}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor="skipVoicemailRecipients" className="ml-2 text-sm text-gray-700">
                              Skip contacts who received a voicemail
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {renderCommunicationSequence()}
              </div>
            )}
            
            {/* Step 4: Review & Schedule */}
            {currentStep === 4 && (
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
                      <span className="text-gray-800">{formData.schedule.count}</span>
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
                        name="schedule.frequency"
                        value={formData.schedule.frequency}
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
                        name="schedule.count"
                        value={formData.schedule.count}
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
                          Send via: {automation.steps.communicationChannels.map((c, i) => (
                            i === automation.steps.communicationChannels.length - 1 
                              ? c === 'voicemail' ? 'Ringless Voicemail' : c.charAt(0).toUpperCase() + c.slice(1)
                              : `${c === 'voicemail' ? 'Ringless Voicemail' : c.charAt(0).toUpperCase() + c.slice(1)}, `
                          ))}
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
        {/* <button
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Automation
        </button> */}
      </div>
      {pageContent}
      <Toaster position="top-right" />
    </DashboardLayout>
  );
} 