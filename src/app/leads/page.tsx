'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoaders';
import AutomationPreview from '@/components/AutomationPreview';
import { PhoneNumber, useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FilterControls from '@/components/dashboard/FilterControls';
import SearchBar from '@/components/dashboard/SearchBar';
import ActiveFilters from '@/components/dashboard/ActiveFilters';
import OpportunityGrid from '@/components/dashboard/OpportunityGrid';
import OpportunityList from '@/components/dashboard/OpportunityList';
import FilterModal from '@/components/dashboard/FilterModal';
import SortModal from '@/components/dashboard/SortModal';
import ContactEditModal from '@/components/dashboard/ContactEditModal';
import MessageModal from '@/components/dashboard/MessageModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { GHLContact, GHLOpportunity, GHLOpportunityResponse, GHLPipeline, GHLPipelineResponse, GHLStage, Opportunity, PipelineData, PipelineStage } from '@/types/dashboard';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import OpportunityEditModal from '@/components/dashboard/OpportunityEditModal';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  startAfter?: string;
  startAfterId?: string;
}

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [opportunities, setOpportunities] = useState<PipelineStage[]>([]);
  const [pagination, setPagination] = useState<Record<string, Record<string, PaginationState>>>({}); // pipelineId -> stageId -> PaginationState
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPipelineData = async () => {
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
                try {
                  const initialPagination: PaginationState = {
                    page: 1,
                    limit: 10, // Adjust as needed
                    total: 0,
                    totalPages: 1,
                    nextPage: null,
                    prevPage: null,
                  };
                  const opportunitiesResponse = await fetch(
                    `/api/pipelines/search?pipelineId=${pipeline.id}&stageId=${stage.id}&page=${initialPagination.page}&limit=${initialPagination.limit}`

                    // `/api/pipelines/${pipeline.id}/opportunities?page=${initialPagination.page}&limit=${initialPagination.limit}&stageId=${stage.id}`
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

                  console.log(`opportunitiesData?.total: `, opportunitiesData?.total);
                  setPagination((prev) => ({
                    ...prev,
                    [pipeline.id]: {
                      ...prev[pipeline.id],
                      [stage.id]: {
                        ...initialPagination,
                        total: opportunitiesData?.total,
                        totalPages: opportunitiesData?.totalPages || 1,
                        nextPage: opportunitiesData?.nextPage,
                        prevPage: opportunitiesData?.prevPage,
                        startAfter: opportunitiesData?.startAfter,
                        startAfterId: opportunitiesData?.startAfterId,
                      },
                    },
                  }));

                  return {
                    id: stage.id,
                    name: stage.name,
                    opportunities: stageOpportunities,
                    count: stageOpportunities.length,
                    total: `$${stageOpportunities.reduce(
                      (sum: number, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
                      0
                    )}`,
                  };
                } catch (error) {
                  console.error(`Error fetching opportunities for stage ${stage.id}:`, error);
                  return {
                    id: stage.id,
                    name: stage.name,
                    opportunities: [],
                    count: 0,
                    total: '$0',
                  };
                }
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

    fetchPipelineData();
  }, [user]);

  useEffect(() => {
    if (selectedPipeline && pipelines) {
      const pipeline = pipelines.find((pipe) => pipe.id === selectedPipeline);
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

  const handlePageChange = async (pipelineId: string, stageId: string, page: number) => {
    setIsLoading(true);
    try {
      const currentPagination = pagination[pipelineId]?.[stageId] || { page: 1, limit: 10, total: 0, totalPages: 1, nextPage: null, prevPage: null };

      const response = await fetch(
        `/api/pipelines/search?pipelineId=${pipelineId}&stageId=${stageId}&page=${page}&limit=${currentPagination.limit}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching page ${page} for stage ${stageId}: ${response.statusText}`);
      }

      const opportunitiesData: GHLOpportunityResponse & { meta: PaginationState } = await response.json();
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

      const updatedPipelines = pipelines.map((pipeline) => {
        if (pipeline.id === pipelineId) {
          const updatedStages = pipeline.stages.map((stage) => {
            if (stage.id === stageId) {
              return {
                ...stage,
                opportunities: stageOpportunities,
                count: stageOpportunities.length,
                total: `$${stageOpportunities.reduce(
                  (sum: number, opp: Opportunity) => sum + (parseFloat(opp.value.replace('$', '')) || 0),
                  0
                )}`,
              };
            }
            return stage;
          });
          const totalOpportunities = updatedStages.reduce((sum, stage) => sum + stage.count, 0);
          return { ...pipeline, stages: updatedStages, totalOpportunities };
        }
        return pipeline;
      });

      setPipelines(updatedPipelines);
      setOpportunities(updatedPipelines.find((p) => p.id === pipelineId)?.stages || []);
      setPagination((prev) => ({
        ...prev,
        [pipelineId]: {
          ...prev[pipelineId],
          [stageId]: {
            ...prev[pipelineId]?.[stageId],
            page,
            total: opportunitiesData.meta.total,
            totalPages: opportunitiesData.meta.totalPages || 1,
            nextPage: opportunitiesData.meta.nextPage,
            prevPage: opportunitiesData.meta.prevPage,
            startAfter: opportunitiesData.meta.startAfter,
            startAfterId: opportunitiesData.meta.startAfterId,
          },
        },
      }));
    } catch (error) {
      console.error(`Error fetching page ${page} for stage ${stageId}:`, error);
      setError(`Failed to fetch page ${page} for stage ${stageId}`);
    } finally {
      setIsLoading(false);
    }
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
    if (!opportunity.contact) {
      setNotification({
        message: 'No contact information available for this opportunity',
        type: 'error',
      });
      setNotificationActive(true);
      setTimeout(() => setNotificationActive(false), 3000);
      return;
    }

    console.log('Opportunity being edited:', opportunity);

    setSelectedOpportunity(opportunity);
    let customFieldsArray: any[] = [];

    if (opportunity.contact.customFields) {
      if (Array.isArray(opportunity.contact.customFields)) {
        customFieldsArray = opportunity.contact.customFields;
      } else {
        customFieldsArray = Object.entries(opportunity.contact.customFields).map(([key, value]) => ({
          id: key,
          key: key,
          value: value,
        }));
      }
    }

    const contactFirstName = opportunity.name?.split(' ')[0] || opportunity.contact.firstName || '';
    const contactLastName = opportunity.name?.includes(' ')
      ? opportunity.name.substring(opportunity.name.indexOf(' ') + 1)
      : opportunity.contact.lastName || '';

    setEditContactData({
      firstName: contactFirstName,
      lastName: contactLastName,
      email: opportunity.contact.email || '',
      locationId: opportunity.contact.locationId || '',
      phone: opportunity.contact.phone || '',
      timezone: opportunity.contact.timezone || '',
      dnd: opportunity.contact.dnd || false,
      tags: opportunity.contact.tags || [],
      customFields: customFieldsArray,
    });

    setIsEditOpportunityModalOpen(true);
  };


  const handleUpdateOpportunityUI = async (formData: Partial<Opportunity>) => {
    setIsSubmitting(true);
    try {
      console.log(`[handleUpdateOpportunity]: formData: `, formData);
      /// Update UI only
      if (selectedOpportunity) {
        const updatedOpportunity = { ...selectedOpportunity, ...formData };
        setOpportunities((prevOpportunities) =>
          prevOpportunities.map((stage) => {
            if (stage.id === selectedOpportunity?.stage) {
              return {
                ...stage,
                opportunities: stage.opportunities.map((opp) =>
                  opp.id === selectedOpportunity.id ? updatedOpportunity : opp
                ),
              };
            }
            return stage;
          })
        );
      }
       
      setIsEditOpportunityModalOpen(false);
    } catch (error) {
      console.error('Error updating opportunity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSMS = async (contact: GHLContact, message: string, fromNumber: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SMS',
          message,
          fromNumber: fromNumber,
          toNumber: contact.phone,
          contactId: contact.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  };

  const handleEmail = async (contact: GHLContact, subject: string, body: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          type: 'Email',
          html: body,
          emailTo: contact.email,
          subject,
          emailFrom: user?.email || 'no-reply@yourdomain.com',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleCall = async (contact: GHLContact): Promise<boolean> => {
    if ((user?.phoneNumbers?.length ?? 0) <= 0) {
      alert('You don’t have any numbers');
      return false;
    }
    console.log('Initiating call to:', contact);
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Call',
          fromNumber: user?.phoneNumbers![0].phoneNumber,
          toNumber: contact.phone,
          contactId: contact.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }
      return true;
    } catch (error) {
      console.error('Error initiating call:', error);
      return false;
    }
  };

  const handleCommunication = async (
    opportunityId: string,
    actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout'
  ) => {
    try {
      const selectedPipelineData = pipelines.find((pipeline) => pipeline.id === selectedPipeline);
      if (!selectedPipelineData) return;

      const updatedPipeline: PipelineData = JSON.parse(JSON.stringify(selectedPipelineData));
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

      if (!foundOpportunity || !foundOpportunity.contact) return;

      if (actionType === 'sms' || actionType === 'email') {
        setMessageModal({
          isOpen: true,
          actionType,
          opportunityId,
          contact: foundOpportunity.contact,
        });
        return;
      }

      foundOpportunity.lastActivityType = actionType;
      foundOpportunity.lastActivity = new Date().toISOString();

      let targetStageId = currentStageId;
      let notificationMsg = '';
      let success = true;

      switch (actionType) {
        case 'call':
          targetStageId = 'returned-call';
          notificationMsg = `${foundOpportunity.name || 'Contact'} moved to Returned Call stage`;
          success = await handleCall(foundOpportunity.contact);
          break;
        case 'optout':
          targetStageId = 'lead-opted-out';
          notificationMsg = `${foundOpportunity.name || 'Contact'} moved to Lead Opted Out stage`;
          break;
        case 'voicemail':
          if (currentStageId !== 'voice-drop-sent') {
            targetStageId = 'voice-drop-sent';
            notificationMsg = `New voicemail sent to ${foundOpportunity.name || 'Contact'}`;
          }
          break;
      }

      if (success && targetStageId !== currentStageId) {
        const targetStage = updatedPipeline.stages.find((stage) => stage.id === targetStageId);
        if (targetStage) {
          foundOpportunity.stage = targetStageId;
          targetStage.opportunities.push(foundOpportunity);
          targetStage.count = targetStage.opportunities.length;

          setPipelines(pipelines.map((p) => (p.id === selectedPipeline ? updatedPipeline : p)));
          setOpportunities(updatedPipeline.stages);

          setNotification({ message: notificationMsg, type: 'success' });
          setNotificationActive(true);
          setTimeout(() => setNotificationActive(false), 3000);

          if (apiConfigured) {
            try {
              const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId: targetStageId, actionType }),
              });

              if (!response.ok) {
                throw new Error('Failed to update opportunity stage');
              }
            } catch (err) {
              console.error('Error updating opportunity:', err);
              setNotification({
                message: 'Failed to update opportunity. Please try again.',
                type: 'error',
              });
              setNotificationActive(true);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error handling ${actionType}:`, error);
    }
  };

  const handleMoveOpportunity = async (opportunityId: string, targetStageId: string) => {
    try {
      setLoadingOperation({ id: opportunityId, type: 'move' });

      const selectedPipelineData = pipelines.find((pipeline) => pipeline.id === selectedPipeline);
      if (!selectedPipelineData) return;

      const updatedPipeline: PipelineData = JSON.parse(JSON.stringify(selectedPipelineData));
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

      if (!foundOpportunity) {
        setLoadingOperation({ id: null, type: null });
        return;
      }

      const targetStage = updatedPipeline.stages.find((stage) => stage.id === targetStageId);
      if (targetStage) {
        foundOpportunity.stage = targetStageId;
        targetStage.opportunities.push(foundOpportunity);
        targetStage.count = targetStage.opportunities.length;

        setPipelines(pipelines.map((p) => (p.id === selectedPipeline ? updatedPipeline : p)));
        setOpportunities(updatedPipeline.stages);

        setNotification({
          message: `Opportunity moved to ${targetStage.name}`,
          type: 'success',
        });
        setNotificationActive(true);
        setTimeout(() => setNotificationActive(false), 3000);

        if (apiConfigured) {
          const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stageId: targetStageId }),
          });

          if (!response.ok) {
            setNotification({
              message: 'Failed to update opportunity. Reverting changes.',
              type: 'error',
            });
            setNotificationActive(true);

            const originalPipeline: PipelineData = JSON.parse(JSON.stringify(selectedPipelineData));
            setPipelines(pipelines.map((p) => (p.id === selectedPipeline ? originalPipeline : p)));
            setOpportunities(originalPipeline.stages);
          }
        }
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
      setNotification({
        message: 'An error occurred while moving the opportunity.',
        type: 'error',
      });
      setNotificationActive(true);
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
                    handleMoveOpportunity={handleMoveOpportunity}
                    loadingOpportunityId={loadingOperation.id}
                    pagination={pagination[selectedPipeline!]}
                    onPageChange={(stageId, page) => handlePageChange(selectedPipeline!, stageId, page)}
                  />
                ) : (
                  <OpportunityList
                    opportunities={opportunities}
                    getProcessedOpportunities={getProcessedOpportunities}
                    handleCommunication={handleCommunication}
                    handleEditOpportunity={handleEditOpportunity}
                    handleMoveOpportunity={handleMoveOpportunity}
                    loadingOpportunityId={loadingOperation.id}
                    pagination={pagination[selectedPipeline!]}
                    onPageChange={(stageId, page) => handlePageChange(selectedPipeline!, stageId, page)}
                  />
                )}
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
                if (!messageModal.opportunityId || !messageModal.contact || !messageModal.actionType) return;

                let success = false;
                if (messageModal.actionType === 'sms') {
                  const selectedNumber = user?.phoneNumbers?.[0]?.phoneNumber;
                  if (selectedNumber) {
                    success = await handleSMS(messageModal.contact, messageContent.sms, selectedNumber);
                  }
                } else {
                  success = await handleEmail(messageModal.contact, messageContent.emailSubject, messageContent.emailBody);
                }

                setMessageModal({ isOpen: false, actionType: null, opportunityId: null, contact: null });
                setMessageContent({ sms: '', emailSubject: '', emailBody: '' });
                await handleCommunication(messageModal.opportunityId, messageModal.actionType);
              }}
            />
            <OpportunityEditModal
              isOpen={isEditOpportunityModalOpen}
              onClose={() => setIsEditOpportunityModalOpen(false)}
              opportunityId= {selectedOpportunity?.id ?? ""}
              onUpdateOpportunity={handleUpdateOpportunityUI}
            /> 
          </div>
        </div>
      )
      }
    </DashboardLayout >
  );
}