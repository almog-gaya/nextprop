'use client';

import React, { useEffect, useState } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { AutomationFlow, AutomationJobStatus, getAutomationStatus } from '@/lib/automationService';
import Link from 'next/link';

interface AutomationPreviewProps {
  className?: string;
}

export default function AutomationPreview({ className }: AutomationPreviewProps) {
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [activeJobs, setActiveJobs] = useState<Record<string, AutomationJobStatus>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Load automations from localStorage
  useEffect(() => {
    const savedAutomations = localStorage.getItem('automations');
    if (savedAutomations) {
      try {
        const parsedAutomations = JSON.parse(savedAutomations);
        setAutomations(parsedAutomations);
        
        // Check for active automations
        const activeAutomations = parsedAutomations.filter(
          (automation: AutomationFlow) => automation.status === 'active'
        );
        
        // If we have active automations, start polling for their status
        if (activeAutomations.length > 0) {
          pollAutomationStatus();
        }
      } catch (e) {
        console.error('Failed to parse saved automations:', e);
      }
    }
  }, []);

  // Poll for updates on active automations
  const pollAutomationStatus = async () => {
    // Check if we have any stored job IDs
    const jobIds = localStorage.getItem('activeJobIds');
    if (!jobIds) return;

    try {
      const parsedJobIds = JSON.parse(jobIds) as string[];
      
      // Create a set of intervals for each job
      for (const jobId of parsedJobIds) {
        // Simulated job status since we don't have actual API
        const simulatedStatus: AutomationJobStatus = {
          jobId,
          status: 'processing',
          progress: Math.floor(Math.random() * 100),
          startTime: new Date().toISOString(),
          currentTime: new Date().toISOString(),
          statistics: {
            contactsProcessed: Math.floor(Math.random() * 100),
            totalContacts: 100,
            duplicatesFound: Math.floor(Math.random() * 20),
            opportunitiesCreated: Math.floor(Math.random() * 80),
            communicationsSent: Math.floor(Math.random() * 50),
          }
        };
        
        setActiveJobs(prev => ({
          ...prev,
          [jobId]: simulatedStatus
        }));

        // In a real implementation, you would call the getAutomationStatus function:
        // const status = await getAutomationStatus(jobId);
        // setActiveJobs(prev => ({
        //   ...prev,
        //   [jobId]: status
        // }));
      }
    } catch (e) {
      console.error('Failed to parse active job IDs:', e);
    }
  };

  // If there are no automations or no active jobs, don't show anything
  if (automations.length === 0 || Object.keys(activeJobs).length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Active Automations</h3>
          <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {Object.keys(activeJobs).length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-500"
          >
            {isExpanded ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="p-4 divide-y divide-gray-100">
          {Object.entries(activeJobs).map(([jobId, job]) => {
            // Find associated automation
            const automation = automations.find(a => a.id === jobId.split('_')[1]) || {
              name: 'Automation',
              steps: {
                communicationChannels: [],
                pipeline: 'leads',
                contactCount: 100
              }
            };

            return (
              <div key={jobId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{automation.name}</span>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Pipeline: {automation.steps.pipeline} • Channels: {automation.steps.communicationChannels.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                      <PauseIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{job.statistics.contactsProcessed}</div>
                    <div className="text-xs text-gray-500">Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{job.statistics.duplicatesFound}</div>
                    <div className="text-xs text-gray-500">Duplicates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{job.statistics.opportunitiesCreated}</div>
                    <div className="text-xs text-gray-500">Opportunities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{job.statistics.communicationsSent}</div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="pt-3 text-center">
            <Link 
              href="/automations" 
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all automations
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center space-x-3 overflow-x-auto">
          {Object.entries(activeJobs).map(([jobId, job]) => {
            // Find associated automation
            const automation = automations.find(a => a.id === jobId.split('_')[1]) || {
              name: 'Automation',
              steps: { communicationChannels: [] }
            };
            
            return (
              <div key={jobId} className="flex-shrink-0 border border-gray-200 rounded-md p-2 bg-gray-50 w-64">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate" title={automation.name}>
                    {automation.name}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                    {job.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{job.statistics.contactsProcessed}/{job.statistics.totalContacts} contacts</span>
                  <span>{job.statistics.opportunitiesCreated} opp.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper component for the dropdown icon
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
} 