import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PipelineChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
}

export default function PipelineChangeModal({ isOpen, onClose, selectedCount }: PipelineChangeModalProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [opportunityName, setOpportunityName] = useState('');
  const [opportunitySource, setOpportunitySource] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [opportunityStatus, setOpportunityStatus] = useState('');
  const [action, setAction] = useState('');
  const [touched, setTouched] = useState<{ pipeline?: boolean; stage?: boolean }>({});

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ pipeline: true, stage: true });
    if (!selectedPipeline || !selectedStage) return;
    // Handle pipeline change logic here
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Add/Update Opportunity</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 pb-0">
            {/* Subtitle and contact count */}
            <div className="flex items-center mb-6">
              <span className="text-lg font-medium text-gray-800 mr-3">Apply opportunity to following contacts</span>
              <span className="flex items-center justify-center bg-green-100 text-green-700 rounded-full w-7 h-7 text-base font-bold border border-green-300">{selectedCount}</span>
            </div>
            {/* Pipeline Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select pipeline
              </label>
              <select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, pipeline: true }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select pipeline</option>
                <option value="buyers">Buyers Pipeline</option>
                <option value="sellers">Sellers Pipeline</option>
                <option value="investors">Investors Pipeline</option>
              </select>
              {touched.pipeline && !selectedPipeline && (
                <div className="text-xs text-red-500 mt-1">* Pipeline required</div>
              )}
            </div>
            {/* Stage Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, stage: true }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedPipeline}
              >
                <option value="">Select stage</option>
                {selectedPipeline === 'buyers' && (
                  <>
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="viewing">Viewing</option>
                    <option value="offer">Offer Made</option>
                    <option value="closed">Closed</option>
                  </>
                )}
                {selectedPipeline === 'sellers' && (
                  <>
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="listing">Listing</option>
                    <option value="under_contract">Under Contract</option>
                    <option value="closed">Closed</option>
                  </>
                )}
                {selectedPipeline === 'investors' && (
                  <>
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="analysis">Analysis</option>
                    <option value="offer">Offer Made</option>
                    <option value="closed">Closed</option>
                  </>
                )}
              </select>
              {touched.stage && !selectedStage && (
                <div className="text-xs text-red-500 mt-1">* Stage required</div>
              )}
            </div>
            {/* Opportunity Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name</label>
              <input
                type="text"
                value={opportunityName}
                onChange={e => setOpportunityName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Opportunity Name"
              />
            </div>
            {/* Opportunity Source */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Source</label>
              <input
                type="text"
                value={opportunitySource}
                onChange={e => setOpportunitySource(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Opportunity Source"
              />
            </div>
            {/* Lead Value */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead value</label>
              <input
                type="text"
                value={leadValue}
                onChange={e => setLeadValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Lead value"
              />
            </div>
            {/* Opportunity Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Status</label>
              <select
                value={opportunityStatus}
                onChange={e => setOpportunityStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Opportunity Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            {/* Action */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                value={action}
                onChange={e => setAction(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description for the action (to be shown in tracking report)"
              />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 px-6 pb-6 pt-4 bg-white flex-shrink-0 ">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPipeline || !selectedStage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add/Update Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 