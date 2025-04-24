"use client";

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';
import { BellIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface NotificationPreference {
  web: boolean;
  email: boolean;
  mobile: boolean;
}

interface Stage {
  id: string;
  name: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

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
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState('');
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  
  // Add pipeline states for each notification type
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  
  // New call states
  const [newCallPipeline, setNewCallPipeline] = useState<string | null>(null);
  const [newCallStage, setNewCallStage] = useState<string | null>(null);
  
  // New SMS states
  const [newSMSPipeline, setNewSMSPipeline] = useState<string | null>(null);
  const [newSMSStage, setNewSMSStage] = useState<string | null>(null);
  
  // Lead status change states
  const [leadStatusPipeline, setLeadStatusPipeline] = useState<string | null>(null);
  const [leadStatusStage, setLeadStatusStage] = useState<string | null>(null);
  
  // New lead assigned state
  const [newLeadPipeline, setNewLeadPipeline] = useState<string | null>(null);

  // Get stages for each selected pipeline
  const newCallStages = pipelines.find(p => p.id === newCallPipeline)?.stages || [];
  const newSMSStages = pipelines.find(p => p.id === newSMSPipeline)?.stages || [];
  const leadStatusStages = pipelines.find(p => p.id === leadStatusPipeline)?.stages || [];

  // Fetch pipelines on mount
  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const response = await axios.get('/api/pipelines');
      const fetchedPipelines = response.data.pipelines || [];
      setPipelines(fetchedPipelines);

      // Set the first pipeline as default if there are pipelines
      if (fetchedPipelines.length > 0) {
        setNewCallPipeline(fetchedPipelines[0].id);
        setNewCallStage(fetchedPipelines[0].stages[0].id);
        setNewSMSPipeline(fetchedPipelines[0].id);
        setNewSMSStage(fetchedPipelines[0].stages[0].id);
        setLeadStatusPipeline(fetchedPipelines[0].id);
        setLeadStatusStage(fetchedPipelines[0].stages[0].id);
        setNewLeadPipeline(fetchedPipelines[0].id);
      }
    } catch (error) {
      toast.error('Failed to load pipelines');
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

  const tabs = ['Leads', 'Buyers', 'Vendors', 'General', 'Notification Sound'];

  const [newCallPrefs, setNewCallPrefs] = useState<NotificationPreference>({
    web: false,
    email: false,
    mobile: false
  });

  const [newSMSPrefs, setNewSMSPrefs] = useState<NotificationPreference>({
    web: false,
    email: false,
    mobile: false
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
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
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex border-b">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  classNames(
                    'px-6 py-3 text-sm font-medium outline-none',
                    selected
                      ? 'text-[#7c3aed] border-b-2 border-[#7c3aed]'
                      : 'text-gray-500 hover:text-gray-700'
                  )
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="p-6">
            <Tab.Panel>
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">LEADS NOTIFICATIONS</h2>
                
                {/* New call from lead */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New call from lead</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input
                          type="checkbox"
                          checked={newCallPrefs.web}
                          onChange={(e) => setNewCallPrefs({...newCallPrefs, web: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input
                          type="checkbox"
                          checked={newCallPrefs.email}
                          onChange={(e) => setNewCallPrefs({...newCallPrefs, email: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input
                          type="checkbox"
                          checked={newCallPrefs.mobile}
                          onChange={(e) => setNewCallPrefs({...newCallPrefs, mobile: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pipeline and Stage Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pipeline Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={newCallPipeline || ''}
                          onChange={(e) => setNewCallPipeline(e.target.value)}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {pipelines.length === 0 ? (
                            <option value="">Loading pipelines...</option>
                          ) : (
                            pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Select where contacts will be organized</p>
                    </div>

                    {/* Stage Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={newCallStage || ''}
                          onChange={(e) => setNewCallStage(e.target.value)}
                          disabled={!newCallPipeline}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {newCallStages.length === 0 ? (
                            <option value="">Select pipeline first</option>
                          ) : (
                            newCallStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Choose the stage for new contacts</p>
                    </div>
                  </div>
                </div>

                {/* New SMS from lead */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New SMS from lead</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input
                          type="checkbox"
                          checked={newSMSPrefs.web}
                          onChange={(e) => setNewSMSPrefs({...newSMSPrefs, web: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input
                          type="checkbox"
                          checked={newSMSPrefs.email}
                          onChange={(e) => setNewSMSPrefs({...newSMSPrefs, email: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input
                          type="checkbox"
                          checked={newSMSPrefs.mobile}
                          onChange={(e) => setNewSMSPrefs({...newSMSPrefs, mobile: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pipeline and Stage Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pipeline Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={newSMSPipeline || ''}
                          onChange={(e) => setNewSMSPipeline(e.target.value)}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {pipelines.length === 0 ? (
                            <option value="">Loading pipelines...</option>
                          ) : (
                            pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Select where contacts will be organized</p>
                    </div>

                    {/* Stage Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={newSMSStage || ''}
                          onChange={(e) => setNewSMSStage(e.target.value)}
                          disabled={!newSMSPipeline}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {newSMSStages.length === 0 ? (
                            <option value="">Select pipeline first</option>
                          ) : (
                            newSMSStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Choose the stage for new contacts</p>
                    </div>
                  </div>
                </div>

                {/* Lead status change */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Lead status change</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>

                  {/* Pipeline and Stage Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pipeline Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={leadStatusPipeline || ''}
                          onChange={(e) => setLeadStatusPipeline(e.target.value)}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {pipelines.length === 0 ? (
                            <option value="">Loading pipelines...</option>
                          ) : (
                            pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Select where contacts will be organized</p>
                    </div>

                    {/* Stage Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={leadStatusStage || ''}
                          onChange={(e) => setLeadStatusStage(e.target.value)}
                          disabled={!leadStatusPipeline}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          {leadStatusStages.length === 0 ? (
                            <option value="">Select pipeline first</option>
                          ) : (
                            leadStatusStages.map((stage: Stage) => (
                              <option key={stage.id} value={stage.id} className="text-gray-700">
                                {stage.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Choose the stage for new contacts</p>
                    </div>
                  </div>
                </div>

                {/* New lead assigned */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New lead assigned</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Selector Only */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                    </div>
                    <div className="border border-gray-200 rounded-md">
                      <select
                        value={newLeadPipeline || ''}
                        onChange={(e) => setNewLeadPipeline(e.target.value)}
                        className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        {pipelines.length === 0 ? (
                          <option value="">Loading pipelines...</option>
                        ) : (
                          pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                              {pipeline.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Select where contacts will be organized</p>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">BUYERS NOTIFICATIONS</h2>
                
                {/* New call from buyer */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New call from buyer</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A855C] mb-1">
                      By Campaign <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                      <option value="">Select Campaign</option>
                    </select>
                  </div>
                </div>

                {/* New SMS from buyer */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New SMS from buyer</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A855C] mb-1">
                      By Campaign <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                      <option value="">Select Campaign</option>
                    </select>
                  </div>
                </div>

                {/* REsimpli notifications */}
                <div className="space-y-6">
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">New offer received from REsimpli dispo website</span>
                      <div className="flex gap-8">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Web</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Email</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Mobile</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">New inquiry from REsimpli dispo website</span>
                      <div className="flex gap-8">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Web</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Email</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Mobile</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">New open house attendee from REsimpli dispo website</span>
                      <div className="flex gap-8">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Web</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Email</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Mobile</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">New contact form submission on REsimpli dispo website</span>
                      <div className="flex gap-8">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Web</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Email</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-gray-600">Mobile</span>
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">VENDORS NOTIFICATIONS</h2>
                
                {/* New call from vendor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New call from vendor</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0A855C] mb-1">
                      By Campaign <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                      <option value="">Select Campaign</option>
                    </select>
                  </div>
                </div>

                {/* New SMS from vendor */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New SMS from vendor</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0A855C] mb-1">
                      By Campaign <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                      <option value="">Select Campaign</option>
                    </select>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">GENERAL PROPERTIES</h2>
                
                {/* Drip stopped notification */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Drip stopped notification</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0A855C] mb-1">
                        By Campaign <span className="text-red-500">*</span>
                      </label>
                      <select defaultValue="sellers" className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                        <option value="sellers">Sellers test</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0A855C] mb-1">
                        By Lead Status <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]">
                        <option value="">Select Lead Status</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tagged in new comment */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Tagged in new comment</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual task assigned */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Manual task assigned</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Esign notifications */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Esign when recipient opened</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Esign when recipient signed</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Esign when all parties signed</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productivity Summary */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Productivity Summary</span>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2 invisible">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                      <div className="flex flex-col items-center gap-2 invisible">
                        <span className="text-sm text-gray-600">Mobile</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900">NOTIFICATION SOUND</h2>
                
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <span className="text-gray-700">New notification sound</span>
                    </div>
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-600">Web</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c3aed] focus:ring-[#7c3aed]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 