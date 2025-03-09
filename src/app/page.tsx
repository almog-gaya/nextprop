'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  ChevronDownIcon,
  FunnelIcon,
  Bars4Icon,
  Squares2X2Icon,
  PlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';  // Change from 'next/router' to 'next/navigation'
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoaders';
import AutomationPreview from '@/components/AutomationPreview';

// Pipeline types
interface Opportunity {
  id: string;
  name: string;
  value: string;
  businessName?: string;
  stage: string;
  source?: string;
  lastActivity?: string;
  lastActivityType?: 'voicemail' | 'sms' | 'call' | 'email' | 'optout';
}

interface PipelineStage {
  id: string;
  name: string;
  opportunities: Opportunity[];
  count: number;
  total: string;
}

interface PipelineData {
  id: string;
  name: string;
  stages: PipelineStage[];
  totalOpportunities: number;
}

// GoHighLevel API response types
interface GHLContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  tags?: string[];
}

interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  source?: string;
  updatedAt?: string;
  contact?: GHLContact;
}

interface GHLStage {
  id: string;
  name: string;
}

interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLStage[];
  locationId?: string;
}

interface GHLPipelineResponse {
  pipelines: GHLPipeline[];
}

interface GHLOpportunityResponse {
  opportunities: GHLOpportunity[];
  meta?: {
    total: number;
    nextPageUrl?: string;
  };
}

// Custom CSS
const customStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

