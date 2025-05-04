import React, { useState, useEffect } from 'react';
import { OpportunityListSkeleton } from '@/components/SkeletonLoaders';
import axios from 'axios';
import { Pipeline, Opportunity, Contact } from '@/types';
import { Dropdown } from '../../ui/dropdown'

interface FormData {
    pipelineId: string;
    stageId: string;
    name: string;
    monetaryValue: number;
    status: string;
    contact: Contact | null;
    assignedTo?: string;
    customFields: Record<string, string>;
}

interface CustomField {
    name: string;
    value: string;
}

const OpportunitiesTab: React.FC<{
    pipelines: Pipeline[];
    opportunities: Opportunity[];
    contacts: any[];
    selectedPipelineId: string | null;
    setSelectedPipelineId: (id: string | null) => void;
    isLoading: boolean;
    error: string | null;
    setOpportunities: (opportunities: Opportunity[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}> = ({
    pipelines,
    opportunities,
    contacts,
    selectedPipelineId,
    setSelectedPipelineId,
    isLoading,
    error,
    setOpportunities,
    setIsLoading,
    setError
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [formData, setFormData] = useState<FormData>({
        pipelineId: '',
        stageId: '',
        name: '',
        monetaryValue: 0,
        status: 'open',
        contact: null as unknown as Contact,
        assignedTo: '',
        customFields: {}
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.contact) {
            setError("Please select a contact before creating an opportunity");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/opportunities', {
                ...formData,
                contact: formData.contact // Ensure contact is included
            });
            
            const newOpportunity = response.data?.opportunity;
            if (newOpportunity) {
                const formattedOpportunity: Opportunity = {
                    id: newOpportunity.id || `temp-${Date.now()}`,
                    name: newOpportunity.name || formData.name,
                    monetaryValue: newOpportunity.monetaryValue || formData.monetaryValue,
                    status: newOpportunity.status || formData.status,
                    pipelineId: newOpportunity.pipelineId || formData.pipelineId,
                    stageId: newOpportunity.stageId || formData.stageId,
                    contact: newOpportunity.contact || formData.contact,
                    assignedTo: newOpportunity.assignedTo || formData.assignedTo,
                    customFields: newOpportunity.customFields || formData.customFields,
                    createdAt: newOpportunity.createdAt || new Date().toISOString(),
                    updatedAt: newOpportunity.updatedAt || new Date().toISOString()
                };
                
                const newOpportunities = [...opportunities, formattedOpportunity];
                setOpportunities(newOpportunities);
            }
            
            setIsModalOpen(false);
            setError(null);
            resetForm();
        } catch (err: any) {
            console.error('Error creating opportunity:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create opportunity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (opportunity: Opportunity) => {
        setSelectedOpportunity(opportunity);
        setFormData({
            pipelineId: opportunity.pipelineId,
            stageId: opportunity.stageId || '',
            name: opportunity.name,
            monetaryValue: opportunity.monetaryValue,
            status: opportunity.status,
            contact: opportunity.contact || null,
            assignedTo: opportunity.assignedTo || '',
            customFields: opportunity.customFields || {}
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpportunity) return;

        setIsSubmitting(true);
        try {
            const response = await axios.put(`/api/opportunities/${selectedOpportunity.id}`, formData);
            setIsEditModalOpen(false);
            
            // Construct the updated opportunity object with the form data
            const updatedOpportunity: Opportunity = {
                ...selectedOpportunity,
                pipelineId: formData.pipelineId,
                name: formData.name,
                stageId: formData.stageId,
                status: formData.status,
                contact: formData.contact,
                monetaryValue: formData.monetaryValue,
                assignedTo: formData.assignedTo,
                customFields: formData.customFields
            };

            // Update the opportunities array with the new data
            const updatedOpportunities = opportunities.map(opp => 
                opp.id === selectedOpportunity.id ? updatedOpportunity : opp
            );
            setOpportunities(updatedOpportunities);
            
            setError(null);
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Failed to update opportunity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (opportunity: Opportunity) => {
        setSelectedOpportunity(opportunity);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedOpportunity) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`/api/opportunities/${selectedOpportunity.id}`);
            setIsDeleteModalOpen(false);
            const remainingOpportunities = opportunities.filter(opp => 
                opp.id !== selectedOpportunity.id
            );
            setOpportunities(remainingOpportunities);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete opportunity');
        } finally {
            setIsSubmitting(false);
            setSelectedOpportunity(null);
        }
    };

    const resetForm = () => {
        setFormData({
            pipelineId: '',
            stageId: '',
            name: '',
            status: 'open',
            monetaryValue: 0,
            contact: null as unknown as Contact,
            assignedTo: '',
            customFields: {}
        });
        setSelectedOpportunity(null);
    };

    const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId);
    const stages = selectedPipeline?.stages || [];

    const handleCustomFieldChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            customFields: {
                ...prev.customFields,
                [field]: value
            }
        }));
    };

    useEffect(() => {
        // Debug log for opportunities
        console.log("Current opportunities:", opportunities);
        console.log("Selected pipeline:", selectedPipelineId);
    }, [opportunities, selectedPipelineId]);

    if (isLoading) return <OpportunityListSkeleton />;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Opportunities</h1>
                    <p className="text-gray-600">Manage your sales opportunities and deals</p>
                </div>
                <div className="flex space-x-4 mt-4 md:mt-0">
                    <Dropdown
                        value={selectedPipelineId || ''}
                        onChange={setSelectedPipelineId}
                        options={pipelines.map(pipeline => ({
                            value: pipeline.id,
                            label: pipeline.name
                        }))}
                        placeholder="Select Pipeline"
                        disabled={pipelines.length === 0}
                    />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-blue-700 transition-colors"
                        disabled={isSubmitting}
                    >
                        Add Opportunity
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6">
                    <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">Add New Opportunity</h3>
                        <p className="text-gray-600 mb-6">Create a new opportunity by filling in the details below</p>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-lg font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">Contact Details</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Primary Contact Name <span className="text-red-600">*</span>
                                                {!formData.contact && (
                                                    <span className="text-red-500 text-xs ml-1">(required)</span>
                                                )}
                                            </label>
                                            <select
                                                value={formData.contact?.id || ''}
                                                onChange={(e) => setFormData({ ...formData, contact: contacts.find(c => c.id === e.target.value) || undefined })}
                                                className={`w-full border ${!formData.contact ? 'border-red-300' : 'border-gray-200'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                disabled={isSubmitting}
                                                required
                                            >
                                                <option value="">Select Contact</option>
                                                {contacts.map(contact => (
                                                    <option key={contact.id} value={contact.id}>
                                                        {contact.name || `${contact.firstName} ${contact.lastName}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {!formData.contact && (
                                                <p className="mt-1 text-sm text-red-600">A contact is required to create an opportunity</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.customFields.find(cf => cf.name === 'contact.email')?.value || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        customFields: formData.customFields.map(cf =>
                                                            cf.name === 'contact.email' ? { ...cf, value: e.target.value } : cf
                                                        )
                                                    })}
                                                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter Email"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.customFields.find(cf => cf.name === 'contact.phone')?.value || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        customFields: formData.customFields.map(cf =>
                                                            cf.name === 'contact.phone' ? { ...cf, value: e.target.value } : cf
                                                        )
                                                    })}
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                                <select
                                                    value={formData.stageId}
                                                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
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
                                                    type="text"
                                                    value={formData.monetaryValue}
                                                    onChange={(e) => setFormData({ ...formData, monetaryValue: parseInt(e.target.value) || 0 })}
                                                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="$ 0"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded text-white transition-colors ${
                                        !formData.contact ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-blue-700'
                                    }`}
                                    disabled={isSubmitting || !formData.contact}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : 'Create Opportunity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && selectedOpportunity && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6">
                    <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">Edit Opportunity</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-lg font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">Contact Details</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                                            <select
                                                value={formData.contact?.id || ''}
                                                onChange={(e) => setFormData({ ...formData, contact: contacts.find(c => c.id === e.target.value) || undefined })}
                                                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Select Contact</option>
                                                {contacts.map(contact => (
                                                    <option key={contact.id} value={contact.id}>
                                                        {contact.name || `${contact.firstName} ${contact.lastName}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.customFields.find(cf => cf.name === 'contact.email')?.value || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        customFields: formData.customFields.map(cf =>
                                                            cf.name === 'contact.email' ? { ...cf, value: e.target.value } : cf
                                                        )
                                                    })}
                                                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter Email"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.customFields.find(cf => cf.name === 'contact.phone')?.value || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        customFields: formData.customFields.map(cf =>
                                                            cf.name === 'contact.phone' ? { ...cf, value: e.target.value } : cf
                                                        )
                                                    })}
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                                <select
                                                    value={formData.stageId}
                                                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
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
                                                    type="text"
                                                    value={formData.monetaryValue}
                                                    onChange={(e) => setFormData({ ...formData, monetaryValue: parseInt(e.target.value) || 0 })}
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
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Opportunity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && selectedOpportunity && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-6">
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">Delete Opportunity</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{selectedOpportunity.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : opportunities.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                 {opportunities.map((opportunity, index) => {
                                     return opportunity ? (
                                        <tr key={opportunity.id || `unknown-${index}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">{opportunity?.name || 'Unnamed'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                ${opportunity?.monetaryValue ? opportunity.monetaryValue.toLocaleString() : '0'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${opportunity?.status === 'open' ? 'bg-green-100 text-green-800' :
                                                    opportunity?.status === 'won' ? 'bg-blue-100 text-blue-800' :
                                                        opportunity?.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {opportunity?.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {opportunity?.contact?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {opportunity?.stageId || opportunity?.pipelineStageId || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {opportunity?.createdAt ? new Date(opportunity.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => opportunity && handleEdit(opportunity)}
                                                    className="text-purple-600 hover:text-blue-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => opportunity && handleDelete(opportunity)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ) : null;
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-gray-600 text-center py-10">
                        No opportunities available. Click "Add Opportunity" to create one.
                    </p>
                </div>
            )}
        </div>
    );
};

export default OpportunitiesTab;