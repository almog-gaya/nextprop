'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Pipeline } from '@/types';

interface PipelinesTabProps {
  pipelines: Pipeline[];
  setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>;
}

interface Stage {
  name: string;
  position: number;
  showInFunnel: boolean;
  showInPieChart: boolean;
}

const PipelinesTab: React.FC<PipelinesTabProps> = ({ pipelines, setPipelines }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    showInFunnel: true,
    showInPieChart: true,
    stages: [{ name: '', position: 0, showInFunnel: true, showInPieChart: true }] as Stage[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('The name field is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/opportunities/pipelines', formData);
      if (response.status === 201) {
        setPipelines([...pipelines, response.data.pipeline]);
        setIsModalOpen(false);
        setError(null);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create pipeline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setFormData({
      name: pipeline.name,
      showInFunnel: pipeline.showInFunnel,
      showInPieChart: pipeline.showInPieChart,
      stages: pipeline.stages.map((stage, index) => ({
        name: stage.name,
        position: index,
        showInFunnel: stage.showInFunnel,
        showInPieChart: stage.showInPieChart,
      })),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipeline) return;
    if (!formData.name.trim()) {
      setError('The name field is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/opportunities/pipelines/${selectedPipeline.id}`,
        formData
      );
      if (response.status === 200) {
        setPipelines(
          pipelines.map(p => (p.id === selectedPipeline.id ? response.data.pipeline : p))
        );
        setIsEditModalOpen(false);
        setError(null);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update pipeline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPipeline) return;

    setIsSubmitting(true);
    try {
      await axios.delete(
        `/api/opportunities/pipelines/${selectedPipeline.id}`
      );
      setPipelines(pipelines.filter(p => p.id !== selectedPipeline.id));
      setIsDeleteModalOpen(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete pipeline');
    } finally {
      setIsSubmitting(false);
      setSelectedPipeline(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      showInFunnel: true,
      showInPieChart: true,
      stages: [{ name: '', position: 0, showInFunnel: true, showInPieChart: true }],
    });
    setSelectedPipeline(null);
    setError(null);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { name: '', position: formData.stages.length, showInFunnel: true, showInPieChart: true },
      ],
    });
  };

  const removeStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      stages: newStages.map((stage, idx) => ({ ...stage, position: idx })),
    });
  };

  const updateStageName = (index: number, value: string) => {
    const newStages = formData.stages.map((stage, i) =>
      i === index ? { ...stage, name: value } : stage
    );
    setFormData({ ...formData, stages: newStages });
  };

  const updateShowInFunnel = (index: number, value: boolean) => {
    const newStages = formData.stages.map((stage, i) =>
      i === index ? { ...stage, showInFunnel: value } : stage
    );
    setFormData({ ...formData, stages: newStages });
  };

  const updateShowInPieChart = (index: number, value: boolean) => {
    const newStages = formData.stages.map((stage, i) =>
      i === index ? { ...stage, showInPieChart: value } : stage
    );
    setFormData({ ...formData, stages: newStages });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Pipelines</h1>
        <p className="text-gray-600">Manage your sales pipelines</p>
      </div>

      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={isSubmitting}
          >
            Add Pipeline
          </button>
        </div>
      </div> */}

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
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Add New Pipeline</h3>
            <p className="text-gray-600 mb-6">Create a new pipeline by filling in the details below</p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name"
                    required
                    disabled={isSubmitting}
                  />
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
                  {formData.stages.map((stage, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => updateStageName(index, e.target.value)}
                        className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Stage Name"
                        required
                        disabled={isSubmitting}
                      />
                      <div className="ml-2 space-x-1">
                        <button
                          type="button"
                          onClick={() => updateShowInFunnel(index, !stage.showInFunnel)}
                          className={`p-1 rounded-full ${stage.showInFunnel ? 'bg-green-100' : 'bg-gray-200'}`}
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm0 7a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateShowInPieChart(index, !stage.showInPieChart)}
                          className={`p-1 rounded-full ${stage.showInPieChart ? 'bg-green-100' : 'bg-gray-200'}`}
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zm-6-6a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={isSubmitting || formData.stages.length <= 1}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStage}
                    className="text-blue-600 text-sm hover:underline mt-2"
                    disabled={isSubmitting}
                  >
                    + Add stage
                  </button>
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInFunnel}
                      onChange={(e) => setFormData({ ...formData, showInFunnel: e.target.checked })}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    Visible in Funnel chart
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInPieChart}
                      onChange={(e) => setFormData({ ...formData, showInPieChart: e.target.checked })}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    Visible in Pie chart
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedPipeline && (
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
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Edit Pipeline</h3>
            <form onSubmit={handleUpdate}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name"
                    required
                    disabled={isSubmitting}
                  />
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
                  {formData.stages.map((stage, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => updateStageName(index, e.target.value)}
                        className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Stage Name"
                        required
                        disabled={isSubmitting}
                      />
                      <div className="ml-2 space-x-1">
                        <button
                          type="button"
                          onClick={() => updateShowInFunnel(index, !stage.showInFunnel)}
                          className={`p-1 rounded-full ${stage.showInFunnel ? 'bg-green-100' : 'bg-gray-200'}`}
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm0 7a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateShowInPieChart(index, !stage.showInPieChart)}
                          className={`p-1 rounded-full ${stage.showInPieChart ? 'bg-green-100' : 'bg-gray-200'}`}
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zm-6-6a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={isSubmitting || formData.stages.length <= 1}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStage}
                    className="text-blue-600 text-sm hover:underline mt-2"
                    disabled={isSubmitting}
                  >
                    + Add stage
                  </button>
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInFunnel}
                      onChange={(e) => setFormData({ ...formData, showInFunnel: e.target.checked })}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    Visible in Funnel chart
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInPieChart}
                      onChange={(e) => setFormData({ ...formData, showInPieChart: e.target.checked })}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    Visible in Pie chart
                  </label>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedPipeline && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Delete Pipeline</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedPipeline.name}"? This action cannot be undone.
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {pipelines.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th> */}
                  {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pipelines.map((pipeline) => (
                  <tr key={pipeline.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{pipeline?.name ?? ""  }</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(pipeline.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <button
                        onClick={() => handleEdit(pipeline)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pipeline)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-center py-10">
            No pipelines available. Click "Add Pipeline" to create one.
          </p>
        </div>
      )}
    </div>
  );
};

export default PipelinesTab;