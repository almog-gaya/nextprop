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
import { GHLContact, GHLOpportunity, GHLOpportunityResponse, GHLPipeline, GHLPipelineResponse, GHLStage, Opportunity, PipelineData, PipelineStage } from '@/types/dashboard';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { timezones } from '@/utils/timezones';

export default function LeadsPage() {
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
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    actionType: 'sms' | 'email' | null;
    opportunityId: string | null;
    contact: GHLContact | null;
  }>({
    isOpen: false,
    actionType: null,
    opportunityId: null,
    contact: null
  });
  const [messageContent, setMessageContent] = useState({
    sms: '',
    emailSubject: '',
    emailBody: ''
  });
  const [loadingOperation, setLoadingOperation] = useState<{
    id: string | null;
    type: 'move' | 'delete' | 'edit' | null;
  }>({ id: null, type: null });
  
  // Add state for contact edit modal
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const [editContactData, setEditContactData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    locationId: '',
    phone: '',
    timezone: '',
    dnd: false,
    tags: [] as string[],
    customFields: [] as any[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pipeline data effect
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
            try {
              const opportunitiesResponse = await fetch(`/api/pipelines/${pipeline.id}/opportunities`);
              if (!opportunitiesResponse.ok) {
                throw new Error(`Error fetching opportunities: ${opportunitiesResponse.statusText}`);
              }

              const opportunitiesData: GHLOpportunityResponse = await opportunitiesResponse.json();
              const opportunitiesByStage: Record<string, Opportunity[]> = {};

              (opportunitiesData.opportunities || []).forEach((opp: GHLOpportunity) => {
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
                  contact: opp.contact
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
                )}`
              }));

              return {
                id: pipeline.id,
                name: pipeline.name,
                stages: stagesWithOpps,
                totalOpportunities: (opportunitiesData.opportunities || []).length
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
      const matchesSearch = !searchTerm || 
        opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.businessName && opp.businessName.toLowerCase().includes(searchTerm.toLowerCase()));

      const value = parseFloat(opp.value.replace('$', ''));
      const matchesValue = (!filters.value.min || value >= parseFloat(filters.value.min)) &&
        (!filters.value.max || value <= parseFloat(filters.value.max));

      const matchesSource = filters.source.length === 0 || 
        (opp.source && filters.source.includes(opp.source));

      // Check for lastActivityType if it exists on the opportunity
      const matchesActivity = filters.lastActivityType.length === 0 || 
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
      return sortConfig.direction === 'asc' ? 
        valueA.localeCompare(valueB) : 
        valueB.localeCompare(valueA);
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
        type: 'error'
      });
      setNotificationActive(true);
      setTimeout(() => setNotificationActive(false), 3000);
      return;
    }
    
    // Log the opportunity data for debugging
    console.log('Opportunity being edited:', opportunity);
    
    setSelectedContact(opportunity.contact);
    let customFieldsArray: any[] = [];
    
    if (opportunity.contact.customFields) {
      if (Array.isArray(opportunity.contact.customFields)) {
        customFieldsArray = opportunity.contact.customFields;
      } else {
        customFieldsArray = Object.entries(opportunity.contact.customFields).map(([key, value]) => ({
          id: key,
          key: key,
          value: value
        }));
      }
    }
    
    // Extract name from opportunity or contact - opportunity name takes precedence
    const contactFirstName = opportunity.name?.split(' ')[0] || opportunity.contact.firstName || '';
    const contactLastName = opportunity.name?.includes(' ') ? 
                         opportunity.name.substring(opportunity.name.indexOf(' ')+1) : 
                         opportunity.contact.lastName || '';
    
    setEditContactData({
      firstName: contactFirstName,
      lastName: contactLastName,
      email: opportunity.contact.email || '',
      locationId: opportunity.contact.locationId || '',
      phone: opportunity.contact.phone || '',
      timezone: opportunity.contact.timezone || '',
      dnd: opportunity.contact.dnd || false,
      tags: opportunity.contact.tags || [],
      customFields: customFieldsArray
    });
    
    setIsEditContactModalOpen(true);
  };

  const handleUpdateContact = async (formData: any) => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/contacts/${selectedContact.id}`, formData);

      if (response.data) {
        // Update opportunity data with updated contact info
        const updatedPipelines = pipelines.map(pipeline => {
          const updatedStages = pipeline.stages.map(stage => {
            const updatedOpportunities = stage.opportunities.map(opp => {
              if (opp.contact && opp.contact.id === selectedContact.id) {
                return {
                  ...opp,
                  contact: response.data
                };
              }
              return opp;
            });
            
            return {
              ...stage,
              opportunities: updatedOpportunities
            };
          });
          
          return {
            ...pipeline,
            stages: updatedStages
          };
        });
        
        setPipelines(updatedPipelines);
        setOpportunities(updatedPipelines.find(p => p.id === selectedPipeline)?.stages || []);
        
        toast.success('Contact updated successfully');
        setIsEditContactModalOpen(false);
        setSelectedContact(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSMS = async (contact: GHLContact, message: string) => {
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SMS',
          message,
          fromNumber: user?.lcPhone?.locationId,
          toNumber: contact.phone,
          contactId: contact.id
        })
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

  const handleEmail = async (contact: GHLContact, subject: string, body: string) => {
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMAIL',
          html: body,
          emailTo: contact.email,
          subject,
          emailFrom: user?.email || 'no-reply@yourdomain.com'
        })
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

  const handleCall = async (contact: GHLContact) => {
    // Implement call functionality
    console.log('Initiating call to:', contact);
    return true;
  };

  const handleCommunication = async (
    opportunityId: string,
    actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout'
  ) => {
    try {
      const selectedPipelineData = pipelines.find((pipeline) => pipeline.id === selectedPipeline);
      if (!selectedPipelineData) return;

      const updatedPipeline = JSON.parse(JSON.stringify(selectedPipelineData)) as PipelineData;
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
          contact: foundOpportunity.contact
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

          setPipelines(pipelines.map(p => 
            p.id === selectedPipeline ? updatedPipeline : p
          ));
          setOpportunities(updatedPipeline.stages);

          setNotification({ message: notificationMsg, type: 'success' });
          setNotificationActive(true);
          setTimeout(() => setNotificationActive(false), 3000);

          if (apiConfigured) {
            try {
              const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId: targetStageId, actionType })
              });

              if (!response.ok) {
                throw new Error('Failed to update opportunity stage');
              }
            } catch (err) {
              console.error('Error updating opportunity:', err);
              setNotification({
                message: 'Failed to update opportunity. Please try again.',
                type: 'error'
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
      // First update UI optimistically
      setLoadingOperation({ id: opportunityId, type: 'move' });
      
      // Find the opportunity and current stage
      const selectedPipelineData = pipelines.find((pipeline) => pipeline.id === selectedPipeline);
      if (!selectedPipelineData) return;
      
      const updatedPipeline = JSON.parse(JSON.stringify(selectedPipelineData)) as PipelineData;
      let foundOpportunity: Opportunity | null = null;
      let currentStageId = '';

      // Find and remove the opportunity from its current stage
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

      // Find the target stage and add the opportunity to it
      const targetStage = updatedPipeline.stages.find((stage) => stage.id === targetStageId);
      if (targetStage) {
        foundOpportunity.stage = targetStageId;
        targetStage.opportunities.push(foundOpportunity);
        targetStage.count = targetStage.opportunities.length;

        // Update the pipelines state with the moved opportunity
        setPipelines(pipelines.map(p => 
          p.id === selectedPipeline ? updatedPipeline : p
        ));
        setOpportunities(updatedPipeline.stages);

        // Notify the user about the move
        setNotification({ 
          message: `Opportunity moved to ${targetStage.name}`, 
          type: 'success' 
        });
        setNotificationActive(true);
        setTimeout(() => setNotificationActive(false), 3000);

        // Call the API to persist the change
        if (apiConfigured) {
          const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stageId: targetStageId })
          });

          if (!response.ok) {
            // If the API call fails, revert the change
            setNotification({
              message: 'Failed to update opportunity. Reverting changes.',
              type: 'error'
            });
            setNotificationActive(true);
            
            // Revert to original state
            const originalPipeline = JSON.parse(JSON.stringify(selectedPipelineData)) as PipelineData;
            setPipelines(pipelines.map(p => 
              p.id === selectedPipeline ? originalPipeline : p
            ));
            setOpportunities(originalPipeline.stages);
          }
        }
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
      setNotification({
        message: 'An error occurred while moving the opportunity.',
        type: 'error'
      });
      setNotificationActive(true);
    } finally {
      setLoadingOperation({ id: null, type: null });
    }
  };

  const ContactEditModal = () => {
    const [formData, setFormData] = useState(editContactData);

    useEffect(() => {
      setFormData(editContactData);
    }, [editContactData]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUpdateContact(formData);
    };

    // Display name for the contact - use opportunity name if available
    // This should match what is shown in the leads board
    const displayName = selectedContact?.name || formData.firstName || "Contact";
    
    // Log for debugging
    console.log("Contact data for modal:", selectedContact);
    console.log("Form data for modal:", formData);

    const renderCustomFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
      if (field.picklistOptions && field.picklistOptions.length > 0) {
        return (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
            disabled={isSubmitting}
          >
            <option value="">Select {field.name}</option>
            {field.picklistOptions.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      switch (field.dataType) {
        case 'TEXT':
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
              placeholder={`Enter ${field.name}`}
              disabled={isSubmitting}
            />
          );
        case 'CHECKBOX':
          return (
            <div className="space-y-2">
              {field.picklistOptions?.map((option: any) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        newValue.push(option.value);
                      } else {
                        const index = newValue.indexOf(option.value);
                        if (index > -1) newValue.splice(index, 1);
                      }
                      onChange({ id: field.id, key: field.fieldKey, value: newValue });
                    }}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          );
        default:
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
              placeholder={`Enter ${field.name}`}
              disabled={isSubmitting}
            />
          );
      }
    };

    // Standard custom fields - these would be fetched from your API in a real app
    const customFieldsDefinitions = [
      {
        id: "ECqyHR21ZJnSMolxlHpU",
        dataType: "STANDARD_FIELD",
        fieldKey: "contact.type",
        name: "Contact Type",
        picklistOptions: [
          { value: "lead", name: "Lead" },
          { value: "customer", name: "Customer" }
        ]
      }
    ];

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 z-50"
        onClick={() => setIsEditContactModalOpen(false)}
      >
        <div 
          className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsEditContactModalOpen(false)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Edit Contact: {displayName}</h3>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6">Update contact details below</p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-5">

              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                  disabled={isSubmitting}
                >
                  <option value="">Select Timezone</option>
                  {timezones.map(timezone => (
                    <option key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={formData.dnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, dnd: e.target.checked }))}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  Do Not Disturb
                </label>
              </div>

              {/* Tags section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.tags && formData.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          const newTags = [...formData.tags];
                          newTags.splice(index, 1);
                          setFormData(prev => ({ ...prev, tags: newTags }));
                        }}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex">
                  <input
                    type="text"
                    id="newTag"
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        const value = target.value.trim();
                        if (value && !formData.tags.includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, value]
                          }));
                          target.value = '';
                        }
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Custom fields section */}
              {customFieldsDefinitions.map(field => {
                const customFieldValue = formData.customFields.find(cf => cf.id === field.id)?.value ||
                  (field.dataType === 'CHECKBOX' ? [] : '');

                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                    {renderCustomFieldInput(field, customFieldValue, (value) => {
                      const updatedCustomFields = [...formData.customFields.filter(cf => cf.id !== field.id), value];
                      setFormData(prev => ({ ...prev, customFields: updatedCustomFields }));
                    })}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsEditContactModalOpen(false)}
                className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-2 text-white rounded-md bg-blue-500 hover:bg-blue-600 text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                    Updating...
                  </>
                ) : 'Update Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Leads">
      {isLoading || loading ? (
        // Loading state
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Leads Dashboard</h1>
            <p className="text-gray-600">Manage your leads and opportunities</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4).fill(0).map((_, i) => (
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
        // Error state
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
        // No pipeline selected
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span>No pipeline selected</span>
            </div>
          </div>
        </div>
      ) : (
        // Content when data is loaded
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
            {messageModal.isOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <h3 className="text-lg font-medium mb-4">
                    {messageModal.actionType === 'sms' ? 'Send SMS' : 'Send Email'}
                  </h3>
                  {messageModal.actionType === 'sms' ? (
                    <textarea
                      className="w-full p-2 border rounded mb-4"
                      value={messageContent.sms}
                      onChange={(e) => setMessageContent({ ...messageContent, sms: e.target.value })}
                      placeholder="Enter your SMS message"
                      rows={4}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="w-full p-2 border rounded mb-4"
                        value={messageContent.emailSubject}
                        onChange={(e) => setMessageContent({ ...messageContent, emailSubject: e.target.value })}
                        placeholder="Email Subject"
                      />
                      <textarea
                        className="w-full p-2 border rounded mb-4"
                        value={messageContent.emailBody}
                        onChange={(e) => setMessageContent({ ...messageContent, emailBody: e.target.value })}
                        placeholder="Enter your email message"
                        rows={4}
                      />
                    </>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => setMessageModal({ isOpen: false, actionType: null, opportunityId: null, contact: null })}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                      onClick={() => {}}
                      disabled={
                        messageModal.actionType === 'sms' 
                          ? !messageContent.sms 
                          : !messageContent.emailSubject || !messageContent.emailBody
                      }
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isEditContactModalOpen && (
              <ContactEditModal />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 