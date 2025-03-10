'use client';

import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface SortModalProps {
  sortConfig: { key: 'name' | 'value' | 'businessName' | 'lastActivity'; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: any) => void;
  setIsSortModalOpen: (open: boolean) => void;
}

export default function SortModal({ sortConfig, setSortConfig, setIsSortModalOpen }: SortModalProps) {
  const [tempSortConfig, setTempSortConfig] = useState(sortConfig);

  const handleApplySort = () => {
    setSortConfig(tempSortConfig);
    setIsSortModalOpen(false);
  };

  const handleSelectSort = (
    key: 'name' | 'value' | 'businessName' | 'lastActivity',
    direction: 'asc' | 'desc'
  ) => {
    setTempSortConfig({ key, direction });
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={() => setIsSortModalOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          ​
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sort Opportunities</h3>

                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg border ${
                      tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'asc'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSelectSort('name', 'asc')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Name A-Z</p>
                        <p className="text-xs text-gray-500">Sort by opportunity name ascending</p>
                      </div>
                      {tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'asc' && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'desc'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSelectSort('name', 'desc')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Name Z-A</p>
                        <p className="text-xs text-gray-500">Sort by opportunity name descending</p>
                      </div>
                      {tempSortConfig?.key === 'name' && tempSortConfig?.direction === 'desc' && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'desc'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSelectSort('value', 'desc')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Value: High to Low</p>
                        <p className="text-xs text-gray-500">Sort by opportunity value descending</p>
                      </div>
                      {tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'desc' && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'asc'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSelectSort('value', 'asc')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Value: Low to High</p>
                        <p className="text-xs text-gray-500">Sort by opportunity value ascending</p>
                      </div>
                      {tempSortConfig?.key === 'value' && tempSortConfig?.direction === 'asc' && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      tempSortConfig?.key === 'lastActivity' && tempSortConfig?.direction === 'desc'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => handleSelectSort('lastActivity', 'desc')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Most Recent Activity</p>
                        <p className="text-xs text-gray-500">Sort by most recent activity first</p>
                      </div>
                      {tempSortConfig?.key === 'lastActivity' &&
                        tempSortConfig?.direction === 'desc' && (
                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleApplySort}
            >
              Apply Sort
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                setTempSortConfig(null);
                setSortConfig(null);
                setIsSortModalOpen(false);
              }}
            >
              Clear Sort
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => setIsSortModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}