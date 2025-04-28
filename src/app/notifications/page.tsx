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

interface NotificationTrayProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationTray: React.FC<NotificationTrayProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  
  const tabs = [
    { id: 'all', label: 'All', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    )},
    { id: 'missed-calls', label: 'Missed Calls', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    )},
    { id: 'tasks', label: 'Tasks', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    )},
    { id: 'sms', label: 'SMS', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    )},
    { id: 'mentions', label: 'Mentions', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    )}
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for closing when clicking outside */}
      <div 
        className="fixed inset-0 z-40 bg-black/5"
        onClick={onClose}
      />
          
      <div className="fixed top-[83px] right-0 w-[480px] h-[calc(95vh-72px)] z-50">
        {/* Tooltip pointer */}
        <div 
          className="absolute right-[53px] -top-2 w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200"
        />
        
        <div className="h-full bg-white shadow-xl flex flex-col border border-gray-200 rounded-md">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-medium text-gray-900">Notifications</h2>
              <span className="text-[13px] text-gray-500 mb-5">(0 Unread)</span>
            </div>
            <button 
              className="text-[#0A855C] text-[13px] hover:text-[#097a54] font-medium mb-4"
            >
              Mark all as Read
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex w-full overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={classNames(
                    'px-4 py-2.5 flex items-center gap-1.5 text-[13px] whitespace-nowrap transition-colors',
                    selectedTab === tab.id
                      ? 'text-[#7c3aed] border-b-2 border-[#7c3aed] font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center text-[13px] text-gray-500">
            No Records Found
          </div>
        </div>
      </div>
    </>
  );
};

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

  // Fetch pipelines and notification preferences on mount
  useEffect(() => {
    if (user?.locationId) {
      fetchPipelines();
      fetchNotificationPreferences();
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
      stageId, 
      stageName: stage?.name || '',
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

    // Validate all enabled notifications have pipeline and stage
    const invalidPreferences = Object.entries(preferences).filter(([type, prefs]) => {
      const pref = prefs[0];
      return pref?.enabled && (!pref.pipelineId || !pref.stageId);
    });

    if (invalidPreferences.length > 0) {
      toast.error('Please select both pipeline and stage for all enabled notifications');
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
    <div className="p-8">
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
                <div className="space-y-8">
                  {/* New call from lead */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">New call from lead</span>
                        <button
                          onClick={() => toggleNotification('newCall')}
                          disabled={!hasDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            preferences.newCall[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              preferences.newCall[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline and Stage Selectors */}
                    <div className={classNames(
                      "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200",
                      preferences.newCall[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                    )}>
                      {/* Pipeline Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={preferences.newCall[0]?.pipelineId || ''}
                            onChange={(e) => {
                              const pipelineId = e.target.value;
                              if (pipelineId) {
                                updateLocalPreference('newCall', pipelineId, '', true);
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
                            value={preferences.newCall[0]?.stageId || ''}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              const pipelineId = preferences.newCall[0]?.pipelineId;
                              if (pipelineId && stageId) {
                                updateLocalPreference('newCall', pipelineId, stageId, true);
                              }
                            }}
                            disabled={!preferences.newCall[0]?.pipelineId}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Stage</option>
                            {newCallStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div> 
                      </div>
                    </div>
                  </div>

                  {/* New SMS from lead */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
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