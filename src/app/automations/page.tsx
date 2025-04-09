"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Pipeline } from '@/types';
import CampaignSettingsForm from '@/components/ringless-voicemail/CampaignSettingsForm';
import AutomationHeader from '@/components/automations/AutomationHeader';
import AutomationToggle from '@/components/automations/AutomationToggle';
import PropertySearchConfig from '@/components/automations/PropertySearchConfig';
import PipelineSelector from '@/components/automations/PipelineSelector';
import PropertyCountConfig from '@/components/automations/PropertyCountConfig';
import SmsTemplateConfig from '@/components/automations/SmsTemplateConfig';
import JobStatusCard from '@/components/automations/JobStatusCard';
import ActionButtons from '@/components/automations/ActionButtons';
import { AutomationTaskCreateParams } from '@/types/automation_task_create_params';
import { useAuth } from '@/contexts/AuthContext';
import PhoneNumberSelector from '@/components/automations/PhoneNumberSelector';

export default function AutomationsPage() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [propertyCount, setPropertyCount] = useState(20); // Moved propertyCount to separate state
  const { user } = useAuth();

  const [propertyConfig, setPropertyConfig] = useState<AutomationTaskCreateParams>({
    customer_id: user?.id || '',
    pipeline_id: '',
    stage_id: '',
    redfin_url: '',
    campaign_payload: {
      name: 'Recurring Automation Job',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      time_window: {
        start: '09:00',
        end: '17:00'
      },
      timezone: 'America/New_York',
      channels: {
        sms: {
          enabled: true,
          message: `Hi {{first_name}}, this is ${user?.firstName} from NextProp. I\'m reaching out about your property. I noticed it\'s been on the market for 90+ days. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.`,
          time_interval: 5,
          from_number: '' // Should be set from user settings or API
        }
      }
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
        const status = { "status": "completed" };
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          setTimeout(() => {
            setIsJobRunning(false);
            setActiveJobId(null);
            localStorage.removeItem('activePropertyAutomationJob');
          }, 5000);
        }
      } catch (error) {
        console.error(`Error polling job:`, error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'propertyCount') {
      const count = parseInt(value, 10);
      const validCount = isNaN(count) ? 20 : Math.min(Math.max(1, count), 20);
      setPropertyCount(validCount);
    } else if (name === 'redfin_url') {
      setPropertyConfig(prev => ({
        ...prev,
        redfin_url: value
      }));
    }
  };

  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pipelineId = e.target.value;
    const selectedPipeline = pipelines.find(p => p.id === pipelineId);
    const stageId = selectedPipeline?.stages?.[0]?.id || ''; // Default to first stage or empty
    if(!stageId) {
      toast.error('Please select a valid stage');
      return;
    }
 
    setPropertyConfig(prev => ({
      ...prev,
      pipeline_id: pipelineId,
      stage_id: stageId
    }));
  };

  const handleSmsTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPropertyConfig(prev => ({
      ...prev,
      campaign_payload: {
        ...prev.campaign_payload,
        channels: {
          ...prev.campaign_payload.channels,
          sms: {
            ...prev.campaign_payload.channels.sms,
            message: e.target.value
          }
        }
      }
    }));
  };

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
      campaign_payload: {
        ...prev.campaign_payload,
        channels: {
          ...prev.campaign_payload.channels,
          sms: {
            ...prev.campaign_payload.channels.sms,
            message: newText
          }
        }
      }
    }));

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + placeholder.length + 4;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toggleAutomation = () => {
    const newStatus = !isAutomationEnabled;
    setIsAutomationEnabled(newStatus);

    if (newStatus) {
      toast.success('Daily property automation enabled');
    } else {
      toast.error('Daily property automation disabled');
    }
  };

  const handleRunNow = async () => {
    if (isJobRunning) return;

    if (!propertyConfig.redfin_url) {
      toast.error('Please enter a Redfin URL for properties');
      return;
    }

    if (!propertyConfig.pipeline_id) {
      toast.error('Please select a pipeline');
      return;
    }

    if (!propertyConfig.customer_id) {
      toast.error('Customer ID is required');
      return;
    }

    if (!propertyConfig.campaign_payload.channels.sms.from_number) {
      toast.error('SMS from number is required');
      return;
    }

    toast.loading('Starting property automation...', { id: 'property-job' });
    setIsJobRunning(true);

    try {
      console.log(`Payload to start automation:`, propertyConfig);
      // Note: You'll need to update startAutomation to accept AutomationTaskCreateParams
      const result = { jobId: '123' };
      toast.success('Automation started successfully!', { id: 'property-job' });

      setActiveJobId(result.jobId);
      localStorage.setItem('activePropertyAutomationJob', result.jobId);
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automation', { id: 'property-job' });
      setIsJobRunning(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJobId) return;

    try {
      //TODO: cancel job (delete)
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
        <AutomationHeader propertyCount={propertyCount} />

        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <AutomationToggle
            isAutomationEnabled={isAutomationEnabled}
            toggleAutomation={toggleAutomation}
          />

          <div className="space-y-6">
            <div className="flex flex-row gap-6">
              <div className="flex-1">
                <PropertySearchConfig
                  searchQuery={propertyConfig.redfin_url}
                  onChange={handlePropertyInputChange}
                  isJobRunning={isJobRunning}
                />
              </div>
              <div className="flex-1">
                <PhoneNumberSelector
                  isDisabled={isJobRunning}
                  phoneNumbers={user?.phoneNumbers?.map(number => number.phoneNumber) || []}
                  selectedPhoneNumber={propertyConfig.campaign_payload.channels.sms.from_number}
                  onPhoneNumberChange={(number) => {
                    setPropertyConfig(prev => ({
                      ...prev,
                      campaign_payload: {
                        ...prev.campaign_payload,
                        channels: {
                          ...prev.campaign_payload.channels,
                          sms: {
                            ...prev.campaign_payload.channels.sms,
                            from_number: number
                          }
                        }
                      }
                    }))
                  }}
                />
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <PipelineSelector
                pipelineId={propertyConfig.pipeline_id}
                pipelines={pipelines}
                onChange={handlePipelineChange}
                isJobRunning={isJobRunning}
                loadingPipelines={loadingPipelines}
              />
              <PropertyCountConfig
                propertyCount={propertyCount}
                onChange={handlePropertyInputChange}
                isJobRunning={isJobRunning}
              />
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
              <div className="flex flex-row gap-4 flex-wrap">
                <CampaignSettingsForm
                  settings={{
                    delayMinutes: propertyConfig.campaign_payload.channels.sms.time_interval,
                    dailyLimit: propertyCount,
                    startTime: propertyConfig.campaign_payload.time_window.start,
                    endTime: propertyConfig.campaign_payload.time_window.end,
                    timezone: propertyConfig.campaign_payload.timezone,
                    maxPerHour: 100, // Could be derived from time_interval
                    daysOfWeek: propertyConfig.campaign_payload.days
                  }}
                  onSave={(newSettings) => {
                    setPropertyConfig(prev => ({
                      ...prev,
                      campaign_payload: {
                        ...prev.campaign_payload,
                        days: newSettings.daysOfWeek,
                        time_window: {
                          start: newSettings.startTime,
                          end: newSettings.endTime
                        },
                        timezone: newSettings.timezone,
                        channels: {
                          ...prev.campaign_payload.channels,
                          sms: {
                            ...prev.campaign_payload.channels.sms,
                            time_interval: newSettings.delayMinutes
                          }
                        }
                      }
                    }));
                    setPropertyCount(newSettings.dailyLimit);
                  }}
                  isVoiceMailModule={false}
                />
              </div>
            </div>

            <ActionButtons
              isJobRunning={isJobRunning}
              handleCancelJob={handleCancelJob}
              handleRunNow={handleRunNow}
              isAutomationEnabled={isAutomationEnabled}
              hasSearchQuery={!!propertyConfig.redfin_url}
            />
          </div>
        </div>

        {isJobRunning && jobStatus && (
          <JobStatusCard jobStatus={jobStatus} />
        )}
      </div>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
}