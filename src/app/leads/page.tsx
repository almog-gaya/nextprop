'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import MessageModal from '@/components/dashboard/MessageModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GHLContact, GHLOpportunity, GHLPipeline, GHLPipelineResponse, GHLStage, Opportunity, PipelineData, PipelineStage } from '@/types/dashboard';
import OpportunityEditModal from '@/components/dashboard/OpportunityEditModal';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  hasMore: boolean;
}

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [opportunities, setOpportunities] = useState<PipelineStage[]>([]);
  const [pagination, setPagination] = useState<Record<string, Record<string, PaginationState>>>({}); // pipelineId -> stageId -> PaginationState
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({}); // pipelineId -> stageId -> isLoading
  const [notificationActive, setNotificationActive] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string }>({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true); // Only for initial load
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
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    actionType: 'sms' | 'email' | null;
    opportunityId: string | null;
    contact: GHLContact | null;
  }>({
    isOpen: false,
    actionType: null,
    opportunityId: null,
    contact: null,
  });
  const [messageContent, setMessageContent] = useState<{
    sms: string;
    emailSubject: string;
    emailBody: string;
  }>({
    sms: '',
    emailSubject: '',
    emailBody: '',
  });
  const [loadingOperation, setLoadingOperation] = useState<{
    id: string | null;
    type: 'move' | 'delete' | 'edit' | null;
  }>({ id: null, type: null });
  const [isEditOpportunityModalOpen, setIsEditOpportunityModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [editContactData, setEditContactData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    locationId: string;
    phone: string;
    timezone: string;
    dnd: boolean;
    tags: string[];
    customFields: any[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    locationId: '',
    phone: '',
    timezone: '',
    dnd: false,
    tags: [],
    customFields: [],
  });
 
  const observerRefs = useRef<Record<string, IntersectionObserver>>({});

  const initializePagination = (pipelineId: string, stageId: string): PaginationState => ({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    nextPage: null,
    prevPage: null,
    hasMore: true,
  });

  const fetchInitialOpportunities = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setApiConfigured(true);

    try {
      const response = await fetch('/api/pipelines');
      if (!response.ok) {
        if (response.status === 404) {
          setApiConfigured(false);
          setError('API endpoint not found. Please configure your API integration.');
        } else {
          const errorData = await response.json();
          setError(`Error fetching pipeline data: ${errorData.error || response.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      const pipelineData: GHLPipelineResponse = await response.json();
      if (!pipelineData?.pipelines?.length) {
        setError('No pipeline data available');
        setIsLoading(false);
        return;
      }

      const mappedPipelines: PipelineData[] = await Promise.all(
        pipelineData.pipelines.map(async (pipeline: GHLPipeline) => {
          const stagesWithOpps: PipelineStage[] = await Promise.all(
            pipeline.stages.map(async (stage: GHLStage) => {
              const initialPagination = initializePagination(pipeline.id, stage.id);
              setLoadingStates((prev) => ({
                ...prev,
                [pipeline.id]: {
                  ...prev[pipeline.id],
                  [stage.id]: true,
                },
              }));

              const opportunitiesResponse = await fetch(
                `/api/pipelines/search?pipelineId=${pipeline.id}&stageId=${stage.id}&page=${initialPagination.page}&limit=${initialPagination.limit}`
              );
              if (!opportunitiesResponse.ok) {
                throw new Error(`Error fetching opportunities for stage ${stage.id}: ${opportunitiesResponse.statusText}`);
              }

              const opportunitiesData = await opportunitiesResponse.json();
              const stageOpportunities: Opportunity[] = (opportunitiesData.opportunities || []).map((opp: GHLOpportunity) => ({
                id: opp.id,
                name: opp.name,
                value: `$${opp.monetaryValue || 0}`,
                businessName: opp.contact?.company || '',
                stage: opp.pipelineStageId,
                source: opp.source || '',
                lastActivity: opp.updatedAt || '',
                contact: opp.contact,
              }));

              setPagination((prev) => ({
                ...prev,
                [pipeline.id]: {
                  ...prev[pipeline.id],
                  [stage.id]: {
                    ...initialPagination,
                    total: opportunitiesData.total, // Store API total
                    totalPages: opportunitiesData.totalPages || 1,
                    nextPage: opportunitiesData.nextPage,
                    prevPage: opportunitiesData.prevPage,
                    hasMore: opportunitiesData.nextPage !== null,
                  },
                },
              }));

              setLoadingStates((prev) => ({
                ...prev,
                [pipeline.id]: {
                  ...prev[pipeline.id],
                  [stage.id]: false,
                },
              }));

              return {
                id: stage.id,
                name: stage.name,
                opportunities: stageOpportunities,
                count: opportunitiesData.total, // Use API total for count
                total: `$${stageOpportunities.reduce(
                  (sum: number, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
                  0
                )}`,
              };
            })
          );

          const totalOpportunities = stagesWithOpps.reduce((sum, stage) => sum + stage.count, 0);
          return {
            id: pipeline.id,
            name: pipeline.name,
            stages: stagesWithOpps,
            totalOpportunities,
          };
        })
      );

      setPipelines(mappedPipelines);
      if (mappedPipelines.length > 0) {
        setSelectedPipeline(mappedPipelines[0].id);
        setOpportunities(mappedPipelines[0].stages);
      }
    } catch (error) {
      setError('Failed to fetch pipeline data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMoreOpportunities = useCallback(async (pipelineId: string, stageId: string) => {
    const currentPagination = pagination[pipelineId]?.[stageId] || initializePagination(pipelineId, stageId);
    if (!currentPagination.hasMore || loadingStates[pipelineId]?.[stageId]) return;

    setLoadingStates((prev) => ({
      ...prev,
      [pipelineId]: {
        ...prev[pipelineId],
        [stageId]: true,
      },
    }));

    try {
      const nextPage = currentPagination.page + 1;
      const response = await fetch(
        `/api/pipelines/search?pipelineId=${pipelineId}&stageId=${stageId}&page=${nextPage}&limit=${currentPagination.limit}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching opportunities for stage ${stageId}: ${response.statusText}`);
      }

      const opportunitiesData = await response.json();
      const newOpportunities: Opportunity[] = (opportunitiesData.opportunities || []).map((opp: GHLOpportunity) => ({
        id: opp.id,
        name: opp.name,
        value: `$${opp.monetaryValue || 0}`,
        businessName: opp.contact?.company || '',
        stage: opp.pipelineStageId,
        source: opp.source || '',
        lastActivity: opp.updatedAt || '',
        contact: opp.contact,
      }));

      setOpportunities((prev) =>
        prev.map((stage) => {
          if (stage.id === stageId && pipelineId === selectedPipeline) {
            return {
              ...stage,
              opportunities: [...stage.opportunities, ...newOpportunities],
              count: opportunitiesData.total, // Update with API total
              total: `$${[...stage.opportunities, ...newOpportunities].reduce(
                (sum: number, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
                0
              )}`,
            };
          }
          return stage;
        })
      );

      setPagination((prev) => ({
        ...prev,
        [pipelineId]: {
          ...prev[pipelineId],
          [stageId]: {
            ...currentPagination,
            page: nextPage,
            total: opportunitiesData.total, // Update with API total
            totalPages: opportunitiesData.totalPages || 1,
            nextPage: opportunitiesData.nextPage,
            prevPage: opportunitiesData.prevPage,
            hasMore: opportunitiesData.nextPage !== null,
          },
        },
      }));
    } catch (error) {
      console.error(`Error fetching more opportunities for stage ${stageId}:`, error);
      setError(`Failed to fetch more opportunities for stage ${stageId}`);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [pipelineId]: {
          ...prev[pipelineId],
          [stageId]: false,
        },
      }));
    }
  }, [pagination, loadingStates, selectedPipeline]);

  useEffect(() => {
    fetchInitialOpportunities();
  }, [user]);

  useEffect(() => {
    if (selectedPipeline && pipelines) {
      const pipeline = pipelines.find((pipe) => pipe.id === selectedPipeline);
      if (pipeline) {
        setOpportunities(pipeline.stages);
      }
    }
  }, [selectedPipeline, pipelines]);

  const setupIntersectionObserver = useCallback((stageId: string) => {
    if (!selectedPipeline) return;

    const target = document.getElementById(`load-more-${stageId}`);
    if (!target) return;

    if (observerRefs.current[stageId]) {
      observerRefs.current[stageId].disconnect();
    }

    observerRefs.current[stageId] = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreOpportunities(selectedPipeline, stageId);
        }
      },
      { threshold: 0.1 }
    );

    observerRefs.current[stageId].observe(target);
  }, [selectedPipeline, fetchMoreOpportunities]);

  useEffect(() => {
    if (selectedPipeline && opportunities.length > 0) {
      opportunities.forEach((stage) => setupIntersectionObserver(stage.id));
    }

    return () => {
      Object.values(observerRefs.current).forEach((observer) => observer.disconnect());
    };
  }, [opportunities, selectedPipeline, setupIntersectionObserver]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    setOpportunities(pipelines.find((p) => p.id === pipelineId)?.stages || []);
    setIsDropdownOpen(false);
  };

  const filterOpportunities = (opportunities: Opportunity[]): Opportunity[] => {
    return opportunities.filter((opp) => {
      const matchesSearch =
        !searchTerm ||
        opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.businessName && opp.businessName.toLowerCase().includes(searchTerm.toLowerCase()));

      const value = parseFloat(opp.value.replace('$', ''));
      const matchesValue =
        (!filters.value.min || value >= parseFloat(filters.value.min)) &&
        (!filters.value.max || value <= parseFloat(filters.value.max));

      const matchesSource = filters.source.length === 0 || (opp.source && filters.source.includes(opp.source));

      const matchesActivity =
        filters.lastActivityType.length === 0 ||
        (opp.lastActivityType && filters.lastActivityType.includes(opp.lastActivityType));

      return matchesSearch && matchesValue && matchesSource && matchesActivity;
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

      const valueA = a[sortConfig.key]?.toString() || '';
      const valueB = b[sortConfig.key]?.toString() || '';
      return sortConfig.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  const getProcessedOpportunities = (stageId: string): Opportunity[] => {
    const stageOpportunities = opportunities.find((stage) => stage.id === stageId)?.opportunities || [];
    const filteredOpportunities = filterOpportunities(stageOpportunities);
    return sortOpportunities(filteredOpportunities);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setEditContactData({
      firstName: opportunity.contact?.firstName || '',
      lastName: opportunity.contact?.lastName || '',
      email: opportunity.contact?.email || '',
      locationId: opportunity.contact?.locationId || '',
      phone: opportunity.contact?.phone || '',
      timezone: opportunity.contact?.timezone || '',
      dnd: opportunity.contact?.dnd || false,
      tags: opportunity.contact?.tags || [],
      customFields: opportunity.contact?.customFields || [],
    });
    setIsEditOpportunityModalOpen(true);
  };

  const handleUpdateOpportunityUI = async (formData: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((stage) => ({
        ...stage,
        opportunities: stage.opportunities.map((opp) =>
          opp.id === formData.id ? { ...opp, ...formData } : opp
        ),
      }))
    );
    setIsEditOpportunityModalOpen(false);
  };

  const handleCommunication = async (
    opportunityId: string,
    actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout'
  ) => {
    const opportunity = opportunities
      .flatMap((stage) => stage.opportunities)
      .find((opp) => opp.id === opportunityId);
    if (!opportunity) return;

    if (actionType === 'sms' || actionType === 'email') {
      setMessageModal({
        isOpen: true,
        actionType,
        opportunityId,
        contact: opportunity.contact || null,
      });
    }
  };

  const handleMoveOpportunity = async (opportunityId: string, targetStageId: string) => {
    setLoadingOperation({ id: opportunityId, type: 'move' });
    try {
      // Simulate API call to move opportunity
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      setOpportunities((prev) => {
        const sourceStage = prev.find((stage) =>
          stage.opportunities.some((opp) => opp.id === opportunityId)
        );
        if (!sourceStage) return prev;

        const opportunity = sourceStage.opportunities.find((opp) => opp.id === opportunityId);
        if (!opportunity) return prev;

        return prev.map((stage) => {
          if (stage.id === sourceStage.id) {
            return {
              ...stage,
              opportunities: stage.opportunities.filter((opp) => opp.id !== opportunityId),
              count: stage.count - 1, // Decrease total count
              total: `$${stage.opportunities
                .filter((opp) => opp.id !== opportunityId)
                .reduce((sum, opp) => sum + (parseFloat(opp.value.replace('$', '')) || 0), 0)}`,
            };
          }
          if (stage.id === targetStageId) {
            return {
              ...stage,
              opportunities: [...stage.opportunities, { ...opportunity, stage: targetStageId }],
              count: stage.count + 1, // Increase total count
              total: `$${[...stage.opportunities, opportunity].reduce(
                (sum, opp) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
                0
              )}`,
            };
          }
          return stage;
        });
      });
    } catch (error) {
      console.error('Error moving opportunity:', error);
      setError('Failed to move opportunity');
    } finally {
      setLoadingOperation({ id: null, type: null });
    }
  };

  return (
    <DashboardLayout title="Leads">
      {isLoading || loading ? (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Leads Dashboard</h1>
            <p className="text-gray-600">Manage your leads and opportunities</p>
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
              <h2 className="text-lg font-semibold text-gray-800">Current Leads</h2>
            </div>
            <TableSkeleton rows={5} columns={5} />
          </div>
        </div>
      ) : error ? (
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
      ) : !selectedPipeline ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span>No pipeline selected</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="h-full flex flex-col bg-gray-50">
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
            <div className="px-4 py-6 sm:px-6 lg:px-8 flex-1">
              <AutomationPreview className="mb-6" />
              {viewMode === 'grid' ? (
                <OpportunityGrid
                  opportunities={opportunities}
                  getProcessedOpportunities={getProcessedOpportunities}
                  handleCommunication={handleCommunication}
                  handleEditOpportunity={handleEditOpportunity}
                  handleMoveOpportunity={handleMoveOpportunity}
                  loadingOpportunityId={loadingOperation.id}
                  pagination={pagination[selectedPipeline!]}
                  loadingStates={loadingStates[selectedPipeline!]}
                />
              ) : (
                <OpportunityList
                  opportunities={opportunities}
                  getProcessedOpportunities={getProcessedOpportunities}
                  handleCommunication={handleCommunication}
                  handleEditOpportunity={handleEditOpportunity}
                  handleMoveOpportunity={handleMoveOpportunity}
                  loadingOpportunityId={loadingOperation.id}
                />
              )}
            </div>
            {isFilterModalOpen && (
              <FilterModal
                filters={filters}
                setFilters={setFilters}
                setIsFilterModalOpen={setIsFilterModalOpen}
              />
            )}
            {isSortModalOpen && (
              <SortModal
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                setIsSortModalOpen={setIsSortModalOpen}
              />
            )}
            <MessageModal
              isOpen={messageModal.isOpen}
              onClose={() => setMessageModal({ isOpen: false, actionType: null, opportunityId: null, contact: null })}
              actionType={messageModal.actionType}
              contact={messageModal.contact}
              user={user}
              messageContent={messageContent}
              setMessageContent={setMessageContent}
              onSend={async () => {
               handleCommunication(messageModal.opportunityId!, messageModal.actionType!);
              }}
            />
            <OpportunityEditModal
              isOpen={isEditOpportunityModalOpen}
              onClose={() => setIsEditOpportunityModalOpen(false)}
              opportunityId={selectedOpportunity?.id ?? ""}
              onUpdateOpportunity={handleUpdateOpportunityUI}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}