'use client';
import StatsPopup from '@/components/bulk-actions/StatsPopup';
import DashboardLayout from '@/components/DashboardLayout';
import React, { useState, useEffect } from 'react'; 

const BulkActionsPage = () => {
    const [bulkActionsData, setBulkActionsData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState(null); // State to track which popup to show
    const fetchBulkActions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/bulk-actions/request/fetch', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bulk actions');
            }

            const data = await response.json();
            setBulkActionsData(data.list || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        

        fetchBulkActions();
    }, []);

    const filteredActions = bulkActionsData.filter(action =>
        filterStatus === 'all' || action.status === filterStatus
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'complete': return 'bg-green-100 text-green-800 border-green-200';
            case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <DashboardLayout title="Bulk Actions">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Bulk Actions History
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            View and manage your bulk operations history
                        </p>
                    </div>
                    {/* Refresh */}
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            type="button"
                            onClick={() => fetchBulkActions()}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Refresh
                        </button>
                    </div>
                    {/* Filter */}
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <select
                            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="complete">Complete</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Loading bulk actions...</p>
                    </div>
                )}
                {error && (
                    <div className="text-center py-10 text-red-600">
                        <p>Error: {error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="overflow-x-hidden">
                                <table className="w-full divide-y divide-gray-200 table-auto">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Processed</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Completed On</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredActions.map((action) => (
                                            <tr key={action.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-0">
                                                    <div className="line-clamp-8 break-words" title={action.title}>{action.title}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(action.status)}`}>
                                                        {action.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {action.processedCount}/{action.totalCount}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 break-words">
                                                    {action.processingCompletedOn ? new Date(action.processingCompletedOn).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Not completed'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    <button
                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                        onClick={() => setSelectedRequestId(action.id)}
                                                    >
                                                        Stats
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Render StatsPopup when a requestId is selected */}
                {selectedRequestId && (
                    <StatsPopup
                        requestId={selectedRequestId}
                        onClose={() => setSelectedRequestId(null)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default BulkActionsPage;