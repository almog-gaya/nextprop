'use client';

import React from 'react';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface FilterControlsProps {
    setIsFilterModalOpen: (open: boolean) => void;
    setIsSortModalOpen: (open: boolean) => void;
    filters: any;
    sortConfig: any;
}

export default function FilterControls({
    setIsFilterModalOpen,
    setIsSortModalOpen,
    filters,
    sortConfig,
}: FilterControlsProps) {
    const hasActiveFilters = Object.values(filters).some((val: any) =>
        Array.isArray(val)
            ? val.length > 0
            : typeof val === 'object'
                ? Object.values(val).some((v) => v !== '')
                : val !== ''
    );

    return (
        <div className="flex space-x-3">
            <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setIsFilterModalOpen(true)}
            >
                <FunnelIcon className="h-4 w-4 mr-2 text-gray-500" />
                Advanced Filters
                {hasActiveFilters && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {Object.values(filters).reduce((acc, val) => {
                            if (Array.isArray(val)) return acc + (val.length > 0 ? 1 : 0);
                            if (typeof val === 'object') {
                                return acc + (Object.values(val).some((v) => v !== '') ? 1 : 0);
                            }
                            return acc + (val !== '' ? 1 : 0);
                        }, 0)}
                    </span>
                )}
            </button>
            {/* <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setIsSortModalOpen(true)}
            >
                <ArrowPathIcon className="h-4 w-4 mr-2 text-gray-500" />
                Sort
                {sortConfig && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        1
                    </span>
                )}
            </button> */}
        </div>
    );
}