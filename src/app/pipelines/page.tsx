'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Pipeline } from '@/types';
import Link from 'next/link';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/pipelines');
        setPipelines(response.data.pipelines || []);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pipelines');
        setIsLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  return (
    <DashboardLayout title="Pipelines">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Pipelines</h2>
          <button className="btn-primary">Add Pipeline</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loader">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <p>{error}</p>
          </div>
        ) : pipelines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{pipeline.name}</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {pipeline.stages.length} stages
                  </p>
                </div>
                <div className="space-y-2">
                  {pipeline.stages.map((stage) => (
                    <div key={stage.id} className="px-3 py-2 bg-gray-50 rounded text-sm">
                      {stage.name}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <Link href={`/pipelines/${pipeline.id}/opportunities`} className="text-blue-600 hover:text-blue-800">
                    View Opportunities
                  </Link>
                  <div>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pipelines found.</p>
        )}
      </div>
    </DashboardLayout>
  );
} 