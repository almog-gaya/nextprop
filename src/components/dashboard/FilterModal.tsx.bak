'use client';

import React, { useState } from 'react';

interface FilterModalProps {
  filters: {
    value: { min: string; max: string };
    source: string[];
    lastActivityType: ('voicemail' | 'sms' | 'call' | 'email' | 'optout')[];
    dateRange: { start: string; end: string };
  };
  setFilters: (filters: any) => void;
  setIsFilterModalOpen: (open: boolean) => void;
}

export default function FilterModal({ filters, setFilters, setIsFilterModalOpen }: FilterModalProps) {
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      value: { min: '', max: '' },
      source: [],
      lastActivityType: [],
      dateRange: { start: '', end: '' },
    });
  };

  const toggleActivityType = (type: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => {
    const newActivityTypes = [...tempFilters.lastActivityType];
    if (newActivityTypes.includes(type)) {
      setTempFilters({
        ...tempFilters,
        lastActivityType: newActivityTypes.filter((t) => t !== type),
      });
    } else {
      setTempFilters({
        ...tempFilters,
        lastActivityType: [...newActivityTypes, type],
      });
    }
  };

  const toggleSource = (source: string) => {
    const newSources = [...tempFilters.source];
    if (newSources.includes(source)) {
      setTempFilters({
        ...tempFilters,
        source: newSources.filter((s) => s !== source),
      });
    } else {
      setTempFilters({
        ...tempFilters,
        source: [...newSources, source],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">

        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Advanced Filters</h3>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Deal Value</h4>
                  <div className="flex space-x-2">
                    <div className="w-1/2">
                      <label htmlFor="min-value" className="block text-xs text-gray-500 mb-1">
                        Min Value
                      </label>
                      <div className="relative border border-gray-300 rounded-md">
                        {/* <span className="absolute left-0 pl-2.5 inset-y-0 flex items-center text-gray-600">
                          $
                        </span> */}
                        <input
                          type="number"
                          id="min-value"
                          className="block w-full pl-8 pr-3 py-2  rounded-md text-sm bg-white"
                          placeholder="$ Min"
                          value={tempFilters.value.min}
                          onChange={(e) =>
                            setTempFilters({
                              ...tempFilters,
                              value: { ...tempFilters.value, min: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <label htmlFor="max-value" className="block text-xs text-gray-500 mb-1">
                        Max Value
                      </label>
                      <div className="relative border border-gray-300 rounded-md">
                        {/* <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                          $
                        </span> */}
                        <input
                          type="number"
                          id="max-value"
                          className="block w-full pl-8 pr-3 py-2  rounded-md text-sm bg-white"
                          placeholder="$ Max"
                          value={tempFilters.value.max}
                          onChange={(e) =>
                            setTempFilters({
                              ...tempFilters,
                              value: { ...tempFilters.value, max: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Last Activity Type</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['voicemail', 'sms', 'call', 'email', 'optout'].map((type) => (
                      <button
                        key={type}
                        className={`px-3 py-2 text-sm rounded-md ${tempFilters.lastActivityType.includes(type as any)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        onClick={() => toggleActivityType(type as any)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
                  <div className="flex space-x-2">
                    <div className="w-1/2">
                      <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">
                        Start Date
                      </label>
                     <div className='border border-gray-300 rounded-md'>
                     <input
                        type="date"
                        id="start-date"
                        className="block w-full px-3 py-2 rounded-md text-sm"
                        value={tempFilters.dateRange.start}
                        onChange={(e) =>
                          setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, start: e.target.value },
                          })
                        }
                      />
                     </div>
                    </div>
                    <div className="w-1/2">
                      <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">
                        End Date
                      </label>
                      <div className='border border-gray-300 rounded-md'>
                      <input
                        type="date"
                        id="end-date"
                        className="block w-full px-3 py-2  rounded-md text-sm"
                        value={tempFilters.dateRange.end}
                        onChange={(e) =>
                          setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, end: e.target.value },
                          })
                        }
                      />
                      </div>
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
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleClearFilters}
            >
              Clear All
            </button>
            <button
              type="button"
              className=" mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => setIsFilterModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}