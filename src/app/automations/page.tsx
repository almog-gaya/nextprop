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
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState<Record<string, boolean>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});
  
  // Automation module visibility states
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | VoicemailTemplate | null>(null);
  const [editingTemplateType, setEditingTemplateType] = useState<'email' | 'sms' | 'voicemail' | null>(null);
  
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

  // Individual automation configurations
  const [contactSourceConfig, setContactSourceConfig] = useState({
    name: '',
    description: '',
    searchQuery: '',
    pipeline: 'leads',
    tags: [] as string[],
    contactCount: 20,
    checkDuplicates: true,
    bulkUpload: false,
  });

  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    name: 'Email Automation',
    templates: [] as string[],
    schedule: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      count: 20,
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [smsConfig, setSmsConfig] = useState({
    enabled: false,
    name: 'SMS Automation',
    templates: [] as string[],
    schedule: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      count: 20,
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [voicemailConfig, setVoicemailConfig] = useState({
    enabled: false,
    name: 'Voicemail Automation',
    templates: [] as string[],
    schedule: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      count: 20,
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [callConfig, setCallConfig] = useState({
    enabled: false,
    name: 'Call Automation',
    schedule: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      count: 20,
    },
    callSchedule: 'business-hours',
    callDelay: 72,
    skipVoicemailRecipients: true,
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

  // Handle input changes for contact source config
  const handleContactSourceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactSourceConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for email config
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'schedule') {
        setEmailConfig(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            [child]: child === 'count' ? Number(value) : value
          }
        }));
      }
    } else {
      setEmailConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle input changes for SMS config
  const handleSmsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'schedule') {
        setSmsConfig(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            [child]: child === 'count' ? Number(value) : value
          }
        }));
      }
    } else {
      setSmsConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle input changes for voicemail config
  const handleVoicemailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'schedule') {
        setVoicemailConfig(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            [child]: child === 'count' ? Number(value) : value
          }
        }));
      }
    } else {
      setVoicemailConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle input changes for call config
  const handleCallInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'schedule') {
        setCallConfig(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            [child]: child === 'count' ? Number(value) : value
          }
        }));
      }
    } else {
      setCallConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle toggle for email automation
  const handleEmailToggle = () => {
    setEmailConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  // Handle toggle for SMS automation
  const handleSmsToggle = () => {
    setSmsConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  // Handle toggle for voicemail automation
  const handleVoicemailToggle = () => {
    setVoicemailConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  // Handle toggle for call automation
  const handleCallToggle = () => {
    setCallConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  // Add tag to contact
  const handleAddTag = (tag: string) => {
    if (tag && !contactSourceConfig.tags.includes(tag)) {
      setContactSourceConfig(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag from contact
  const handleRemoveTag = (tag: string) => {
    setContactSourceConfig(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle template selection for email
  const handleEmailTemplateSelection = (id: string, selected: boolean) => {
    setEmailConfig(prev => {
      const currentTemplates = [...prev.templates];
      
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
        templates: currentTemplates
      };
    });
  };

  // Handle template selection for SMS
  const handleSmsTemplateSelection = (id: string, selected: boolean) => {
    setSmsConfig(prev => {
      const currentTemplates = [...prev.templates];
      
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
        templates: currentTemplates
      };
    });
  };

  // Handle template selection for voicemail
  const handleVoicemailTemplateSelection = (id: string, selected: boolean) => {
    setVoicemailConfig(prev => {
      const currentTemplates = [...prev.templates];
      
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
        templates: currentTemplates
      };
    });
  };

  // Rest of the functions...
  const handleCreateAutomation = (type: 'contact' | 'email' | 'sms' | 'voicemail' | 'call') => {
    let newAutomation: AutomationFlow;
    let automationName = '';
    let automationDescription = '';
    let communicationChannels: CommunicationChannel[] = [];
    let scheduleConfig = { count: 20, frequency: 'daily' as 'daily' | 'weekly' | 'monthly' };
    
    switch (type) {
      case 'contact':
        automationName = contactSourceConfig.name || 'Contact Source Automation';
        automationDescription = contactSourceConfig.description || 'Automatic contact generation';
        scheduleConfig = { count: contactSourceConfig.contactCount, frequency: 'daily' };
        break;
      case 'email':
        if (!emailConfig.enabled) return;
        automationName = emailConfig.name;
        automationDescription = 'Email automation campaign';
        communicationChannels = ['email'];
        scheduleConfig = emailConfig.schedule;
        break;
      case 'sms':
        if (!smsConfig.enabled) return;
        automationName = smsConfig.name;
        automationDescription = 'SMS automation campaign';
        communicationChannels = ['sms'];
        scheduleConfig = smsConfig.schedule;
        break;
      case 'voicemail':
        if (!voicemailConfig.enabled) return;
        automationName = voicemailConfig.name;
        automationDescription = 'Voicemail automation campaign';
        communicationChannels = ['voicemail'];
        scheduleConfig = voicemailConfig.schedule;
        break;
      case 'call':
        if (!callConfig.enabled) return;
        automationName = callConfig.name;
        automationDescription = 'Call automation campaign';
        communicationChannels = ['call'];
        scheduleConfig = callConfig.schedule;
        break;
      default:
        return;
    }

    newAutomation = {
      id: Date.now().toString(),
      name: automationName,
      description: automationDescription,
      status: 'draft',
      createdAt: new Date().toISOString(),
      steps: {
        source: type === 'contact' ? 'zillow' : 'manual',
        contactCount: scheduleConfig.count,
        pipeline: contactSourceConfig.pipeline,
        communicationChannels,
        schedule: scheduleConfig
      }
    };

    setAutomations(prev => [...prev, newAutomation]);
    toast.success(`${automationName} created successfully!`);
    setActiveModule(null);
  };

  // Add missing functions
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
        automation.description || '',
        contactSourceConfig.searchQuery,
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
      {/* Documentation Section */}
      {!activeModule && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Automations Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Create and manage independent automation workflows for your real estate business. Each automation type can be configured and run separately.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
              <div className="flex items-start">
                <BuildingLibraryIcon className="h-6 w-6 text-indigo-600 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium text-indigo-900">Contact Source</h3>
                  <p className="text-sm text-indigo-800">Automatically scrape property contacts from Zillow based on your criteria.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
              <div className="flex items-start">
                <EnvelopeIcon className="h-6 w-6 text-indigo-600 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium text-indigo-900">Email Campaigns</h3>
                  <p className="text-sm text-indigo-800">Schedule automated emails with templates to engage your leads.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-md border border-green-100">
              <div className="flex items-start">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium text-green-900">SMS Campaigns</h3>
                  <p className="text-sm text-green-800">Send scheduled text messages to nurture your prospects.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-md border border-amber-100">
              <div className="flex items-start">
                <PhoneIcon className="h-6 w-6 text-amber-600 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium text-amber-900">Call & Voicemail</h3>
                  <p className="text-sm text-amber-800">Schedule ringless voicemails and automated calls to follow up with leads.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Selection */}
      {!activeModule && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Automation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Contact Source Module */}
            <div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
              onClick={() => setActiveModule('contact')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <BuildingLibraryIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Contact Source</h3>
                <p className="text-gray-500 text-sm">Scrape or import contacts</p>
              </div>
            </div>
            
            {/* Email Module */}
            <div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
              onClick={() => setActiveModule('email')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <EnvelopeIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Email Automation</h3>
                <p className="text-gray-500 text-sm">Schedule automated emails</p>
              </div>
            </div>
            
            {/* SMS Module */}
            <div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
              onClick={() => setActiveModule('sms')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">SMS Automation</h3>
                <p className="text-gray-500 text-sm">Schedule automated text messages</p>
              </div>
            </div>
            
            {/* Voicemail Module */}
            <div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
              onClick={() => setActiveModule('voicemail')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <PhoneIcon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Voicemail Automation</h3>
                <p className="text-gray-500 text-sm">Schedule ringless voicemails</p>
              </div>
            </div>
            
            {/* Call Module */}
            <div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
              onClick={() => setActiveModule('call')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <PhoneIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Call Automation</h3>
                <p className="text-gray-500 text-sm">Schedule automated calls</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Source Module */}
      {activeModule === 'contact' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Contact Source Automation</h2>
            <button
              onClick={() => setActiveModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zillow Property Scraper Section */}
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
                      value={contactSourceConfig.searchQuery}
                      onChange={handleContactSourceInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 'Properties in Miami under $1M'"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Be specific about location, price range, and property type.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Contacts to Generate*
                  </label>
                  <input
                    type="number"
                    name="contactCount"
                    value={contactSourceConfig.contactCount}
                    onChange={handleContactSourceInputChange}
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
                  <h4 className="block text-sm font-medium text-gray-700 mb-2">Automation Name</h4>
                  <input
                    type="text"
                    name="name"
                    value={contactSourceConfig.name}
                    onChange={handleContactSourceInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Miami Properties Campaign'"
                  />
                </div>
              </div>
            </div>
            
            {/* Pipeline & Tags */}
            <div className="space-y-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Pipeline
                </label>
                <select
                  name="pipeline"
                  value={contactSourceConfig.pipeline}
                  onChange={handleContactSourceInputChange}
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
                  {contactSourceConfig.tags.map(tag => (
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
            
            {/* Submit button */}
            <div className="pt-5 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveModule(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateAutomation('contact')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Automation Module */}
      {activeModule === 'email' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Email Automation</h2>
            <button
              onClick={() => setActiveModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Enable automation toggle */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-md border border-indigo-100">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="font-medium text-indigo-900">Enable Email Automation</h3>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email-enabled"
                  checked={emailConfig.enabled}
                  onChange={handleEmailToggle}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="email-enabled" className="ml-2 text-sm text-gray-700">
                  Enable
                </label>
              </div>
            </div>

            {emailConfig.enabled && (
              <>
                {/* Email Templates */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Email Templates</h3>
                  
                  <div className="space-y-3">
                    {availableTemplates.email.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{template.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`email-template-${template.id}`}
                            checked={emailConfig.templates.includes(template.id)}
                            onChange={(e) => handleEmailTemplateSelection(template.id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Select the email templates to use in this automation. Templates will be sent in sequence.</p>
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Schedule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        name="schedule.frequency"
                        value={emailConfig.schedule.frequency}
                        onChange={handleEmailInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emails Per Run
                      </label>
                      <input
                        type="number"
                        name="schedule.count"
                        value={emailConfig.schedule.count}
                        onChange={handleEmailInputChange}
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
                        value={emailConfig.startDate}
                        onChange={handleEmailInputChange}
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
                        value={emailConfig.endDate}
                        onChange={handleEmailInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Automation Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={emailConfig.name}
                    onChange={handleEmailInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Weekly Property Updates'"
                  />
                </div>
                
                {/* Submit button */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateAutomation('email')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      disabled={!emailConfig.enabled || emailConfig.templates.length === 0}
                    >
                      Create Automation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SMS Automation Module */}
      {activeModule === 'sms' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">SMS Automation</h2>
            <button
              onClick={() => setActiveModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Enable automation toggle */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-100">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-900">Enable SMS Automation</h3>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms-enabled"
                  checked={smsConfig.enabled}
                  onChange={handleSmsToggle}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label htmlFor="sms-enabled" className="ml-2 text-sm text-gray-700">
                  Enable
                </label>
              </div>
            </div>
            
            {smsConfig.enabled && (
              <>
                {/* SMS Templates */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">SMS Templates</h3>
                  
                  <div className="space-y-3">
                    {availableTemplates.sms.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{template.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{template.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`sms-template-${template.id}`}
                            checked={smsConfig.templates.includes(template.id)}
                            onChange={(e) => handleSmsTemplateSelection(template.id, e.target.checked)}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Select the SMS templates to use in this automation. Messages will be sent in sequence.</p>
                  </div>
                </div>
                
                {/* Schedule Configuration */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Schedule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        name="schedule.frequency"
                        value={smsConfig.schedule.frequency}
                        onChange={handleSmsInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMS Per Run
                      </label>
                      <input
                        type="number"
                        name="schedule.count"
                        value={smsConfig.schedule.count}
                        onChange={handleSmsInputChange}
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
                        value={smsConfig.startDate}
                        onChange={handleSmsInputChange}
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
                        value={smsConfig.endDate}
                        onChange={handleSmsInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Automation Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={smsConfig.name}
                    onChange={handleSmsInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Property Alert SMS Campaign'"
                  />
                </div>
                
                {/* Submit button */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateAutomation('sms')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      disabled={!smsConfig.enabled || smsConfig.templates.length === 0}
                    >
                      Create Automation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Voicemail Automation Module */}
      {activeModule === 'voicemail' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Voicemail Automation</h2>
            <button
              onClick={() => setActiveModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Enable automation toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-md border border-amber-100">
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-medium text-amber-900">Enable Ringless Voicemail Automation</h3>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="voicemail-enabled"
                  checked={voicemailConfig.enabled}
                  onChange={handleVoicemailToggle}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                />
                <label htmlFor="voicemail-enabled" className="ml-2 text-sm text-gray-700">
                  Enable
                </label>
              </div>
            </div>
            
            {voicemailConfig.enabled && (
              <>
                {/* Voicemail Templates */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Voicemail Templates</h3>
                  
                  <div className="space-y-3">
                    {availableTemplates.voicemail.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{template.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{template.transcription.substring(0, 70)}...</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`voicemail-template-${template.id}`}
                            checked={voicemailConfig.templates.includes(template.id)}
                            onChange={(e) => handleVoicemailTemplateSelection(template.id, e.target.checked)}
                            className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Select the voicemail templates to use in this automation. Scripts will be delivered in sequence.</p>
                  </div>
                </div>
                
                {/* Schedule Configuration */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Schedule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        name="schedule.frequency"
                        value={voicemailConfig.schedule.frequency}
                        onChange={handleVoicemailInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voicemails Per Run
                      </label>
                      <input
                        type="number"
                        name="schedule.count"
                        value={voicemailConfig.schedule.count}
                        onChange={handleVoicemailInputChange}
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
                        value={voicemailConfig.startDate}
                        onChange={handleVoicemailInputChange}
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
                        value={voicemailConfig.endDate}
                        onChange={handleVoicemailInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Automation Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={voicemailConfig.name}
                    onChange={handleVoicemailInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Property Voicemail Campaign'"
                  />
                </div>
                
                {/* Submit button */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateAutomation('voicemail')}
                      className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                      disabled={!voicemailConfig.enabled || voicemailConfig.templates.length === 0}
                    >
                      Create Automation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Call Automation Module */}
      {activeModule === 'call' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Call Automation</h2>
            <button
              onClick={() => setActiveModule(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Enable automation toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">Enable Automated Calls</h3>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="call-enabled"
                  checked={callConfig.enabled}
                  onChange={handleCallToggle}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="call-enabled" className="ml-2 text-sm text-gray-700">
                  Enable
                </label>
              </div>
            </div>
            
            {callConfig.enabled && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700">
                      Automated calls use your default call script configured in the phone settings.
                    </p>
                  </div>
                </div>
                
                {/* Call Configuration */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Call Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Call Schedule
                      </label>
                      <select
                        name="callSchedule"
                        value={callConfig.callSchedule}
                        onChange={handleCallInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
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
                        value={callConfig.callDelay}
                        onChange={handleCallInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
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
                        name="skipVoicemailRecipients"
                        checked={callConfig.skipVoicemailRecipients}
                        onChange={(e) => setCallConfig(prev => ({
                          ...prev,
                          skipVoicemailRecipients: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="skipVoicemailRecipients" className="ml-2 text-sm text-gray-700">
                        Skip contacts who received a voicemail
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Schedule Configuration */}
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Schedule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        name="schedule.frequency"
                        value={callConfig.schedule.frequency}
                        onChange={handleCallInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calls Per Run
                      </label>
                      <input
                        type="number"
                        name="schedule.count"
                        value={callConfig.schedule.count}
                        onChange={handleCallInputChange}
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
                        value={callConfig.startDate}
                        onChange={handleCallInputChange}
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
                        value={callConfig.endDate}
                        onChange={handleCallInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Automation Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={callConfig.name}
                    onChange={handleCallInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 'Property Call Campaign'"
                  />
                </div>
                
                {/* Submit button */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateAutomation('call')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={!callConfig.enabled}
                    >
                      Create Automation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

    </div>
  );

  return (
    <DashboardLayout title="Automations">
      <div className="flex justify-between items-center mb-8 px-4 pt-4">
        <h1 className="text-3xl font-bold text-gray-900"></h1>
      </div>
      {pageContent}
      <Toaster position="top-right" />
    </DashboardLayout>
  );
} 