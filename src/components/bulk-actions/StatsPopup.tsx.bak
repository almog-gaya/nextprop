'use client';
import React, { useState, useEffect } from 'react';

const StatsPopup = ({ requestId, onClose }) => {
    const [statsData, setStatsData] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState('ALL'); // New state for tab selection
    const limit = 12;

    // Fetch stats data when requestId, page, or tab changes
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Define filter based on selected tab
                let filter = {};
                if (selectedTab === 'ALL') {
                    filter = {
                        group: "OR",
                        filters: [
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "success" },
                                    { field: "subType", operator: "eq", value: "created" }
                                ]
                            },
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "success" },
                                    { field: "subType", operator: "eq", value: "updated" }
                                ]
                            },
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "error" },
                                    { field: "subType", operator: "eq", value: "default" }
                                ]
                            },
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "warning" }
                                ]
                            }
                        ]
                    };
                } else if (selectedTab === 'Success') {
                    filter = {
                        group: "OR",
                        filters: [
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "success" },
                                    { field: "subType", operator: "eq", value: "created" }
                                ]
                            },
                            {
                                group: "AND",
                                filters: [
                                    { field: "type", operator: "eq", value: "success" },
                                    { field: "subType", operator: "eq", value: "updated" }
                                ]
                            }
                        ]
                    };
                } else if (selectedTab === 'Errors') {
                    filter = {
                        group: "AND",
                        filters: [
                            { field: "type", operator: "eq", value: "error" },
                            { field: "subType", operator: "eq", value: "default" }
                        ]
                    };
                } else if (selectedTab === 'Warnings') {
                    filter = {
                        group: "AND",
                        filters: [
                            { field: "type", operator: "eq", value: "warning" }
                        ]
                    };
                }

                const response = await fetch('/api/bulk-actions/logs/search', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestId: requestId,
                        limit: limit,
                        sort: [],
                        page: currentPage,
                        filter: filter
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch stats');
                }

                const data = await response.json();
                setStatsData(data.logs || []);
                setTotal(data.total || 0);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [requestId, currentPage, selectedTab]); // Added selectedTab to dependencies

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Get type color
    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800';
            case 'error': return 'bg-red-100 text-red-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Bulk Action Stats</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-4 border-b border-gray-200">
                    {['ALL', 'Success', 'Errors', 'Warnings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setSelectedTab(tab);
                                setCurrentPage(1); // Reset to page 1 when changing tabs
                            }}
                            className={`px-4 py-2 text-sm font-medium ${
                                selectedTab === tab
                                    ? 'border-b-2 border-purple-500 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Loading/Error State */}
                {loading && <div className="text-center py-4">Loading stats...</div>}
                {error && <div className="text-center py-4 text-red-600">Error: {error}</div>}

                {/* Stats Table */}
                {!loading && !error && (
                    <div className="overflow-x-hidden">
                        <table className="w-full divide-y divide-gray-200 table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">SubType</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Identifier</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Message</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {statsData.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(log.type)}`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{log.subType}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-0">
                                            <div className="truncate" title={log.documentIdentifier}>{log.documentIdentifier}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 break-words">
                                            {log.message || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 break-words">
                                            {new Date(log.dateAdded).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && total > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages} (Total: {total})
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsPopup;