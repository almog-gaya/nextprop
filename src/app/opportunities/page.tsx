'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { OpportunityListSkeleton } from '@/components/SkeletonLoaders';
import axios from 'axios';
import { Pipeline, Opportunity } from '@/types';
import OpportunitiesTab from '@/components/pipelines/tabs/opportunitiesTab';
import PipelinesTab from '@/components/pipelines/tabs/pipelineTab';

type TabType = 'opportunities' | 'pipelines';



export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('opportunities');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [pipelinesRes, contactsRes] = await Promise.all([
          axios.get('/api/pipelines'),
          axios.get('/api/contacts'),
        ]);

        const pipelineData = pipelinesRes.data.pipelines || [];
        setPipelines(pipelineData);
        setContacts(contactsRes.data.contacts || []);

        if (pipelineData.length > 0) {
          const pipelineId = pipelineData[0].id;
          setSelectedPipelineId(pipelineId);
          const opportunitiesRes = await axios.get(`/api/pipelines/${pipelineId}/opportunities`);
          setOpportunities(opportunitiesRes.data.opportunities || []);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch initial data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!selectedPipelineId) return;

      setIsLoading(true);
      try {
        const response = await axios.get(`/api/pipelines/${selectedPipelineId}/opportunities`);
        setOpportunities(response.data.opportunities || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch opportunities');
      } finally {
        setIsLoading(false);
      }
    };
    if (selectedPipelineId && activeTab === 'opportunities') {
      fetchOpportunities();
    }
  }, [selectedPipelineId, activeTab]);

  return (
    <DashboardLayout title="Opportunities">
      <div className="mb-2">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'opportunities'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
              } transition-colors`}
            onClick={() => setActiveTab('opportunities')}
          >
            Opportunities
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'pipelines'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600'
              } transition-colors`}
            onClick={() => setActiveTab('pipelines')}
          >
            Pipelines
          </button>
        </div>
      </div>

      {activeTab === 'opportunities' ? (
        <OpportunitiesTab
          pipelines={pipelines}
          opportunities={opportunities}
          contacts={contacts}
          selectedPipelineId={selectedPipelineId}
          setSelectedPipelineId={setSelectedPipelineId}
          isLoading={isLoading}
          error={error}
          setOpportunities={setOpportunities}
          setError={setError}
          setIsLoading={setIsLoading}
        />
      ) : (
        <PipelinesTab
          pipelines={pipelines}
          setPipelines={setPipelines}
        />
      )}
    </DashboardLayout>
  );
}