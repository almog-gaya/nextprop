'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoaders';
import AutomationPreview from '@/components/AutomationPreview';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FilterControls from '@/components/dashboard/FilterControls';
import SearchBar from '@/components/dashboard/SearchBar';
import ActiveFilters from '@/components/dashboard/ActiveFilters';
import OpportunityGrid from '@/components/dashboard/OpportunityGrid';
import OpportunityList from '@/components/dashboard/OpportunityList';
import FilterModal from '@/components/dashboard/FilterModal';
import SortModal from '@/components/dashboard/SortModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GHLOpportunity, GHLOpportunityResponse, GHLPipeline, GHLPipelineResponse, GHLStage, Opportunity, PipelineData, PipelineStage } from '@/types/dashboard';


export default function DashboardPage() {
  const { user, loading } = useAuth();
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
    dateRange: { start: '', end: '' },
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'value' | 'businessName' | 'lastActivity';
    direction: 'asc' | 'desc';
  } | null>(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Fetch pipeline data effect
  useEffect(() => {
    if (!user) return;

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
          if (response.status === 404) {
            setApiConfigured(false);
            setError('API endpoint not found. Please configure your API integration.');
            console.error('API endpoint not found:', response.statusText);
          } else {
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
              try {
                const opportunitiesResponse = await fetch(`/api/pipelines/${pipeline.id}/opportunities`);
                if (!opportunitiesResponse.ok) {
                  throw new Error(`Error fetching opportunities: ${opportunitiesResponse.statusText}`);
                }

                const opportunitiesData: GHLOpportunityResponse = await opportunitiesResponse.json();

                console.log(
                  `Pipeline ${pipeline.id} (${pipeline.name}) opportunities response:`,
                  opportunitiesData?.opportunities?.length || 0,
                  'opportunities found'
                );
                if (opportunitiesData?.opportunities?.length === 0) {
                  console.log('Empty opportunities array for pipeline:', pipeline.id, pipeline.name);
                }

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

                const stagesWithOpps: PipelineStage[] = pipeline.stages.map((stage: GHLStage) => ({
                  id: stage.id,
                  name: stage.name,
                  opportunities: opportunitiesByStage[stage.id] || [],
                  count: (opportunitiesByStage[stage.id] || []).length,
                  total: `$${(opportunitiesByStage[stage.id] || []).reduce(
                    (sum: number, opp: Opportunity) =>
                      sum + (parseFloat(opp.value.replace('$', '')) || 0),
                    0
                  )
                    }`,
                }));

                return {
                  id: pipeline.id,
                  name: pipeline.name,
                  stages: stagesWithOpps,
                  totalOpportunities: opportunities.length,
                };
              } catch (error) {
                console.error(`Error fetching opportunities for pipeline ${pipeline.id}:`, error);
                return {
                  id: pipeline.id,
                  name: pipeline.name,
                  stages: pipeline.stages.map((stage) => ({
                    id: stage.id,
                    name: stage.name,
                    opportunities: [],
                    count: 0,
                    total: '$0',
                  })),
                  totalOpportunities: 0,
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
  }, [user]);

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
    setOpportunities(pipelines.find((p) => p.id === pipelineId)?.stages || []);
    setIsDropdownOpen(false);
  };

  const filterOpportunities = (opportunities: Opportunity[]): Opportunity[] => {
    return opportunities.filter((opp) => {
      if (
        searchTerm &&
        !opp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(opp.businessName && opp.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return false;
      }

      if (filters.value.min && parseFloat(opp.value.replace('$', '')) < parseFloat(filters.value.min)) {
        return false;
      }
      if (filters.value.max && parseFloat(opp.value.replace('$', '')) > parseFloat(filters.value.max)) {
        return false;
      }

      if (filters.source.length > 0 && opp.source && !filters.source.includes(opp.source)) {
        return false;
      }

      if (
        filters.lastActivityType.length > 0 &&
        opp.lastActivityType &&
        !filters.lastActivityType.includes(opp.lastActivityType)
      ) {
        return false;
      }

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

      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';

      if (sortConfig.direction === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  const getProcessedOpportunities = (stageId: string): Opportunity[] => {
    const stageOpportunities = opportunities.find((stage) => stage.id === stageId)?.opportunities || [];
    const filteredOpportunities = filterOpportunities(stageOpportunities);
    return sortOpportunities(filteredOpportunities);
  };

  const handleCommunication = async (
    opportunityId: string,
    actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout'
  ) => {
    console.log(`${actionType} action initiated for opportunity: ${opportunityId}`);
    if (!selectedPipeline) return;

    const updatedPipeline = JSON.parse(JSON.stringify(selectedPipeline)) as PipelineData;

    let foundOpportunity: Opportunity | null = null;
    let currentStageId = '';

    for (const stage of updatedPipeline.stages) {
      const opportunityIndex = stage.opportunities.findIndex((opp) => opp.id === opportunityId);

      if (opportunityIndex !== -1) {
        foundOpportunity = stage.opportunities[opportunityIndex];
        currentStageId = stage.id;

        stage.opportunities.splice(opportunityIndex, 1);
        stage.count = stage.opportunities.length;
        break;
      }
    }

    if (!foundOpportunity) return;

    foundOpportunity.lastActivityType = actionType;
    foundOpportunity.lastActivity = new Date().toLocaleTimeString();

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

    if (targetStageId !== currentStageId) {
      const targetStage = updatedPipeline.stages.find((stage) => stage.id === targetStageId);

      if (targetStage) {
        foundOpportunity.stage = targetStage.name;
        targetStage.opportunities.push(foundOpportunity);
        targetStage.count = targetStage.opportunities.length;

        setNotification({
          message: notificationMsg,
          type: 'success',
        });
        setNotificationActive(true);

        setTimeout(() => {
          setNotificationActive(false);
        }, 3000);

        if (apiConfigured) {
          try {
            const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                stageId: targetStageId,
                actionType,
              }),
            });

            if (!response.ok) {
              console.error('Failed to update opportunity stage on server');
              setNotification({
                message: 'Failed to update opportunity. Please try again.',
                type: 'error',
              });
              setNotificationActive(true);
            }
          } catch (err) {
            console.error('Error updating opportunity:', err);
          }
        }
      }
    }

    setSelectedPipeline(updatedPipeline.id);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    console.log(`Edit opportunity initiated: ${opportunity.name}`);
    // Implement logic to edit the opportunity
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Your Dashboard</h1>
            <p className="text-gray-600">Here's what's happening with your pipelines and opportunities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4)
              .fill(0)
              .map((_, i) => (
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
                <p className="mb-4">
                  It looks like you need to configure your API integration. Please go to the settings page to set up
                  your integration.
                </p>
                <Link href="/settings">
                  <button className="nextprop-button-secondary">Go to Settings</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          <DashboardHeader
            pipelines={pipelines}
            selectedPipeline={selectedPipeline}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            handlePipelineChange={handlePipelineChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            apiConfigured={apiConfigured}
            setNotification={setNotification}
            setNotificationActive={setNotificationActive}
            handleCommunication={handleCommunication}
          />

          <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <FilterControls
                setIsFilterModalOpen={setIsFilterModalOpen}
                setIsSortModalOpen={setIsSortModalOpen}
                filters={filters}
                sortConfig={sortConfig}
              />
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
          </div>

          <ActiveFilters
            filters={filters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setFilters={setFilters}
            setSortConfig={setSortConfig}
          />

          <div className="flex-1 overflow-auto">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <AutomationPreview className="mb-6" />
              {viewMode === 'grid' ? (
                <OpportunityGrid
                  opportunities={opportunities}
                  getProcessedOpportunities={getProcessedOpportunities}
                  handleCommunication={handleCommunication}
                  handleEditOpportunity={handleEditOpportunity}
                />
              ) : (
                <OpportunityList
                  opportunities={opportunities}
                  getProcessedOpportunities={getProcessedOpportunities}
                  handleCommunication={handleCommunication}
                  handleEditOpportunity={handleEditOpportunity}
                />
              )}
            </div>
          </div>

          {isFilterModalOpen && <FilterModal filters={filters} setFilters={setFilters} setIsFilterModalOpen={setIsFilterModalOpen} />}
          {isSortModalOpen && <SortModal sortConfig={sortConfig} setSortConfig={setSortConfig} setIsSortModalOpen={setIsSortModalOpen} />}
        </div>
      </div>
    </DashboardLayout>
  );
}