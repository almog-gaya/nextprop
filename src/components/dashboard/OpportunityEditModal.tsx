'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface Opportunity {
    id: string;
    name: string;
    monetaryValue: number;
    pipelineId: string;
    pipelineStageId: string;
    status: string;
    assignedTo: string;
    contactId: string;
    contactName?: string;
    customFields: { id: string; key: string; field_value: string }[];
}

interface Pipeline {
    id: string;
    name: string;
    stages: { id: string; name: string }[];
}

interface OpportunityEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunityId: string;
    onUpdateOpportunity: (updatedOpportunity: Opportunity) => void;
}

export default function OpportunityEditModal({
    isOpen,
    onClose,
    opportunityId,
    onUpdateOpportunity,
}: OpportunityEditModalProps) {
    const [formData, setFormData] = useState<Opportunity>({
        pipelineId: '',
        name: '',
        pipelineStageId: '',
        status: 'open',
        monetaryValue: 0,
        assignedTo: '',
        contactId: '',
        contactName: '',
        customFields: [
            { id: 'PBMP8z9C1uqXL0Vk05ia', key: 'contact.email', field_value: '' },
            { id: 'F6IwLG9XCBQZyIbvDIRW', key: 'contact.phone', field_value: '' },
        ],
    });
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && opportunityId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Fetch opportunity
                    const opportunityResponse = await axios.get(`/api/opportunities/${opportunityId}`);
                    const opportunity = opportunityResponse.data.opportunity;

                    // Fetch pipelines
                    const pipelinesResponse = await axios.get('/api/pipelines');
                    const fetchedPipelines = pipelinesResponse.data.pipelines || [];

                    setPipelines(fetchedPipelines);

                    // Assuming the API returns contact info with the opportunity
                    setFormData({
                        pipelineId: opportunity.pipelineId || '',
                        name: opportunity.name || '',
                        pipelineStageId: opportunity.pipelineStageId || opportunity.stageId || '',
                        status: opportunity.status || 'open',
                        monetaryValue: opportunity.monetaryValue || 0,
                        assignedTo: opportunity.assignedTo || '',
                        contactId: opportunity.contactId || '',
                        contactName: opportunity.contact?.name || opportunity.contactName || 'Unknown Contact', // Adjust based on API response
                        customFields: opportunity.customFields?.length
                            ? opportunity.customFields
                            : [
                                { id: 'PBMP8z9C1uqXL0Vk05ia', key: 'contact.email', field_value: opportunity.contact?.email ?? "" },
                                { id: 'F6IwLG9XCBQZyIbvDIRW', key: 'contact.phone', field_value: opportunity.contact?.phone ?? "" },
                            ],
                    });
                    setError(null);
                } catch (err: any) {
                    setError(err.message || 'Failed to load data');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, opportunityId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Remove contactName from the payload since it's not part of the API update
            const { contactName, ...updateData } = formData;
            const response = await axios.put(`/api/opportunities/${opportunityId}`, updateData);
            const opportunityResponse = await axios.get(`/api/opportunities/${opportunityId}`);
            const opportunity = opportunityResponse.data.opportunity;
            onUpdateOpportunity(opportunity);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update opportunity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateCustomField = (key: string, value: string) => {
        setFormData({
            ...formData,
            customFields: formData.customFields.map(cf =>
                cf.key === key ? { ...cf, field_value: value } : cf
            ),
        });
    };

    const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId);
    const stages = selectedPipeline?.stages || [];

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
                <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl p-6">
                    <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Edit Opportunity</h3>
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">Contact Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        className="w-full border border-gray-200 rounded-md p-2 bg-gray-100 text-gray-700"
                                        disabled
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                                        <input
                                            type="email"
                                            value={formData.customFields.find(cf => cf.key === 'contact.email')?.field_value || ''}
                                            onChange={(e) => updateCustomField('contact.email', e.target.value)}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter Email"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.customFields.find(cf => cf.key === 'contact.phone')?.field_value || ''}
                                            onChange={(e) => updateCustomField('contact.phone', e.target.value)}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Phone"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">Opportunity Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter opportunity name"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                                        <select
                                            value={formData.pipelineId}
                                            onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, pipelineStageId: '' })}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            disabled={isSubmitting}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                        <select
                                            value={formData.pipelineStageId}
                                            onChange={(e) => setFormData({ ...formData, pipelineStageId: e.target.value })}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            disabled={isSubmitting || !formData.pipelineId}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        >
                                            <option value="open">Open</option>
                                            <option value="closed">Closed</option>
                                            <option value="lost">Lost</option>
                                            <option value="won">Won</option>
                                            <option value="abandon">Abandon</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Value</label>
                                        <input
                                            type="number"
                                            value={formData.monetaryValue}
                                            onChange={(e) => setFormData({ ...formData, monetaryValue: parseFloat(e.target.value) || 0 })}
                                            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="$ 0"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Update Opportunity'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}