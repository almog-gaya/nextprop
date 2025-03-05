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

  // Fetch pipelines and opportunities
  useEffect(() => {
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
                  name: pipeline.name, 
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
  }, []);

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
    setIsDropdownOpen(false);
  };

  // Function to handle communication actions
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
            className="text-gray-500 hover:text-blue-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'call')}
            title="Simulate a returned call"
          >
            <PhoneIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-blue-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'sms')}
            title="Simulate a returned SMS"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-blue-600 p-1"
            onClick={() => handleCommunication(opportunity.id, 'email')}
            title="Send email"
          >
            <EnvelopeIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-blue-600 p-1"
            title="Schedule a meeting"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-blue-600 p-1"
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

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading pipeline data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="text-yellow-500 mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Database Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-gray-600 mb-6">Unable to retrieve pipeline data from the database. Please verify that the Supabase connection is properly configured.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No data state
  if (!selectedPipeline) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Pipeline Setup Required</h2>
            <p className="text-gray-600 mb-4">There are currently no active pipelines in the database. Please check your Supabase database setup.</p>
            <div className="space-y-3">
              <p className="text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-200 text-left text-sm">
                <strong>Technical Note:</strong> The API endpoint <code>/api/pipelines</code> is not returning any pipeline data. 
                Please verify that your Supabase database has pipeline data and that the connection is correctly configured.
              </p>
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <style jsx global>{customStyles}</style>
      
      {/* Notification */}
      {notificationActive && (
        <div className="fixed top-4 right-4 z-50 flex items-center p-4 bg-white border border-green-200 rounded-lg shadow-lg">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-gray-700">{notification.message}</span>
          <button 
            className="ml-4 text-gray-400 hover:text-gray-600"
            onClick={() => setNotificationActive(false)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      
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
              
              <span className="ml-3 text-blue-600 font-medium">
                {selectedPipeline ? 
                  (pipelines.find(p => p.id === selectedPipeline)?.totalOpportunities || 0) + ' opportunities' :
                  '0 opportunities'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex border border-gray-200 rounded-md overflow-hidden">
                <button 
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button 
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
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
                        'Content-Type': 'application/json',
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
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FunnelIcon className="h-4 w-4 mr-2 text-gray-500" />
                Advanced Filters
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ArrowPathIcon className="h-4 w-4 mr-2 text-gray-500" />
                Sort (1)
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Manage Fields
              </button>
            </div>
          </div>
        </div>
        
        {/* Pipeline Grid */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {opportunities.map((stage, stageIndex) => (
                <div key={stage.id || `stage-${stageIndex}`} className="bg-white rounded-md shadow-sm border border-gray-200">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{stage.count}</span>
                  </div>
                  <div className="p-3 text-xs text-gray-500 font-medium border-b border-gray-100">
                    {stage.total}
                  </div>
                  <div className="p-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                    {stage.opportunities.map((opportunity, oppIndex) => (
                      <OpportunityCard 
                        key={opportunity.id || `${stage.id}-opp-${oppIndex}`} 
                        opportunity={opportunity} 
                      />
                    ))}
                    {stage.opportunities.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No opportunities in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
