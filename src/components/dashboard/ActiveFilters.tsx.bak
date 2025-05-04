'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ActiveFiltersProps {
    filters: any;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setFilters: (filters: any) => void;
    setSortConfig: (config: any) => void;
}

export default function ActiveFilters({
    filters,
    searchTerm,
    setSearchTerm,
    setFilters,
    setSortConfig,
}: ActiveFiltersProps) {
    const hasActiveFilters = Object.values(filters).some((val: any) =>
        Array.isArray(val)
            ? val.length > 0
            : typeof val === 'object'
                ? Object.values(val).some((v) => v !== '')
                : val !== ''
    );

    if (!hasActiveFilters && !searchTerm) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {searchTerm && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                    <span>Search: {searchTerm}</span>
                    <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => setSearchTerm('')}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {filters.value.min && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                    <span>Min Value: ${filters.value.min}</span>
                    <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => setFilters({ ...filters, value: { ...filters.value, min: '' } })}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {filters.value.max && (
                <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                    <span>Max Value: ${filters.value.max}</span>
                    <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => setFilters({ ...filters, value: { ...filters.value, max: '' } })}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {filters.lastActivityType.map((type: string) => (
                <div
                    key={type}
                    className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
                >
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() =>
                            setFilters({
                                ...filters,
                                lastActivityType: filters.lastActivityType.filter((t: string) => t !== type),
                            })
                        }
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}

            {(hasActiveFilters || searchTerm) && (
                <button
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                    onClick={() => {
                        setSearchTerm('');
                        setFilters({
                            value: { min: '', max: '' },
                            source: [],
                            lastActivityType: [],
                            dateRange: { start: '', end: '' },
                        });
                        setSortConfig(null);
                    }}
                >
                    Clear all filters
                </button>
            )}
        </div>
    );
}