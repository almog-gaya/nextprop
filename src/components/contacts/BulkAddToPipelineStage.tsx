import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pipeline } from '@/types';
import { createPortal } from 'react-dom';

interface BulkAddToPipelineStageProps {
  contacts: any[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onComplete: (newOpportunities: any[]) => void;
  onError: (error: string) => void;
  isSubmitting: boolean;
}

const BulkAddToPipelineStage: React.FC<BulkAddToPipelineStageProps> = ({
  contacts,
  isOpen,
  setIsOpen,
  onComplete,
  onError,
  isSubmitting
}) => {
  const [mounted, setMounted] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [formData, setFormData] = useState({
    pipelineId: '',
    pipelineStageId: '',
  });
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch pipelines on mount
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await axios.get('/api/pipelines');
        setPipelines(response.data.pipelines || []);
      } catch (err) {
        onError('Failed to load pipelines');
      }
    };
    fetchPipelines();
  }, [onError]);

  // Update stages when pipeline changes
  useEffect(() => {
    const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId);
    setStages(selectedPipeline?.stages || []);
    setFormData(prev => ({ ...prev, pipelineStageId: '' }));
  }, [formData.pipelineId, pipelines]);

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pipelineId || !formData.pipelineStageId) {
      onError('Please select both a pipeline and stage');
      return;
    }

    try {
      const opportunitiesPromises = contacts.map(async (contact) => {
        const opportunityData = {
          pipelineId: formData.pipelineId,
          name: `Lead for ${contact.name || `${contact.firstName} ${contact.lastName}`}`,
          pipelineStageId: formData.pipelineStageId,
          status: 'open',
          contactId: contact.id,
          monetaryValue: 0,
          assignedTo: '',
          customFields: [
            { id: 'PBMP8z9C1uqXL0Vk05ia', key: 'contact.email', field_value: contact.email || '' },
            { id: 'F6IwLG9XCBQZyIbvDIRW', key: 'contact.phone', field_value: contact.phone || '' }
          ]
        };
        return axios.post('/api/opportunities', opportunityData);
      });

      const results = await Promise.all(opportunitiesPromises);
      
      const newOpportunities = results.map((response, index) => {
        const opportunity = response.data.opportunity;
        return {
          id: opportunity.id || `temp-${Date.now()}-${index}`,
          name: opportunity.name || `Opportunity for ${contacts[index].name}`,
          monetaryValue: opportunity.monetaryValue || 0,
          status: opportunity.status || 'open',
          pipelineId: opportunity.pipelineId || formData.pipelineId,
          stageId: opportunity.pipelineStageId || formData.pipelineStageId,
          createdAt: opportunity.createdAt || new Date().toISOString(),
          contact: {
            id: contacts[index].id,
            name: contacts[index].name || `${contacts[index].firstName} ${contacts[index].lastName}`
          }
        };
      });

      onComplete(newOpportunities);
      setIsOpen(false);
      resetForm();
    } catch (err: any) {
      onError(err.message || 'Failed to bulk add contacts');
    }
  };

  const resetForm = () => {
    setFormData({
      pipelineId: '',
      pipelineStageId: '',
    });
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 sm:p-6 z-[9999] overflow-y-auto"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md mx-auto my-8 p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Bulk Add Contacts</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="w-[30px] h-[30px] flex items-center justify-center p-0 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Add {contacts.length} contacts to a pipeline stage
        </p>

        <form onSubmit={handleBulkAdd}>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Pipeline Selection
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pipeline <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.pipelineId}
                    onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value })}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || pipelines.length === 0}
                    required
                  >
                    <option value="">Select a Pipeline</option>
                    {pipelines.map(pipeline => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.pipelineStageId}
                    onChange={(e) => setFormData({ ...formData, pipelineStageId: e.target.value })}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !formData.pipelineId || stages.length === 0}
                    required
                  >
                    <option value="">Select a Stage</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 sticky bottom-0 bg-white pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 ${
                !formData.pipelineId || !formData.pipelineStageId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSubmitting || !formData.pipelineId || !formData.pipelineStageId}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Adding...
                </>
              ) : (
                `Add ${contacts.length} Contacts`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BulkAddToPipelineStage;