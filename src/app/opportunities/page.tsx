'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Pipeline, Opportunity } from '@/types';

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/pipelines');
        const pipelineData = response.data.pipelines || [];
        setPipelines(pipelineData);
        
        if (pipelineData.length > 0) {
          setSelectedPipelineId(pipelineData[0].id);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pipelines');
        setIsLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!selectedPipelineId) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/pipelines/${selectedPipelineId}/opportunities`);
        setOpportunities(response.data.opportunities || []);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch opportunities');
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [selectedPipelineId]);

  return (
    <DashboardLayout title="Opportunities">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Opportunities</h2>
          <div className="flex space-x-4">
            <select 
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              disabled={isLoading || pipelines.length === 0}
            >
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <button className="btn-primary">Add Opportunity</button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loader">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <p>{error}</p>
          </div>
        ) : opportunities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{opportunity.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${opportunity.monetaryValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        opportunity.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {opportunity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {opportunity.contact?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(opportunity.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No opportunities found for the selected pipeline.</p>
        )}
      </div>
    </DashboardLayout>
  );
} 