"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Pipeline, AutomationData } from '@/types'; // Updated import
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

export default function AutomationsPage() {
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [propertyCount, setPropertyCount] = useState(2);
  const [automationData, setAutomationData] = useState<AutomationData | null>(null); // Updated type
  const [campaignData, setCampaignData] = useState<any>(null);
  const [contactsData, setContactsData] = useState<any[]>([]);
  const { user } = useAuth();

  const [propertyConfig, setPropertyConfig] = useState<AutomationTaskCreateParams>({
    customer_id: user?.id || '',
    pipeline_id: '',
    stage_id: '',
    limit: propertyCount,
    redfin_url: '',
    campaign_payload: {
      name: 'Recurring Automation Job',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      time_window: { start: '9:00 AM', end: '5:00 PM' },
      timezone: 'America/New_York',
      channels: {
        sms: {
          enabled: true,
          message: `Hi {{first_name}}, this is ${user?.firstName} from NextProp. I\'m reaching out about your property. I noticed it\'s been on the market for 90+ days. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.`,
          time_interval: 5,
          from_number: ''
        }
      }
    }
  });

  // Fetch data from Firestore
  useEffect(() => {
    if (!user?.locationId) return;

    const automationQuery = query(
      collection(db, 'automations'),
      where('customer_id', '==', user.locationId)
    );
    console.log(`Fetching automation for customer_id: ${user.locationId}`);

    const unsubscribeAutomation = onSnapshot(automationQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const automationDoc = snapshot.docs[0];
        const automationData: AutomationData = { id: automationDoc.id, ...automationDoc.data() } as AutomationData; // Type assertion
        setAutomationData(automationData);
        setActiveJobId(automationData.id);

        if (automationData.campaign_id) {
          const campaignSnap = await getDoc(doc(db, `campaigns/${automationData.campaign_id}`));
          if (campaignSnap.exists()) {
            setCampaignData(campaignSnap.data());

            const contactsQuery = query(collection(db, `campaigns/${automationData.campaign_id}/contacts`));
            const contactsSnapshot = await getDocs(contactsQuery);
            const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setContactsData(contacts);
          }
        }

        setPropertyConfig(prev => ({
          ...prev,
          ...automationData,
          campaign_payload: { ...prev.campaign_payload, ...automationData.campaign_payload }
        }));
        setPropertyCount(automationData.limit || 2);
      }
    }, (error) => {
      console.error('Error fetching automation:', error);
      toast.error('Failed to load automation data');
    });

    return () => unsubscribeAutomation();
  }, [user?.id]);

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

  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'propertyCount') {
      const count = parseInt(value, 10);
      const validCount = isNaN(count) ? 20 : Math.min(Math.max(1, count), 20);
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
    // Input validation
    if (!pipelineId || !currentStageId) {
      console.warn('Invalid input: pipelineId and currentStageId are required');
      return null;
    }

    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline || !Array.isArray(pipeline.stages) || pipeline.stages.length === 0) {
      console.warn(`Pipeline not found or has no stages: ${pipelineId}`);
      return null;
    }

    // Ensure stages array is valid and has required properties
    const validStages = pipeline.stages.every(stage => stage && typeof stage.id === 'string');
    if (!validStages) {
      console.warn(`Invalid stage structure in pipeline: ${pipelineId}`);
      return null;
    }

    const currentStageIndex = pipeline.stages.findIndex((stage) => stage.id === currentStageId);

    // Check if current stage exists and if next stage is available
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
    if (!propertyConfig.redfin_url) return toast.error('Please enter a Redfin URL for properties');
    if (!propertyConfig.pipeline_id) return toast.error('Please select a pipeline');
    if (!propertyConfig.customer_id) return toast.error('Customer ID is required');
    if (!propertyConfig.campaign_payload.channels.sms.from_number) return toast.error('SMS from number is required');
    const nextStageId = getNextStageIdByPipelineId(propertyConfig.pipeline_id, propertyConfig.stage_id);


    // See if there is any existing automation running
    const automationQuery = query(collection(db, 'automations'), where('customer_id', '==', user?.id));
    const automationSnapshot = await getDocs(automationQuery);
    if (!automationSnapshot.empty) {
      return toast.error('There is already an automation running');
    }
    toast.loading('Starting property automation...', { id: 'property-job' });
    setIsJobRunning(true);

    if (nextStageId) {
      propertyConfig.next_stage_id = nextStageId;
    }
    try {
      const createAutomationPayload = {
        ...propertyConfig,
        campaign_payload: {
          ...propertyConfig.campaign_payload,
          days: propertyConfig.campaign_payload.days.map(day => dayMapping[day]),
          time_window: { start: convertTo24Hour(propertyConfig.campaign_payload.time_window.start), end: convertTo24Hour(propertyConfig.campaign_payload.time_window.end) }
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
                  // Calculate the delay (in minutes) to process exactly 20 contacts per day within the given time frame
                  // timeStart and timeEnd are in "H:mm AM/PM" format (e.g., "9:00 AM", "5:00 PM")
                  function calculateDelayFor20Contacts(timeStart: string, timeEnd: string): number {
                    console.log(`timeStart: ${timeStart}, timeEnd: ${timeEnd}`);

                    // Validate inputs
                    if (!timeStart || !timeEnd) {
                      console.error('Invalid inputs: timeStart or timeEnd is missing');
                      return 0;
                    }

                    // Convert 12-hour AM/PM time to 24-hour format
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
                      startTime = convertTo24Hour(timeStart); // e.g., "9:00 AM" -> "09:00"
                      endTime = convertTo24Hour(timeEnd); // e.g., "5:00 PM" -> "17:00"
                    } catch (error) {
                      return 0;
                    }

                    // Parse start and end times
                    const start = new Date(`1970-01-01T${startTime}:00`);
                    const end = new Date(`1970-01-01T${endTime}:00`);

                    // Validate parsed dates
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                      console.error('Invalid time format after conversion');
                      return 0;
                    }

                    // Calculate hours in the time window
                    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (hours < 0) hours += 24; // Handle cross-day times

                    // Validate time window
                    if (hours <= 0) {
                      console.error('Invalid time range: end time is not after start time');
                      return 0;
                    }

                    // Calculate delay for exactly 20 contacts
                    const contacts = 20;
                    const delayInHours = hours / (contacts - 1); // Delay between contacts
                    const delayInMinutes = Math.round(delayInHours * 60); // Convert to minutes and round

                    return delayInMinutes;
                  }
                  const delayMinutes = calculateDelayFor20Contacts( newSettings.startTime, newSettings.endTime);
                  console.log(`Delay to process 20 contacts per day: ${delayMinutes} minutes`);
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
                  console.log(`Propery count: `, propertyConfig)
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

        {/* Enhanced UI for Data */}
        {automationData && (
          <DataCard title="Automation Details">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Status:</strong> <StatusBadge status={automationData.status} /></div>
              <div><strong>Redfin URL:</strong> <a href={automationData.redfin_url} className="text-blue-600 hover:underline" target="_blank">{automationData.redfin_url}</a></div>
              <div><strong>Last Run:</strong> {automationData.last_run ? new Date(automationData.last_run.seconds * 1000).toLocaleString() : 'N/A'}</div>
              <div><strong>Campaign Name:</strong> {automationData.campaign_payload.name}</div>
              <div><strong>SMS Message:</strong> {automationData.campaign_payload.channels.sms.message}</div>
              <div><strong>Days:</strong> {automationData.campaign_payload.days.join(', ')}</div>
              {/* Created at so show total days running */}
              <div><strong>Days Running:</strong> {automationData.started_at ?
                Math.ceil((Date.now() - automationData.started_at.seconds * 1000) / (1000 * 60 * 60 * 24)) : 'N/A'
              } days</div>
            </div>
          </DataCard>
        )}
        {automationData && <p className="mt-2 text-sm text-gray-500 italic">
          Note: This automation uses a web scraper to fetch property owner contacts from Redfin listings. The `Last run` indicates when the last time scraped the contacts
        </p>}
        {campaignData && (
          <DataCard title="Campaign Details">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Status:</strong> <StatusBadge status={campaignData.status} /></div>
              <div><strong>Total Contacts:</strong> {campaignData.total_contacts}</div>
              <div><strong>Processed Contacts:</strong> {campaignData.processed_contacts}</div>
              <div><strong>Failed Contacts:</strong> {campaignData.failed_contacts}</div>
            </div>
          </DataCard>
        )}
        {campaignData && <p className="mt-2 text-sm text-gray-500 italic">
          Note: This indicates the sending of SMS to the scrapped contacts. The `Total Contacts` shows till now how many contacts are scrapped. The `Processed Contacts` shows till now how many contacts are sent. The `Failed Contacts` shows till now how many contacts are failed to send.
        </p>}
        {contactsData.length > 0 && (
          <DataCard title="Contacts">
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
                  {contactsData.map(contact => (
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
          </DataCard>
        )}
        {contactsData.length > 0 && <p className="mt-2 text-sm text-gray-500 italic">
          Note: This shows all the contacts that are Pending, Sent and Failed.
        </p>}
      </div>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
}