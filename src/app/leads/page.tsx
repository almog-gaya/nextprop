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
import LeadsTopBar from '@/components/LeadsTopBar';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { SortAscIcon, SortDescIcon } from 'lucide-react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  hasMore: boolean;
}

// SVG for the dotted square icon
const DottedSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="#111827" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="7" y="7" width="6" height="6" rx="1" fill="#111827" />
  </svg>
);

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [loadedPipelines, setLoadedPipelines] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [opportunities, setOpportunities] = useState<PipelineStage[]>([]);
  const [pagination, setPagination] = useState<Record<string, Record<string, PaginationState>>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({});
  const [notificationActive, setNotificationActive] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string }>({ message: '', type: '' });
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

  const fetchPipelines = async () => {
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
        return;
      }

      const pipelineData: GHLPipelineResponse = await response.json();
      if (!pipelineData?.pipelines?.length) {
        setError('No pipeline data available');
        return;
      }

      const mappedPipelines: PipelineData[] = pipelineData.pipelines.map((pipeline: GHLPipeline) => ({
        id: pipeline.id,
        name: pipeline.name,
        stages: pipeline.stages.map((stage: GHLStage) => ({
          id: stage.id,
          name: stage.name,
          opportunities: [],
          count: 0,
          total: '$0'
        })),
        totalOpportunities: 0,
      }));

      setPipelines(mappedPipelines);
      if (mappedPipelines.length > 0 && !selectedPipeline) {
        setSelectedPipeline(mappedPipelines[0].id);
      }
    } catch (error) {
      setError('Failed to fetch pipeline data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPipelineOpportunities = async (pipelineId: string) => {
    if (!user) return;

    setLoadingStates((prev) => ({
      ...prev,
      [pipelineId]: prev[pipelineId] || {},
    }));

    try {
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (!pipeline) return;

      const stagesWithOpps: PipelineStage[] = await Promise.all(
        pipeline.stages.map(async (stage: GHLStage) => {
          const initialPagination = initializePagination(pipelineId, stage.id);
          setLoadingStates((prev) => ({
            ...prev,
            [pipelineId]: {
              ...prev[pipelineId],
              [stage.id]: true,
            },
          }));

          const opportunitiesResponse = await fetch(
            `/api/pipelines/search?pipelineId=${pipelineId}&stageId=${stage.id}&page=${initialPagination.page}&limit=${initialPagination.limit}`
          );

          if (!opportunitiesResponse.ok) {
            throw new Error(`Error fetching opportunities for stage ${stage.id}`);
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
            [pipelineId]: {
              ...prev[pipelineId],
              [stage.id]: {
                ...initialPagination,
                total: opportunitiesData.total,
                totalPages: opportunitiesData.totalPages || 1,
                nextPage: opportunitiesData.nextPage,
                prevPage: opportunitiesData.prevPage,
                hasMore: opportunitiesData.nextPage !== null,
              },
            },
          }));

          setLoadingStates((prev) => ({
            ...prev,
            [pipelineId]: {
              ...prev[pipelineId],
              [stage.id]: false,
            },
          }));

          return {
            id: stage.id,
            name: stage.name,
            opportunities: stageOpportunities,
            count: opportunitiesData.total,
            total: `$${stageOpportunities.reduce(
              (sum: number, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
              0
            )}`,
          };
        })
      );

      setPipelines((prev) =>
        prev.map((p) =>
          p.id === pipelineId
            ? {
              ...p,
              stages: stagesWithOpps,
              totalOpportunities: stagesWithOpps.reduce((sum, stage) => sum + stage.count, 0),
            }
            : p
        )
      );

      setLoadedPipelines((prev) => new Set(prev).add(pipelineId));

      if (pipelineId === selectedPipeline) {
        setOpportunities(stagesWithOpps);
      }
    } catch (error) {
      setError('Failed to fetch opportunities: ' + (error as Error).message);
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
        throw new Error(`Error fetching opportunities for stage ${stageId}`);
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
              count: opportunitiesData.total,
              total: `$${[...stage.opportunities, ...newOpportunities].reduce(
                (sum, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
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
            total: opportunitiesData.total,
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
    fetchPipelines();
  }, [user]);

  useEffect(() => {
    if (selectedPipeline) {
      fetchPipelineOpportunities(selectedPipeline);
    }
  }, [selectedPipeline]);

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
    setIsDropdownOpen(false);
    // Reset the pipeline data completely
    setLoadedPipelines(new Set());
    setOpportunities([]);
    setPagination({});
    setLoadingStates({});
    // Force a fresh fetch of the pipeline data
    fetchPipelineOpportunities(pipelineId);
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
      await new Promise((resolve) => setTimeout(resolve, 500));
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
              count: stage.count - 1,
              total: `$${stage.opportunities
                .filter((opp) => opp.id !== opportunityId)
                .reduce((sum, opp) => sum + (parseFloat(opp.value.replace('$', '')) || 0), 0)}`,
            };
          }
          if (stage.id === targetStageId) {
            return {
              ...stage,
              opportunities: [...stage.opportunities, { ...opportunity, stage: targetStageId }],
              count: stage.count + 1,
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

  const isPipelineLoading = selectedPipeline && !loadedPipelines.has(selectedPipeline);

  // Calculate total leads in selected pipeline
  const totalLeads = (() => {
    if (!selectedPipeline) return 0;
    const pipeline = pipelines.find((p) => p.id === selectedPipeline);
    return pipeline ? pipeline.totalOpportunities : 0;
  })();

  // Pipeline Dropdown (dotted square icon, selected pipeline name)
  const pipelineDropdown = (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen((open) => !open)}
        className="flex items-center px-3 py-2 border border-gray-200 rounded bg-white text-gray-900 text-sm font-semibold gap-2 min-w-[140px]"
      >
        <DottedSquareIcon />
        {pipelines.find((p) => p.id === selectedPipeline)?.name || 'Select Pipeline'}
        <ChevronDownIcon className="w-4 h-4 ml-1" />
      </button>
      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
          {pipelines.map((pipeline) => (
            <button
              key={pipeline.id}
              onClick={() => {
                setSelectedPipeline(pipeline.id);
                setIsDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${pipeline.id === selectedPipeline ? 'bg-gray-100 font-semibold' : ''}`}
            >
              {pipeline.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Sorting Dropdown UI (styled as in the screenshot)
  const sortingDropdown = (
    <button
      className="flex items-center px-3 py-2 border border-gray-200 rounded bg-white text-black text-sm font-semibold gap-2"
      onClick={() => setIsSortModalOpen(true)}
    >
      <SortAscIcon />
      Sorting
    </button>
  );

  return (
    <DashboardLayout title="Leads">
      <div className="w-full h-full flex flex-col"style={{ width: '84.8vw' }}>
        <div className="w-full flex-none" >
          <div className="w-full" style={{ width: 'inherit' }}>
            <LeadsTopBar
              totalLeads={totalLeads}
              viewMode={viewMode}
              setViewMode={setViewMode}
              pipelineDropdown={pipelineDropdown}
              sortingDropdown={sortingDropdown}
            />
            <div className="bg-white border-b border-gray-200 px-4 py-4" style={{ width: 'inherit' }}>
              <div className="flex justify-between items-center">
                <FilterControls
                  setIsFilterModalOpen={setIsFilterModalOpen}
                  setIsSortModalOpen={setIsSortModalOpen}
                  filters={filters}
                  sortConfig={sortConfig}
                />
                <SearchBar searchTerm={searchTerm} placeHolder="Search Leads..." setSearchTerm={setSearchTerm} />
              </div>
            </div>
            <ActiveFilters
              filters={filters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setFilters={setFilters}
              setSortConfig={setSortConfig}
            />
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <div className="h-full">
            <div className="px-2 pt-4 h-full">
              <AutomationPreview className="mb-6" />

              {isLoading || loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>
              ) : !apiConfigured ? (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>API configuration required</span>
                  </div>
                  <div className="mt-4">
                    <p className="mb-4">
                      It looks like you need to configure your API integration. Please go to the settings page to set up
                      your integration.
                    </p>
                    <Link href="/settings">
                      <button className="nextprop-button-secondary">Go to Settings</button>
                    </Link>
                  </div>
                </div>
              ) : !selectedPipeline ? (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>No pipeline selected</span>
                  </div>
                </div>
              ) : isPipelineLoading ? (
                <div className="text-center py-8 text-gray-500">Loading opportunities...</div>
              ) : (
                <div className="h-full">
                  <div className="h-full overflow-hidden">
                    <div className="h-full" style={{ width: 'inherit' }}>
                      {viewMode === 'grid' ? (
                        <OpportunityGrid
                          opportunities={opportunities}
                          getProcessedOpportunities={getProcessedOpportunities}
                          handleCommunication={handleCommunication}
                          handleEditOpportunity={handleEditOpportunity}
                          handleMoveOpportunity={handleMoveOpportunity}
                          loadingOpportunityId={loadingOperation.id}
                          pagination={pagination[selectedPipeline]}
                          loadingStates={loadingStates[selectedPipeline]}
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
    </DashboardLayout>
  );
}