export default function DashboardPage() {
  const router = useRouter();
  // Group all useState hooks together at the top
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [opportunities, setOpportunities] = useState<PipelineStage[]>([]);
  const [notificationActive, setNotificationActive] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // New state variables for filtering, sorting, and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    value: { min: string; max: string };
    source: string[];
    lastActivityType: ('voicemail' | 'sms' | 'call' | 'email' | 'optout')[];
    dateRange: { start: string; end: string };
  }>({
    value: { min: '', max: '' },
    source: [],
    lastActivityType: [],
    dateRange: { start: '', end: '' }
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'value' | 'businessName' | 'lastActivity';
    direction: 'asc' | 'desc';
  } | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/ghl/data');
        const data = await response.json();
        
        if (!data.authenticated) {
          router.push('/auth/login');
          return;
        }

        setAuthChecked(true);
        
        if (data.locationData) {
          console.log('Location data:', data.locationData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthChecked(true);
        setError('Failed to verify authentication status');
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch pipeline data effect
  useEffect(() => {
    if (!authChecked) return; // Only fetch data after auth check

    const fetchPipelineData = async () => {
      setIsLoading(true);
      setError(null);
      setApiConfigured(true);

      try {
        console.log('Fetching pipeline data...');
        const response = await fetch('/api/pipelines');
        console.log('Pipeline API response status:', response.status);
        
        if (!response.ok) {
          console.error('Failed to fetch pipelines:', response.statusText);
          // Handle 404 errors (API not configured)
          if (response.status === 404) {
            setApiConfigured(false);
            setError('API endpoint not found. Please configure your API integration.');
            console.error('API endpoint not found:', response.statusText);
          } else {
            // For other errors, try to get more details from the response
            try {
              const errorData = await response.json();
              setError(`Error fetching pipeline data: ${errorData.error || response.statusText}`);
              console.error('Detailed error:', errorData);
            } catch (parseError) {
              setError(`Error fetching pipeline data: ${response.statusText}`);
            }
          }
          setIsLoading(false);
          return;
        }

        const pipelineData: GHLPipelineResponse = await response.json();
        console.log('Received pipeline data:', pipelineData?.pipelines?.length || 0, 'pipelines');

        if (pipelineData && pipelineData.pipelines && pipelineData.pipelines.length > 0) {
          const mappedPipelines: PipelineData[] = await Promise.all(
            pipelineData.pipelines.map(async (pipeline: GHLPipeline) => {
              // For each pipeline, fetch its opportunities
              try {
                const opportunitiesResponse = await fetch(`/api/pipelines/${pipeline.id}/opportunities`);
                if (!opportunitiesResponse.ok) {
                  throw new Error(`Error fetching opportunities: ${opportunitiesResponse.statusText}`);
                }
                
                const opportunitiesData: GHLOpportunityResponse = await opportunitiesResponse.json();
                
                // Add detailed logging to diagnose the response
                console.log(`Pipeline ${pipeline.id} (${pipeline.name}) opportunities response:`, 
                  opportunitiesData?.opportunities?.length || 0, 'opportunities found');
                if (opportunitiesData?.opportunities?.length === 0) {
                  console.log('Empty opportunities array for pipeline:', pipeline.id, pipeline.name);
                }
                
                // Group opportunities by stage
                const opportunitiesByStage: Record<string, Opportunity[]> = {};
                const opportunities = opportunitiesData.opportunities || [];
                
                opportunities.forEach((opp: GHLOpportunity) => {
                  if (!opportunitiesByStage[opp.pipelineStageId]) {
                    opportunitiesByStage[opp.pipelineStageId] = [];
                  }
                  opportunitiesByStage[opp.pipelineStageId].push({
                    id: opp.id,
                    name: opp.name,
                    value: `$${opp.monetaryValue || 0}`,
                    businessName: opp.contact?.company || '',
                    stage: opp.pipelineStageId,
                    source: opp.source || '',
                    lastActivity: opp.updatedAt || '',
                  });
                });
                
                // Create stages with opportunities
                const stagesWithOpps: PipelineStage[] = pipeline.stages.map((stage: GHLStage) => ({
                  id: stage.id,
                  name: stage.name,
                  opportunities: opportunitiesByStage[stage.id] || [],
                  count: (opportunitiesByStage[stage.id] || []).length,
                  total: `$${(opportunitiesByStage[stage.id] || []).reduce((sum: number, opp: Opportunity) => 
                    sum + (parseFloat(opp.value.replace('$', '')) || 0), 0)}`
                }));
                
                return {
                  id: pipeline.id,
                  name: pipeline.name,
                  stages: stagesWithOpps,
                  totalOpportunities: opportunities.length
                };
              } catch (error) {
                console.error(`Error fetching opportunities for pipeline ${pipeline.id}:`, error);
                return {
                  id: pipeline.id,
                  name: pipeline.name ,
                  stages: pipeline.stages.map(stage => ({
                    id: stage.id,
                    name: stage.name,
                    opportunities: [],
                    count: 0,
                    total: '$0'
                  })),
                  totalOpportunities: 0
                };
              }
            })
          );
          
          setPipelines(mappedPipelines);
          if (mappedPipelines.length > 0) {
            setSelectedPipeline(mappedPipelines[0].id);
            setOpportunities(mappedPipelines[0].stages);
          }
        } else {
          setError('No pipeline data available');
        }
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        setError('Failed to fetch pipeline data: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelineData();
  }, [authChecked]);

  // Extract all opportunities when selected pipeline changes
  useEffect(() => {
    if (selectedPipeline && pipelines) {
      const pipeline = pipelines.find((pipe: PipelineData) => pipe.id === selectedPipeline);
      if (pipeline) {
        setOpportunities(pipeline.stages);
      }
    }
  }, [selectedPipeline, pipelines]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    setOpportunities(pipelines.find(p => p.id === pipelineId)?.stages || []);
    setIsDropdownOpen(false);
  };

  // Filter and sort utility functions
  const filterOpportunities = (opportunities: Opportunity[]): Opportunity[] => {
    return opportunities.filter(opp => {
      // Filter by search term
      if (searchTerm && !opp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(opp.businessName && opp.businessName.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Filter by value range
      if (filters.value.min && parseFloat(opp.value.replace('$', '')) < parseFloat(filters.value.min)) {
        return false;
      }
      if (filters.value.max && parseFloat(opp.value.replace('$', '')) > parseFloat(filters.value.max)) {
        return false;
      }
      
      // Filter by source
      if (filters.source.length > 0 && opp.source && !filters.source.includes(opp.source)) {
        return false;
      }
      
      // Filter by activity type
      if (filters.lastActivityType.length > 0 && 
          opp.lastActivityType && 
          !filters.lastActivityType.includes(opp.lastActivityType)) {
        return false;
      }
      
      // All filters passed
      return true;
    });
  };
  
  const sortOpportunities = (opportunities: Opportunity[]): Opportunity[] => {
    if (!sortConfig) return opportunities;
    
    return [...opportunities].sort((a, b) => {
      if (sortConfig.key === 'value') {
        const valueA = parseFloat(a.value.replace('$', ''));
        const valueB = parseFloat(b.value.replace('$', ''));
        return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Default string comparison for other fields
      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };
  
  // Get filtered and sorted opportunities for display
  const getProcessedOpportunities = (stageId: string): Opportunity[] => {
    const stageOpportunities = opportunities.find(stage => stage.id === stageId)?.opportunities || [];
    const filteredOpportunities = filterOpportunities(stageOpportunities);
    return sortOpportunities(filteredOpportunities);
  };

  const handleCommunication = async (opportunityId: string, actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => {
    if (!selectedPipeline) return;
    
    // Clone the pipeline data
    const updatedPipeline = JSON.parse(JSON.stringify(selectedPipeline)) as PipelineData;
    
    // Find the opportunity in all stages
    let foundOpportunity: Opportunity | null = null;
    let currentStageId = '';
    
    // Look through all stages for the opportunity
    for (const stage of updatedPipeline.stages) {
      const opportunityIndex = stage.opportunities.findIndex(opp => opp.id === opportunityId);
      
      if (opportunityIndex !== -1) {
        foundOpportunity = stage.opportunities[opportunityIndex];
        currentStageId = stage.id;
        
        // Remove from current stage
        stage.opportunities.splice(opportunityIndex, 1);
        stage.count = stage.opportunities.length;
        break;
      }
    }
    
    if (!foundOpportunity) return;
    
    // Update the opportunity's last activity
    foundOpportunity.lastActivityType = actionType;
    foundOpportunity.lastActivity = new Date().toLocaleTimeString();
    
    // Determine target stage based on action type
    let targetStageId = currentStageId;
    let notificationMsg = '';
    
    switch (actionType) {
      case 'sms':
        targetStageId = 'returned-sms';
        notificationMsg = `${foundOpportunity.name || 'Contact'} moved to Returned SMS stage`;
        break;
      case 'call':
        targetStageId = 'returned-call';
        notificationMsg = `${foundOpportunity.name || 'Contact'} moved to Returned Call stage`;
        break;
      case 'optout':
        targetStageId = 'lead-opted-out';
        notificationMsg = `${foundOpportunity.name || 'Contact'} moved to Lead Opted Out stage`;
        break;
      case 'voicemail':
        if (currentStageId !== 'voice-drop-sent') {
          targetStageId = 'voice-drop-sent';
          notificationMsg = `New voicemail sent to ${foundOpportunity.name || 'contact'}`;
        }
        break;
      default:
        break;
    }
    
    // If the target stage is different from current, move the opportunity
    if (targetStageId !== currentStageId) {
      // Find the target stage
      const targetStage = updatedPipeline.stages.find(stage => stage.id === targetStageId);
      
      if (targetStage) {
        // Update the opportunity's stage
        foundOpportunity.stage = targetStage.name;
        
        // Add to new stage
        targetStage.opportunities.push(foundOpportunity);
        targetStage.count = targetStage.opportunities.length;
        
        // Show notification
        setNotification({ 
          message: notificationMsg, 
          type: 'success' 
        });
        setNotificationActive(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setNotificationActive(false);
        }, 3000);
        
        // Update the backend
        if (apiConfigured) {
          try {
            const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                stageId: targetStageId,
                actionType
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to update opportunity stage on server');
              setNotification({
                message: 'Failed to update opportunity. Please try again.',
                type: 'error'
              });
              setNotificationActive(true);
            }
          } catch (err) {
            console.error('Error updating opportunity:', err);
          }
        }
      }
    }
    
    // Update pipeline
    setSelectedPipeline(updatedPipeline.id);
  };

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
    return (
      <div className="bg-white mb-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="p-3 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 truncate">{opportunity.name || '-'}</span>
              <button className="text-gray-400 hover:text-gray-600 ml-2">
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
            
            {opportunity.businessName && (
              <div className="text-sm mt-1">
                <span className="text-gray-500">Business:</span>
                <span className="ml-1 text-gray-700">{opportunity.businessName}</span>
              </div>
            )}
            
            {opportunity.source && (
              <div className="text-sm mt-1">
                <span className="text-gray-500">Source:</span>
                <span className="ml-1 text-gray-700">{opportunity.source}</span>
              </div>
            )}
            
            <div className="text-sm mt-1">
              <span className="text-gray-500">Value:</span>
              <span className="ml-1 text-gray-700">{opportunity.value}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-md">
          <button 
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'call')}
            title="Simulate a returned call"
          >
            <PhoneIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'sms')}
            title="Simulate a returned SMS"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'email')}
            title="Send email"
          >
            <EnvelopeIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-purple-600 p-1"
            title="Schedule a meeting"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-purple-600 p-1"
            title="Edit opportunity"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-red-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'optout')}
            title="Mark as opted out"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // FilterModal component
  const FilterModal = () => {
    const [tempFilters, setTempFilters] = useState({ ...filters });

    const handleApplyFilters = () => {
      setFilters(tempFilters);
      setIsFilterModalOpen(false);
    };

    const handleClearFilters = () => {
      setTempFilters({
        value: { min: '', max: '' },
        source: [],
        lastActivityType: [],
        dateRange: { start: '', end: '' }
      });
    };

    const toggleActivityType = (type: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => {
      const newActivityTypes = [...tempFilters.lastActivityType];
      if (newActivityTypes.includes(type)) {
        setTempFilters({
          ...tempFilters,
          lastActivityType: newActivityTypes.filter(t => t !== type)
        });
      } else {
        setTempFilters({
          ...tempFilters,
          lastActivityType: [...newActivityTypes, type]
        });
      }
    };

    const toggleSource = (source: string) => {
      const newSources = [...tempFilters.source];
      if (newSources.includes(source)) {
        setTempFilters({
          ...tempFilters,
          source: newSources.filter(s => s !== source)
        });
      } else {
        setTempFilters({
          ...tempFilters,
          source: [...newSources, source]
        });
      }
    };

    return (
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsFilterModalOpen(false)}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Advanced Filters</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Deal Value</h4>
                    <div className="flex space-x-2">
                      <div className="w-1/2">
                        <label htmlFor="min-value" className="block text-xs text-gray-500 mb-1">Min Value</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">$</span>
                          <input
                            type="number"
                            id="min-value"
                            className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Min"
                            value={tempFilters.value.min}
                            onChange={(e) => setTempFilters({
                              ...tempFilters,
                              value: { ...tempFilters.value, min: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label htmlFor="max-value" className="block text-xs text-gray-500 mb-1">Max Value</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">$</span>
                          <input
                            type="number"
                            id="max-value"
                            className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Max"
                            value={tempFilters.value.max}
                            onChange={(e) => setTempFilters({
                              ...tempFilters,
                              value: { ...tempFilters.value, max: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Activity Type</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {['voicemail', 'sms', 'call', 'email', 'optout'].map((type) => (
                        <button
                          key={type}
                          className={`px-3 py-2 text-sm rounded-md ${
                            tempFilters.lastActivityType.includes(type as any) 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                          onClick={() => toggleActivityType(type as any)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
                    <div className="flex space-x-2">
                      <div className="w-1/2">
                        <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          id="start-date"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={tempFilters.dateRange.start}
                          onChange={(e) => setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, start: e.target.value }
                          })}
                        />
                      </div>
                      <div className="w-1/2">
                        <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          id="end-date"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={tempFilters.dateRange.end}
                          onChange={(e) => setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, end: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setIsFilterModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SortModal component
  const SortModal = () => {
    const [tempSortConfig, setTempSortConfig] = useState(sortConfig);

    const handleApplySort = () => {
      setSortConfig(tempSortConfig);
      setIsSortModalOpen(false);
    };

    const handleSelectSort = (key: 'name' | 'value' | 'businessName' | 'lastActivity', direction: 'asc' | 'desc') => {
      setTempSortConfig({ key, direction });
    };

    return (
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsSortModalOpen(false)}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sort Opportunities</h3>
                  
                  <div className="space-y-2">
                    <div 
                      className={`p-3 rounded-lg border ${tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'asc' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      onClick={() => handleSelectSort('name', 'asc')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Name A-Z</p>
                          <p className="text-xs text-gray-500">Sort by opportunity name ascending</p>
                        </div>
                        {tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'asc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border ${tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'desc' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      onClick={() => handleSelectSort('name', 'desc')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Name Z-A</p>
                          <p className="text-xs text-gray-500">Sort by opportunity name descending</p>
                        </div>
                        {tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'desc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border ${tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'desc' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      onClick={() => handleSelectSort('value', 'desc')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Value: High to Low</p>
                          <p className="text-xs text-gray-500">Sort by opportunity value descending</p>
                        </div>
                        {tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'desc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border ${tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'asc' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      onClick={() => handleSelectSort('value', 'asc')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Value: Low to High</p>
                          <p className="text-xs text-gray-500">Sort by opportunity value ascending</p>
                        </div>
                        {tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'asc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 rounded-lg border ${tempSortConfig?.key === 'lastActivity' && tempSortConfig?.direction === 'desc' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      onClick={() => handleSelectSort('lastActivity', 'desc')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Most Recent Activity</p>
                          <p className="text-xs text-gray-500">Sort by most recent activity first</p>
                        </div>
                        {tempSortConfig?.key === 'lastActivity' && tempSortConfig?.direction === 'desc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleApplySort}
              >
                Apply Sort
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => {
                  setTempSortConfig(null);
                  setSortConfig(null);
                  setIsSortModalOpen(false);
                }}
              >
                Clear Sort
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setIsSortModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Your Dashboard</h1>
            <p className="text-gray-600">Here's what's happening with your pipelines and opportunities.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Current Opportunities</h2>
            </div>
            <TableSkeleton rows={5} columns={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span>{error}</span>
            </div>
            {!apiConfigured && (
              <div className="mt-4">
                <p className="mb-4">It looks like you need to configure your API integration. Please go to the settings page to set up your integration.</p>
                <Link href="/settings">
                  <button className="nextprop-button-secondary">
                    Go to Settings
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No data state
  if (!selectedPipeline) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span>No pipeline selected</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="h-full overflow-hidden flex flex-col bg-gray-50">
          {/* Header with Pipeline Selector */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 font-medium text-gray-900"
                  >
                    <span className="text-xl">
                      {selectedPipeline ? pipelines.find(p => p.id === selectedPipeline)?.name || 'Select Pipeline' : 'Select Pipeline'}
                    </span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  
                  {isDropdownOpen && pipelines.length > 0 && (
                    <div className="absolute left-0 mt-2 z-20 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {pipelines.map(pipeline => (
                          <button
                            key={pipeline.id}
                            onClick={() => handlePipelineChange(pipeline.id)}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {pipeline.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="ml-3 text-purple-600 font-medium">
                  {selectedPipeline ? 
                    (pipelines.find(p => p.id === selectedPipeline)?.totalOpportunities || 0) + ' opportunities' :
                    '0 opportunities'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex border border-gray-200 rounded-md overflow-hidden">
                  <button 
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-purple-600' : 'bg-white text-gray-500'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button 
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-purple-600' : 'bg-white text-gray-500'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <Bars4Icon className="h-5 w-5" />
                  </button>
                </div>
                
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Import
                </button>
                
                <button 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-blue-700"
                  onClick={async () => {
                    if (!apiConfigured) {
                      setNotification({
                        message: 'API not configured. Cannot create opportunities yet.',
                        type: 'error'
                      });
                      setNotificationActive(true);
                      return;
                    }
                    
                    try {
                      const response = await fetch('/api/opportunities/create', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application-json',
                        },
                        body: JSON.stringify({
                          pipelineId: selectedPipeline,
                          stageId: 'voice-drop-sent'
                        }),
                      });
                      
                      if (response.ok) {
                        const newOpportunity = await response.json();
                        if (newOpportunity) {
                          handleCommunication(newOpportunity.id, 'voicemail');
                        }
                      } else {
                        setNotification({
                          message: 'Failed to create opportunity. Please try again.',
                          type: 'error'
                        });
                        setNotificationActive(true);
                      }
                    } catch (err) {
                      console.error('Error creating opportunity:', err);
                      setNotification({
                        message: 'Failed to create opportunity. Please try again.',
                        type: 'error'
                      });
                      setNotificationActive(true);
                    }
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add opportunity
                </button>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setIsFilterModalOpen(true)}
                >
                  <FunnelIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Advanced Filters
                  {Object.values(filters).some(val => 
                    Array.isArray(val) ? val.length > 0 : 
                    typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
                    val !== ''
                  ) && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {Object.values(filters).reduce((acc, val) => {
                        if (Array.isArray(val)) return acc + (val.length > 0 ? 1 : 0);
                        if (typeof val === 'object') {
                          return acc + (Object.values(val).some(v => v !== '') ? 1 : 0);
                        }
                        return acc + (val !== '' ? 1 : 0);
                      }, 0)}
                    </span>
                  )}
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setIsSortModalOpen(true)}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Sort
                  {sortConfig && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
              </div>
              
              <div className="flex space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Opportunities"
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <Bars4Icon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active filters display */}
          {(Object.values(filters).some(val => 
            Array.isArray(val) ? val.length > 0 : 
            typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
            val !== ''
          ) || searchTerm) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                  <span>Search: {searchTerm}</span>
                  <button 
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    onClick={() => setSearchTerm('')}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {filters.value.min && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                  <span>Min Value: ${filters.value.min}</span>
                  <button 
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    onClick={() => setFilters({...filters, value: {...filters.value, min: ''}})}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {filters.value.max && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                  <span>Max Value: ${filters.value.max}</span>
                  <button 
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    onClick={() => setFilters({...filters, value: {...filters.value, max: ''}})}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {filters.lastActivityType.map(type => (
                <div key={type} className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <button 
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    onClick={() => setFilters({
                      ...filters, 
                      lastActivityType: filters.lastActivityType.filter(t => t !== type)
                    })}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {(Object.values(filters).some(val => 
                Array.isArray(val) ? val.length > 0 : 
                typeof val === 'object' ? Object.values(val).some(v => v !== '') : 
                val !== ''
              ) || searchTerm) && (
                <button 
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      value: { min: '', max: '' },
                      source: [],
                      lastActivityType: [],
                      dateRange: { start: '', end: '' }
                    });
                    setSortConfig(null);
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
          
          {/* Pipeline Grid */}
          <div className="flex-1 overflow-auto">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {/* Automation Preview */}
              <AutomationPreview className="mb-6" />
              
              {viewMode === 'grid' ? (
                // Grid view - now horizontally scrollable
                <div className="overflow-x-auto pb-4">
                  <div className="flex space-x-4 min-w-max">
                    {opportunities.map(stage => (
                      <div 
                        key={stage.id} 
                        className="bg-white rounded-md shadow-sm border border-gray-200 w-80 flex-shrink-0"
                      >
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                          <h3 className="font-medium text-gray-900">{stage.name}</h3>
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {getProcessedOpportunities(stage.id).length}
                          </span>
                        </div>
                        <div className="p-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                          {getProcessedOpportunities(stage.id).map(opportunity => (
                            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                          ))}
                          {getProcessedOpportunities(stage.id).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No opportunities in this stage</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // List view
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stage
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {opportunities.flatMap(stage => 
                        getProcessedOpportunities(stage.id).map(opportunity => (
                          <tr key={opportunity.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{opportunity.businessName || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{opportunity.value}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {opportunities.find(s => s.id === opportunity.stage)?.name || opportunity.stage}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {opportunity.lastActivity ? new Date(opportunity.lastActivity).toLocaleDateString() : '-'}
                              {opportunity.lastActivityType && (
                                <span className="ml-1 text-xs text-gray-500">({opportunity.lastActivityType})</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button className="text-purple-600 hover:text-blue-900">
                                  <PhoneIcon className="h-4 w-4" />
                                </button>
                                <button className="text-purple-600 hover:text-blue-900">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                </button>
                                <button className="text-purple-600 hover:text-blue-900">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      {opportunities.flatMap(stage => getProcessedOpportunities(stage.id)).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            No opportunities match your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Modals */}
          {isFilterModalOpen && <FilterModal />}
          {isSortModalOpen && <SortModal />}
        </div>
      </div>
    </DashboardLayout>
  );
}
