"use client";

import React, { useState, useEffect } from 'react';
import { Tab, TabGroup, TabPanel, TabPanels } from '@headlessui/react';
import classNames from 'classnames';
import { BellIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Pipeline } from '@/types';
import { Stage } from '@/components/dashboard/StageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { NotificationSettings, NotificationPreferences } from '@/types/notifications';
import NotificationTray from '@/components/notification/NotificationTray';
import { isWorkflowExists, getCurrentWorkflowId, createWorkFlow, updateWorkFlow, deleteWorkFlow } from '@/lib/ghl-service';

const WORKFLOW_NAME = 'Opportunity Created Notification Trigger';
// Add this CSS to hide scrollbar but allow scrolling
const globalStyles = `
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

export default function NotificationsPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0); 
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<NotificationPreferences | null>(null);
  const [hasDocument, setHasDocument] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add pipeline states for each notification type
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  
  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newCall: [],
    newSMS: [],
    leadStatusChange: [],
    newLeadAssigned: []
  });

  // Get stages for each selected pipeline
  const newCallStages = pipelines.find(p => p.id === preferences.newCall[0]?.pipelineId)?.stages || [];
  const newSMSStages = pipelines.find(p => p.id === preferences.newSMS[0]?.pipelineId)?.stages || [];
  const leadStatusStages = pipelines.find(p => p.id === preferences.leadStatusChange[0]?.pipelineId)?.stages || [];

  // if workflow for lead assignd notification is exists then set the hasDocument to true and change it to enable
  const isWorkflowEnabledInGhl = async () => {
    const workflowId = await getCurrentWorkflowId(WORKFLOW_NAME);
    if(workflowId) {
      setHasDocument(true);
      setPreferences(prev => ({
        ...prev,
        newLeadAssigned: [{
          pipelineId: '',
          pipelineName: '',
          stageId: '',
          stageName: '',
          enabled: true
        }]
      }));
    }
  }
  
  // Fetch pipelines and notification preferences on mount
  useEffect(() => {
    if (user?.locationId) {
      fetchPipelines();
      fetchNotificationPreferences();
      isWorkflowEnabledInGhl();
    }
  }, [user?.locationId]);

  // Check for changes whenever preferences are updated
  useEffect(() => {
    if (initialPreferences) {
      const hasChanged = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
      setHasChanges(hasChanged);
    }
  }, [preferences, initialPreferences]);

  const fetchNotificationPreferences = async () => {
    if (!user?.locationId) return;

    try {
      const docRef = doc(db, 'app-notifications', user.locationId);
      const docSnap = await getDoc(docRef);
      console.log('Document exists:', docSnap.exists()); // Debug log

      if (docSnap.exists()) {
        const data = docSnap.data() as NotificationSettings;
        setPreferences(data.preferences);
        setInitialPreferences(data.preferences);
        setHasDocument(true);
      } else {
        console.log('No document found, setting hasDocument to false'); // Debug log
        setHasDocument(false);
        setPreferences({
          newCall: [],
          newSMS: [],
          leadStatusChange: [],
          newLeadAssigned: []
        });
        setInitialPreferences(null);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
      setHasDocument(false);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('State changed:', { loading, hasDocument }); // Debug log
  }, [loading, hasDocument]);

  const updateLocalPreference = (
    type: keyof NotificationPreferences,
    pipelineId: string,
    stageId: string,
    enabled: boolean
  ) => {
    // Find pipeline and stage names
    const pipeline = pipelines.find(p => p.id === pipelineId);
    const stage = pipeline?.stages?.find(s => s.id === stageId);
    
    const newPreference = { 
      pipelineId, 
      pipelineName: pipeline?.name || '',
      stageId: type === 'newLeadAssigned' ? '' : stageId, // Don't set stageId for newLeadAssigned
      stageName: type === 'newLeadAssigned' ? '' : stage?.name || '', // Don't set stageName for newLeadAssigned
      enabled 
    };
    
    // Update the specific preference type, maintaining only one item in the array
    setPreferences(prev => ({
      ...prev,
      [type]: [newPreference] // Always set as single item array
    }));
  };

  const toggleNotification = (type: keyof NotificationPreferences) => {
    const currentPreference = preferences[type][0];
    if (currentPreference) {
      // If we have a preference, toggle its enabled state
      updateLocalPreference(
        type,
        currentPreference.pipelineId,
        currentPreference.stageId,
        !currentPreference.enabled
      );
    } else {
      // If no preference exists, create a new one with enabled=true but no pipeline/stage
      setPreferences(prev => ({
        ...prev,
        [type]: [{
          pipelineId: '',
          pipelineName: '',
          stageId: '',
          stageName: '',
          enabled: true
        }]
      }));
    }
  };

  const handleUpdateSettings = async () => {
    if (!user?.locationId) return;

    // Validate all enabled notifications have pipeline and stage, except for newLeadAssigned
    const invalidPreferences = Object.entries(preferences).filter(([type, prefs]) => {
      const pref = prefs[0];
      
      // Skip validation for newLeadAssigned
      if (type === 'newLeadAssigned') return false;
      // For other types, check both pipeline and stage
      return pref?.enabled && (!pref.pipelineId || !pref.stageId);
    });

    if (invalidPreferences.length > 0) {
      console.log('invalidPreferences', invalidPreferences);
      // toast.error('Please select both pipeline and stage for all enabled notifications');
      return;
    }

    setIsUpdating(true);
    try {
      const docRef = doc(db, 'app-notifications', user.locationId);
      await updateDoc(docRef, {
        preferences,
        updatedAt: new Date()
      });
      setInitialPreferences(preferences);
      setHasChanges(false);
      //
      // Update the workflow if lead assigned notification is enabled or disabled
      // Ensure dont create the workflow if it already exists
      //
      if(preferences.newLeadAssigned[0]?.enabled) {
        const uuidTemplateId = crypto.randomUUID();
        const workflowResponse = await createWorkFlow(WORKFLOW_NAME);
        const workflowId = workflowResponse.workflowId;
        const triggerId = workflowResponse.triggerId;
        const updateWorkflow = await updateWorkFlow(workflowId, triggerId, uuidTemplateId, WORKFLOW_NAME);
        console.log('updateWorkflow', updateWorkflow);
        
      } else {
        const workflowId = await getCurrentWorkflowId(WORKFLOW_NAME);
        if(workflowId) {
          await deleteWorkFlow(workflowId, WORKFLOW_NAME);
        }
      }

      toast.success('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchPipelines = async () => {
    try {
      const response = await axios.get('/api/pipelines');
      const fetchedPipelines = response.data.pipelines || [];
      setPipelines(fetchedPipelines);
    } catch (error) {
      toast.error('Failed to load pipelines');
    }
  };

  const handleEnableNotifications = async () => {
    if (!user?.locationId) return;

    try {
      const docRef = doc(db, 'app-notifications', user.locationId);
      const initialPreferences: NotificationPreferences = {
        newCall: [],
        newSMS: [],
        leadStatusChange: [],
        newLeadAssigned: []
      };
      
      await setDoc(docRef, {
        locationId: user.locationId,
        preferences: initialPreferences,
        updatedAt: new Date()
      });
      
      setPreferences(initialPreferences);
      setInitialPreferences(initialPreferences);
      setHasDocument(true);
      setHasChanges(false);
      toast.success('Notifications enabled successfully');
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  // Add global styles
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
 
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
        <div className="flex items-center gap-4">
          {!loading && !hasDocument && (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] transition-colors"
            >
              Enable Notifications
            </button>
          )}
          {!loading && hasDocument && (
            <button
              onClick={handleUpdateSettings}
              disabled={!hasChanges || isUpdating}
              className={classNames(
                "px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2",
                hasChanges && !isUpdating
                  ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9] cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                'Update Settings'
              )}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <NotificationTray 
              isOpen={isNotificationTrayOpen}
              onClose={() => setIsNotificationTrayOpen(false)}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabPanels className="p-6">
            <TabPanel>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]"></div>
                </div>
              ) : !hasDocument ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-600 mb-4">Notifications are currently disabled</p>
                  <button
                    onClick={handleEnableNotifications}
                    className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] transition-colors"
                  >
                    Enable Notifications
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                
                  {/* New SMS from lead */}
                  <div className="space-y-4 pt-6 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">New SMS from lead</span>
                        <button
                          onClick={() => toggleNotification('newSMS')}
                          disabled={!hasDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            preferences.newSMS[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              preferences.newSMS[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline and Stage Selectors */}
                    <div className={classNames(
                      "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200",
                      preferences.newSMS[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                    )}>
                      {/* Pipeline Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={preferences.newSMS[0]?.pipelineId || ''}
                            onChange={(e) => {
                              const pipelineId = e.target.value;
                              if (pipelineId) {
                                updateLocalPreference('newSMS', pipelineId, '', true);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Pipeline</option>
                            {pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))}
                          </select>
                        </div> 
                      </div>

                      {/* Stage Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={preferences.newSMS[0]?.stageId || ''}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              const pipelineId = preferences.newSMS[0]?.pipelineId;
                              if (pipelineId && stageId) {
                                updateLocalPreference('newSMS', pipelineId, stageId, true);
                              }
                            }}
                            disabled={!preferences.newSMS[0]?.pipelineId}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Stage</option>
                            {newSMSStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div> 
                      </div>
                    </div>
                  </div>

                  {/* Lead status change */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">Lead status change</span>
                        <button
                          onClick={() => toggleNotification('leadStatusChange')}
                          disabled={!hasDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            preferences.leadStatusChange[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              preferences.leadStatusChange[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline and Stage Selectors */}
                    <div className={classNames(
                      "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200",
                      preferences.leadStatusChange[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                    )}>
                      {/* Pipeline Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={preferences.leadStatusChange[0]?.pipelineId || ''}
                            onChange={(e) => {
                              const pipelineId = e.target.value;
                              if (pipelineId) {
                                updateLocalPreference('leadStatusChange', pipelineId, '', true);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Pipeline</option>
                            {pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))}
                          </select>
                        </div> 
                      </div>

                      {/* Stage Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={preferences.leadStatusChange[0]?.stageId || ''}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              const pipelineId = preferences.leadStatusChange[0]?.pipelineId;
                              if (pipelineId && stageId) {
                                updateLocalPreference('leadStatusChange', pipelineId, stageId, true);
                              }
                            }}
                            disabled={!preferences.leadStatusChange[0]?.pipelineId}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Stage</option>
                            {leadStatusStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div> 
                      </div>
                    </div>
                  </div>

                  {/* New lead assigned */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">New lead assigned</span>
                        <button
                          onClick={() => toggleNotification('newLeadAssigned')}
                          disabled={!hasDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            preferences.newLeadAssigned[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              preferences.newLeadAssigned[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline Selector Only */}
                    <div className={classNames(
                      "bg-gray-50 p-4 rounded-lg shadow-sm transition-opacity duration-200",
                      preferences.newLeadAssigned[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                    )}>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={preferences.newLeadAssigned[0]?.pipelineId || ''}
                          onChange={(e) => {
                            const pipelineId = e.target.value;
                            if (pipelineId) {
                              updateLocalPreference('newLeadAssigned', pipelineId, '', true);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Select Pipeline</option>
                          {pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                              {pipeline.name}
                            </option>
                          ))}
                        </select>
                      </div> 
                    </div>
                  </div>
                </div>
              )}
            </TabPanel> 
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
} 