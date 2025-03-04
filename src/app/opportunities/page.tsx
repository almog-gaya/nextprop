'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Pipeline, Opportunity } from '@/types';

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState({
    pipelineId: '',
    locationId: 've9EPM428h8vShlRW1KT',
    name: '',
    pipelineStageId: '',
    status: 'open',
    contactId: '',
    monetaryValue: 0,
    assignedTo: '',
    customFields: [
      { id: 'email', key: 'primary_email', field_value: '' },
      { id: 'phone', key: 'primary_phone', field_value: '' }
    ]
  });

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/pipelines');
        const pipelineData = response.data.pipelines || [];
        setPipelines(pipelineData);
        
        if (pipelineData.length > 0) {
          const pipelineId = pipelineData[0].id;
          const opportunitiesRes = await axios.get(`/api/pipelines/${pipelineId}/opportunities`);
          setOpportunities(opportunitiesRes.data.opportunities || []);
          setSelectedPipelineId(pipelineId);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipelines();
  }, []);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!selectedPipelineId || !pipelines.length) return;
      
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

    if (pipelines.length > 0) {
      fetchOpportunities();
    }
  }, [selectedPipelineId, pipelines]);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const [contactsRes, usersRes] = await Promise.all([
          axios.get('/api/contacts'),
          axios.get('/api/users')
        ]);
        setContacts(contactsRes.data.contacts || []);
        setUsers(usersRes.data.users || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch contacts or users');
      }
    };
    fetchAdditionalData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/opportunities', formData);
      setIsModalOpen(false);
      setIsLoading(true);
      const response = await axios.get(`/api/pipelines/${selectedPipelineId}/opportunities`);
      setOpportunities(response.data.opportunities || []);
      setError(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create opportunity');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleEdit = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setFormData({
      pipelineId: opportunity.pipelineId,
      locationId: 've9EPM428h8vShlRW1KT',
      name: opportunity.name,
      pipelineStageId: opportunity.pipelineStageId,
      status: opportunity.status,
      contactId: opportunity.contactId || '',
      monetaryValue: opportunity.monetaryValue,
      assignedTo: opportunity.assignedTo || '',
      customFields: opportunity.customFields || [
        { id: 'email', key: 'primary_email', field_value: '' },
        { id: 'phone', key: 'primary_phone', field_value: '' }
      ]
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;
    
    setIsSubmitting(true);
    try {
      await axios.put(`/api/opportunities/${selectedOpportunity.id}`, formData);
      setIsEditModalOpen(false);
      setIsLoading(true);
      const response = await axios.get(`/api/pipelines/${selectedPipelineId}/opportunities`);
      setOpportunities(response.data.opportunities || []);
      setError(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update opportunity');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
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
      setIsLoading(true);
      const response = await axios.get(`/api/pipelines/${selectedPipelineId}/opportunities`);
      setOpportunities(response.data.opportunities || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete opportunity');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      setSelectedOpportunity(null);
    }
  };

  const resetForm = () => {
    setFormData({
      pipelineId: '',
      locationId: 've9EPM428h8vShlRW1KT',
      name: '',
      pipelineStageId: '',
      status: 'open',
      contactId: '',
      monetaryValue: 0,
      assignedTo: '',
      customFields: [
        { id: 'email', key: 'primary_email', field_value: '' },
        { id: 'phone', key: 'primary_phone', field_value: '' }
      ]
    });
    setSelectedOpportunity(null);
  };

  const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId);
  const stages = selectedPipeline?.stages || [];

  return (
    <DashboardLayout title="Opportunities">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Opportunities</h2>
          <div className="flex space-x-4">
            <div className="relative">
              <select 
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent appearance-none pr-8"
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
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
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
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Add New Opportunity</h3>
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">Create a new opportunity by filling in the details below</p>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3 border-b border-gray-200 pb-2">Contact Details</h4>
                    <div className="space-y-4 sm:space-y-5">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                        <select
                          value={formData.contactId}
                          onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
                          disabled={isSubmitting}
                        >
                          <option value="">Select Contact</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name || `${contact.firstName} ${contact.lastName}`}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                          <input
                            type="email"
                            value={formData.customFields.find(cf => cf.key === 'primary_email')?.field_value || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              customFields: formData.customFields.map(cf =>
                                cf.key === 'primary_email' ? { ...cf, field_value: e.target.value } : cf
                              )
                            })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="Enter Email"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                          <input
                            type="tel"
                            value={formData.customFields.find(cf => cf.key === 'primary_phone')?.field_value || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              customFields: formData.customFields.map(cf =>
                                cf.key === 'primary_phone' ? { ...cf, field_value: e.target.value } : cf
                              )
                            })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="Phone"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3 border-b border-gray-200 pb-2">Opportunity Details</h4>
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                          placeholder="Enter opportunity name"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                          <select
                            value={formData.pipelineId}
                            onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, pipelineStageId: '' })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
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
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                          <select
                            value={formData.pipelineStageId}
                            onChange={(e) => setFormData({ ...formData, pipelineStageId: e.target.value })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
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
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
                            disabled={isSubmitting}
                          >
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                            <option value="lost">Lost</option>
                            <option value="won">Won</option>
                            <option value="abandon">Abandon</option>
                          </select>
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Value</label>
                          <input
                            type="text"
                            value={formData.monetaryValue}
                            onChange={(e) => setFormData({ ...formData, monetaryValue: parseInt(e.target.value) || 0 })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="$ 0"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary px-4 py-2 text-white rounded-md text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Create Opportunity'
                    )}
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
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Edit Opportunity</h3>
              <form onSubmit={handleUpdate}>
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3 border-b border-gray-200 pb-2">Contact Details</h4>
                    <div className="space-y-4 sm:space-y-5">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                        <select
                          value={formData.contactId}
                          onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
                          disabled={isSubmitting}
                        >
                          <option value="">Select Contact</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name || `${contact.firstName} ${contact.lastName}`}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                          <input
                            type="email"
                            value={formData.customFields.find(cf => cf.key === 'primary_email')?.field_value || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              customFields: formData.customFields.map(cf =>
                                cf.key === 'primary_email' ? { ...cf, field_value: e.target.value } : cf
                              )
                            })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="Enter Email"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                          <input
                            type="tel"
                            value={formData.customFields.find(cf => cf.key === 'primary_phone')?.field_value || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              customFields: formData.customFields.map(cf =>
                                cf.key === 'primary_phone' ? { ...cf, field_value: e.target.value } : cf
                              )
                            })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="Phone"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3 border-b border-gray-200 pb-2">Opportunity Details</h4>
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                          placeholder="Enter opportunity name"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                          <select
                            value={formData.pipelineId}
                            onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value, pipelineStageId: '' })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
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
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                          <select
                            value={formData.pipelineStageId}
                            onChange={(e) => setFormData({ ...formData, pipelineStageId: e.target.value })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
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
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm appearance-none transition-all hover:border-gray-300 pr-8"
                            disabled={isSubmitting}
                          >
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                            <option value="lost">Lost</option>
                            <option value="won">Won</option>
                            <option value="abandon">Abandon</option>
                          </select>
                          <span className="absolute right-2 bottom-2 sm:bottom-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Value</label>
                          <input
                            type="text"
                            value={formData.monetaryValue}
                            onChange={(e) => setFormData({ ...formData, monetaryValue: parseInt(e.target.value) || 0 })}
                            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                            placeholder="$ 0"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2 text-white rounded-md text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
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
            <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Delete Opportunity</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{selectedOpportunity.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mb-4"></div>
              <p className="text-gray-600">Loading pipeline data...</p>
            </div>
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
                      <button 
                        onClick={() => handleEdit(opportunity)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(opportunity)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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