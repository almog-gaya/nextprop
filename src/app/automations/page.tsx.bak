
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Pipeline, AutomationData } from '@/types';
import CampaignSettingsForm from '@/components/ringless-voicemail/CampaignSettingsForm';
import AutomationHeader from '@/components/automations/AutomationHeader';
import PropertySearchConfig from '@/components/automations/PropertySearchConfig';
import PipelineSelector from '@/components/automations/PipelineSelector';
import PropertyCountConfig from '@/components/automations/PropertyCountConfig';
import SmsTemplateConfig from '@/components/automations/SmsTemplateConfig';
import JobStatusCard from '@/components/automations/JobStatusCard';
import ActionButtons from '@/components/automations/ActionButtons';
import { AutomationTaskCreateParams } from '@/types/automation_task_create_params';
import { useAuth } from '@/contexts/AuthContext';
import PhoneNumberSelector from '@/components/automations/PhoneNumberSelector';
import { convertTo24Hour, dayMapping } from '@/utils/appUtils';
import { collection, query, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
const MAX_CONTACTS_PER_DAY = 2;
const MAX_PROPERTY_PER_RUN = 60;
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const DataCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-100">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {children}
  </div>
);

// New Popup Component for Contacts
const ContactsPopup = ({ isOpen, onClose, contacts, campaignName }: { isOpen: boolean; onClose: () => void; contacts: any[]; campaignName: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Contacts for {campaignName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map(contact => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.first_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.street_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={contact.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No contacts available for this campaign.</p>
        )}
      </div>
    </div>
  );
};

export default function AutomationsPage() {
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [propertyCount, setPropertyCount] = useState(MAX_CONTACTS_PER_DAY);
  const [automationData, setAutomationData] = useState<AutomationData[]>([]);
  const { user } = useAuth();
  // State for popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContacts, setPopupContacts] = useState<any[]>([]);
  const [popupCampaignName, setPopupCampaignName] = useState('');

  const [propertyConfig, setPropertyConfig] = useState<AutomationTaskCreateParams>({
    customer_id: user?.id || '',
    pipeline_id: '',
    stage_id: '',
    limit: MAX_PROPERTY_PER_RUN,
    redfin_url: '',
    campaign_payload: {
      name: 'Recurring Automation Job',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      time_window: { start: '9:00 AM', end: '5:00 PM' },
      timezone: 'America/New_York',
      channels: {
        sms: {
          max_calls_per_hour: MAX_CONTACTS_PER_DAY,
          enabled: true,
          message: `Hi {{first_name}}, this is ${user?.firstName} from NextProp. I'm reaching out about your property. I noticed it's been on the market for 90+ days. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.`,
          time_interval: 3000, // 50 mints (stale)
          from_number: ''
        }
      }
    }
  });

  // Fetch data from Firestore for multiple automations
  useEffect(() => {
    if (!user?.locationId) return;

    const automationQuery = query(
      collection(db, 'automations'),
      where('customer_id', '==', user.locationId)
    );
    console.log(`Fetching automations for customer_id: ${user.locationId}`);

    const unsubscribeAutomation = onSnapshot(automationQuery, async (snapshot) => {
      const automations: AutomationData[] = [];
      const promises = snapshot.docs.map(async (automationDoc) => {
        const automation: AutomationData = { id: automationDoc.id, ...automationDoc.data() } as AutomationData;
        let campaignData = null;
        let contactsData = [];

        if (automation.campaign_id) {
          const campaignSnap = await getDoc(doc(db, `campaigns/${automation.campaign_id}`));
          if (campaignSnap.exists()) {
            campaignData = campaignSnap.data();

            const contactsQuery = query(collection(db, `campaigns/${automation.campaign_id}/contacts`));
            const contactsSnapshot = await getDocs(contactsQuery);
            contactsData = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        }

        return { automation, campaignData, contactsData };
      });

      const results = await Promise.all(promises);
      results.forEach(({ automation, campaignData, contactsData }) => {
        automations.push({
          ...automation,
          campaignData,
          contactsData
        });
      });

      setAutomationData(automations);
    }, (error) => {
      console.error('Error fetching automations:', error);
      toast.error('Failed to load automation data');
    });

    return () => unsubscribeAutomation();
  }, [user?.locationId]);

  // Fetch pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch('/api/pipelines');
        if (!response.ok) throw new Error('Failed to fetch pipelines');
        const data = await response.json();
        let pipelineData: Pipeline[] = [];
        if (Array.isArray(data) && data.length > 0) {
          pipelineData = data.map((pipeline: any) => ({ id: pipeline.id, name: pipeline.name, stages: pipeline.stages || [] }));
        } else if (data.pipelines && Array.isArray(data.pipelines)) {
          pipelineData = data.pipelines.map((pipeline: any) => ({ id: pipeline.id, name: pipeline.name, stages: pipeline.stages || [] }));
        } else {
          const extractedArrays = Object.values(data).filter(value => Array.isArray(value) && value.length > 0 && value[0] && 'id' in value[0]);
          if (extractedArrays.length > 0) {
            pipelineData = (extractedArrays[0] as any[]).map((pipeline: any) => ({ id: pipeline.id, name: pipeline.name, stages: pipeline.stages || [] }));
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

  // Poll job status
  useEffect(() => {
    if (!activeJobId) return;
    const unsubscribe = onSnapshot(doc(db, 'automations', activeJobId), (doc) => {
      if (doc.exists()) {
        const statusData = doc.data();
        setJobStatus(statusData);
        if (['completed', 'failed', 'cancelled'].includes(statusData.status)) {
          setTimeout(() => { setIsJobRunning(false); setActiveJobId(null); }, 5000);
        }
      }
    });
    return () => unsubscribe();
  }, [activeJobId]);

  function calculateDelayForXContacts(timeStart: string, timeEnd: string, contactLenght: number): number {
    // validate contactLength to throw error
    if (contactLenght < 1 || contactLenght >= 20) {
      throw new Error('Contact length must be between 1 and 20');
    }
    console.log(`timeStart: ${timeStart}, timeEnd: ${timeEnd}`);

    if (!timeStart || !timeEnd) {
      console.error('Invalid inputs: timeStart or timeEnd is missing');
      return 0;
    }

    const convertTo24Hour = (time: string): string => {
      try {
        const [timePart, period] = time.trim().split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) throw new Error('Invalid time format');
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error parsing time format:', error);
        throw error;
      }
    };

    let startTime: string, endTime: string;
    try {
      startTime = convertTo24Hour(timeStart);
      endTime = convertTo24Hour(timeEnd);
    } catch (error) {
      return 0;
    }

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid time format after conversion');
      return 0;
    }

    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 0) hours += 24;

    if (hours <= 0) {
      console.error('Invalid time range: end time is not after start time');
      return 0;
    }

    const contacts = contactLenght;
    const delayInHours = hours / (contacts - 1);
    const delayInMinutes = Math.round(delayInHours * 60);

    return delayInMinutes;
  }

  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'propertyCount') {
      // uncomment to calculate count dynamically from input field
      // const count = parseInt(value, 10);
      // const validCount = isNaN(count) ? 20 : Math.min(Math.max(1, count), 20);
      const validCount = MAX_CONTACTS_PER_DAY;
      setPropertyCount(validCount);
      setPropertyConfig(prev => ({ ...prev, limit: validCount }));
    } else if (name === 'redfin_url') {
      setPropertyConfig(prev => ({ ...prev, redfin_url: value }));
    }
  };

  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pipelineId = e.target.value;
    const selectedPipeline = pipelines.find(p => p.id === pipelineId);
    const stageId = selectedPipeline?.stages?.[0]?.id || '';
    if (!stageId) return toast.error('Please select a valid stage');
    setPropertyConfig(prev => ({ ...prev, pipeline_id: pipelineId, stage_id: stageId }));
  };

  const handleSmsTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPropertyConfig(prev => ({
      ...prev,
      campaign_payload: { ...prev.campaign_payload, channels: { ...prev.campaign_payload.channels, sms: { ...prev.campaign_payload.channels.sms, message: e.target.value } } }
    }));
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = `${text.substring(0, start)}{{${placeholder}}}${text.substring(end)}`;
    setPropertyConfig(prev => ({
      ...prev,
      campaign_payload: { ...prev.campaign_payload, channels: { ...prev.campaign_payload.channels, sms: { ...prev.campaign_payload.channels.sms, message: newText } } }
    }));
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4); }, 0);
  };

  const getNextStageIdByPipelineId = (pipelineId: string, currentStageId: string): string | null => {
    if (!pipelineId || !currentStageId) {
      console.warn('Invalid input: pipelineId and currentStageId are required');
      return null;
    }

    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline || !Array.isArray(pipeline.stages) || pipeline.stages.length === 0) {
      console.warn(`Pipeline not found or has no stages: ${pipelineId}`);
      return null;
    }

    const validStages = pipeline.stages.every(stage => stage && typeof stage.id === 'string');
    if (!validStages) {
      console.warn(`Invalid stage structure in pipeline: ${pipelineId}`);
      return null;
    }

    const currentStageIndex = pipeline.stages.findIndex((stage) => stage.id === currentStageId);

    if (currentStageIndex === -1) {
      console.warn(`Current stage not found: ${currentStageId}`);
      return null;
    }

    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= pipeline.stages.length) {
      console.warn('Already at the last stage');
      return null;
    }

    return pipeline.stages[nextIndex].id;
  };

  const handleRunNow = async () => {
    if (isJobRunning) return;
    propertyConfig.customer_id = user?.locationId || '';
    if (!propertyConfig.redfin_url) return toast.error('Please enter a Redfin URL for properties');
    if (!propertyConfig.pipeline_id) return toast.error('Please select a pipeline');
    if (!propertyConfig.customer_id) return toast.error('Customer ID is required');
    if (!propertyConfig.campaign_payload.channels.sms.from_number) return toast.error('SMS from number is required');
    const nextStageId = getNextStageIdByPipelineId(propertyConfig.pipeline_id, propertyConfig.stage_id);

    toast.loading('Starting property automation...', { id: 'property-job' });
    setIsJobRunning(true);

    if (nextStageId) {
      propertyConfig.next_stage_id = nextStageId;
    }
    try {
      // calculating delay dynamiaclly with given time window and contact count 
      const delayMinutes = calculateDelayForXContacts(propertyConfig.campaign_payload.time_window.start, propertyConfig.campaign_payload.time_window.end, MAX_CONTACTS_PER_DAY);
      const delayInSeconds = delayMinutes * 60;
      const createAutomationPayload = {
        ...propertyConfig,
        campaign_payload: {
          ...propertyConfig.campaign_payload,
          days: propertyConfig.campaign_payload.days.map(day => dayMapping[day]),
          time_window: { start: convertTo24Hour(propertyConfig.campaign_payload.time_window.start), end: convertTo24Hour(propertyConfig.campaign_payload.time_window.end) },
          channels: {
            sms: {
              ...propertyConfig.campaign_payload.channels.sms,
              time_interval: delayInSeconds, 

            }
          }
        }
      };


      const result = await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createAutomationPayload) });
      const resultData = await result.json();
      if (!result.ok) throw new Error(`Failed to start automation: ${resultData.message || 'Unknown error'}`);
      toast.success('Automation started successfully!', { id: 'property-job' });
      setActiveJobId(resultData.task_id);
    } catch (error: any) {
      console.error('Error starting automation:', error);
      toast.error(`Failed to start automation: ${error.message}`, { id: 'property-job' });
      setIsJobRunning(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJobId) return;
    try {
      toast.success('Job cancelled successfully');
      setIsJobRunning(false);
      setActiveJobId(null);
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel job');
    }
  };

  // Handle opening the contacts popup
  const handleShowContacts = (contacts: any[], campaignName: string) => {
    setPopupContacts(contacts);
    setPopupCampaignName(campaignName);
    setIsPopupOpen(true);
  };

  return (
    <DashboardLayout title="Property Automation">
      <div className="container mx-auto px-4 py-8">
        <AutomationHeader propertyCount={propertyCount} />

        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <div className="space-y-6">
            <div className="flex flex-row gap-6">
              <div className="flex-1"><PropertySearchConfig searchQuery={propertyConfig.redfin_url} onChange={handlePropertyInputChange} isJobRunning={isJobRunning} /></div>
              <div className="flex-1">
                <PhoneNumberSelector
                  isDisabled={isJobRunning}
                  phoneNumbers={user?.phoneNumbers?.map(number => number.phoneNumber) || []}
                  selectedPhoneNumber={propertyConfig.campaign_payload.channels.sms.from_number}
                  onPhoneNumberChange={(number) => setPropertyConfig(prev => ({ ...prev, campaign_payload: { ...prev.campaign_payload, channels: { ...prev.campaign_payload.channels, sms: { ...prev.campaign_payload.channels.sms, from_number: number } } } }))}
                />
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <PipelineSelector pipelineId={propertyConfig.pipeline_id} pipelines={pipelines} onChange={handlePipelineChange} isJobRunning={isJobRunning} loadingPipelines={loadingPipelines} />
              <PropertyCountConfig propertyCount={propertyCount} onChange={handlePropertyInputChange} isJobRunning={isJobRunning} />
            </div>

            <SmsTemplateConfig
              message={propertyConfig.campaign_payload.channels.sms.message}
              onChange={handleSmsTemplateChange}
              textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
              insertPlaceholder={insertPlaceholder}
              isJobRunning={isJobRunning}
            />

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Campaign Settings</h4>
              <CampaignSettingsForm
                settings={{
                  delayMinutes: 20,
                  dailyLimit: propertyCount,
                  startTime: propertyConfig.campaign_payload.time_window.start,
                  endTime: propertyConfig.campaign_payload.time_window.end,
                  timezone: propertyConfig.campaign_payload.timezone,
                  maxPerHour: 1,
                  daysOfWeek: propertyConfig.campaign_payload.days
                }}
                onSave={(newSettings) => {
                  const numberOfContacts = 2;
                  const delayMinutes = calculateDelayForXContacts(newSettings.startTime, newSettings.endTime, numberOfContacts);
                  console.log(`Delay to process ${numberOfContacts} contacts per day: ${delayMinutes} minutes`);
                  const delayInSeconds = delayMinutes * 60;
                  setPropertyConfig(prev => ({
                    ...prev,
                    campaign_payload: {
                      ...prev.campaign_payload,
                      days: newSettings.daysOfWeek.map(day => dayMapping[day] || day),
                      time_window: { start: convertTo24Hour(newSettings.startTime), end: convertTo24Hour(newSettings.endTime) },
                      timezone: newSettings.timezone,
                      channels: { ...prev.campaign_payload.channels, sms: { ...prev.campaign_payload.channels.sms, time_interval: delayInSeconds } }
                    }
                  }));
                  console.log(`Property count: `, propertyConfig);
                  setPropertyCount(newSettings.dailyLimit);
                }}
                isVoiceMailModule={false}
                isAutomationsModule={true}
              />
            </div>

            <ActionButtons isJobRunning={isJobRunning} handleCancelJob={handleCancelJob} handleRunNow={handleRunNow} hasSearchQuery={!!propertyConfig.redfin_url} />
          </div>
        </div>

        {isJobRunning && jobStatus && <JobStatusCard jobStatus={jobStatus} />}

        {/* Enhanced UI for Multiple Automations */}
        {automationData.length > 0 && automationData.map((automation, index) => (
          <div key={automation.id}>
            <DataCard title={`Automation Details #${index + 1}`}>
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Status:</strong> <StatusBadge status={automation.status} /></div>
                <div><strong>Redfin URL:</strong> <a href={automation.redfin_url} className="text-blue-600 hover:underline" target="_blank">{automation.redfin_url}</a></div>
                <div><strong>Last Run:</strong> {automation.last_run ? new Date(automation.last_run.seconds * 1000).toLocaleString() : 'N/A'}</div>
                <div><strong>Campaign Name:</strong> {automation.campaign_payload.name}</div>
                <div><strong>SMS Message:</strong> {automation.campaign_payload.channels.sms.message}</div>
                <div><strong>Days:</strong> {automation.campaign_payload.days.join(', ')}</div>
                <div><strong>Days Running:</strong> {automation.started_at ?
                  Math.ceil((Date.now() - automation.started_at.seconds * 1000) / (1000 * 60 * 60 * 24)) : 'N/A'
                } days</div>
              </div>
            </DataCard>
            <p className="mt-2 text-sm text-gray-500 italic">
              Note: This automation uses a web scraper to fetch property owner contacts from Redfin listings. The `Last run` indicates when the last time scraped the contacts.
            </p>

            {automation.campaignData && (
              <DataCard title={`Campaign Details #${index + 1}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Status:</strong> <StatusBadge status={automation.campaignData.status} /></div>
                  <div><strong>Total Contacts:</strong> {automation.campaignData.total_contacts}</div>
                  <div><strong>Processed Contacts:</strong> {automation.campaignData.delivered_contacts}</div>
                  <div><strong>Failed Contacts:</strong> {automation.campaignData.failed_contacts}</div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleShowContacts(automation.contactsData, automation.campaign_payload.name)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Show All Contacts
                  </button>
                </div>
              </DataCard>
            )}
            {automation.campaignData && (
              <p className="mt-2 text-sm text-gray-500 italic">
                Note: This indicates the sending of SMS to the scraped contacts. The `Total Contacts` shows how many contacts are scraped so far. The `Processed Contacts` shows how many contacts have been sent. The `Failed Contacts` shows how many contacts failed to send.
              </p>
            )}
          </div>
        ))}

        {automationData.length === 0 && (
          <p className="text-gray-500 text-center mt-4">No automations found.</p>
        )}

        {/* Contacts Popup */}
        <ContactsPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          contacts={popupContacts}
          campaignName={popupCampaignName}
        />

      </div>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
}