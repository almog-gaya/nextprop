// types/messageThread.ts
export interface ActivityData {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  assignedTo: string;
  status: string;
  source: string;
  lastStatusChangeAt: string;
  lastStageChangeAt: string;
  lastActionDate: string;
  createdAt: string;
  updatedAt: string;
  contactId: string;
  locationId: string;
  contact: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
    tags: string[];
  };
  notes?: string[];
  tasks?: string[];
  calendarEvents?: string[];
  customFields?: Array<{
    id: string;
    fieldValue: string;
  }>;
  followers?: any[][];
}

export interface OpportunityPopupProps {
  id: string;
  pipelineName: string;
  stageName: string;
  onClose: () => void;
}

import { useState, useEffect } from 'react';

export const OpportunityPopup = ({ id, pipelineName, stageName, onClose }: OpportunityPopupProps) => {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/opportunities/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch opportunity data');
        }
        const result = await response.json();
        const opportunityData = {
          ...result.opportunity,
          notes: result.opportunity.notes || [],
          tasks: result.opportunity.tasks || [],
          calendarEvents: result.opportunity.calendarEvents || [],
          customFields: result.opportunity.customFields || [],
          followers: result.opportunity.followers || [],
        };
        setData(opportunityData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <p className="text-purple-700 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <p className="text-red-500 text-center">{error || 'No data available'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-purple-700">Opportunity Details</h3>
            <button 
              onClick={onClose} 
              className="text-purple-500 hover:text-purple-700 transition-colors duration-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Opportunity Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-purple-500 uppercase">Opportunity Info</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-base font-medium text-black break-words">{data.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Monetary Value</label>
                <p className="text-base font-medium text-black">${data.monetaryValue.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="text-base font-medium text-black capitalize">{data.status}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Pipeline</label>
                <p className="text-base font-medium text-black break-words">{pipelineName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Current Stage</label>
                <p className="text-base font-medium text-black break-words">{stageName}</p>
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-purple-500 uppercase">Contact Info</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500">Contact Name</label>
                <p className="text-base font-medium text-black break-words">{data.contact.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Company</label>
                <p className="text-base font-medium text-black break-words">{data.contact.companyName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-base font-medium text-black break-words">{data.contact.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="text-base font-medium text-black">{data.contact.phone}</p>
              </div>
            </div>
            {data.contact.tags && data.contact.tags.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.contact.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-purple-500 uppercase">Dates</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500">Created At</label>
                <p className="text-base font-medium text-black">
                  {new Date(data.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Updated</label>
                <p className="text-base font-medium text-black">
                  {new Date(data.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {data.notes && data.notes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-purple-500 uppercase">Notes</h4>
              <ul className="space-y-2">
                {data.notes.map((note, index) => (
                  <li key={index} className="text-base text-black bg-purple-50 p-3 rounded-lg break-words">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks Section */}
          {data.tasks && data.tasks.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-purple-500 uppercase">Tasks</h4>
              <ul className="space-y-2">
                {data.tasks.map((task, index) => (
                  <li key={index} className="text-base text-black bg-purple-50 p-3 rounded-lg break-words">
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Custom Fields Section */}
          {data.customFields && data.customFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-purple-500 uppercase">Custom Fields</h4>
              <div className="space-y-2">
                {data.customFields.map((field) => (
                  <p key={field.id} className="text-base text-black bg-purple-50 p-3 rounded-lg break-words">
                    {field.fieldValue}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};