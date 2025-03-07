'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAppState } from '@/contexts/AppStateContext';

interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'range';
  options?: { value: string; label: string }[];
}

interface FilterPanelProps {
  filterOptions: FilterOption[];
  onApplyFilters: (filters: any) => void;
  className?: string;
  initialFilters?: any;
  showSaveOption?: boolean;
}

export default function FilterPanel({
  filterOptions,
  onApplyFilters,
  className = '',
  initialFilters = {},
  showSaveOption = true,
}: FilterPanelProps) {
  const [activeFilters, setActiveFilters] = useState<any>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterName, setFilterName] = useState('');
  const { state, dispatch } = useAppState();

  // Apply filters on mount if initial filters are provided
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setActiveFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleFilterChange = (id: string, value: any) => {
    setActiveFilters((prev: any) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRemoveFilter = (id: string) => {
    setActiveFilters((prev: any) => {
      const newFilters = { ...prev };
      delete newFilters[id];
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(activeFilters);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    
    const filterId = `filter_${Date.now()}`;
    dispatch({
      type: 'SAVE_FILTER',
      payload: {
        id: filterId,
        name: filterName,
        filter: activeFilters,
      },
    });
    setFilterName('');
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    onApplyFilters({});
  };

  const renderFilterInput = (filter: FilterOption) => {
    const value = activeFilters[filter.id] || '';

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={`Enter ${filter.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={`Enter ${filter.label.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          >
            <option value="">Select {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="border border-gray-300 rounded-md p-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedValues.map((val: string) => {
                const option = filter.options?.find((opt) => opt.value === val);
                return (
                  <div
                    key={val}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{option?.label || val}</span>
                    <button
                      type="button"
                      className="ml-1 text-purple-600 hover:text-purple-900"
                      onClick={() =>
                        handleFilterChange(
                          filter.id,
                          selectedValues.filter((v: string) => v !== val)
                        )
                      }
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleFilterChange(filter.id, [
                    ...selectedValues,
                    e.target.value,
                  ]);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Add {filter.label}</option>
              {filter.options
                ?.filter((option) => !selectedValues.includes(option.value))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
        );

      case 'range':
        const rangeValue = value || { min: '', max: '' };
        return (
          <div className="flex space-x-2">
            <input
              type="number"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={rangeValue.min}
              onChange={(e) =>
                handleFilterChange(filter.id, {
                  ...rangeValue,
                  min: e.target.value,
                })
              }
              placeholder="Min"
            />
            <input
              type="number"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              value={rangeValue.max}
              onChange={(e) =>
                handleFilterChange(filter.id, {
                  ...rangeValue,
                  max: e.target.value,
                })
              }
              placeholder="Max"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Count active filters
  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => {
      const value = activeFilters[key];
      if (typeof value === 'object' && !Array.isArray(value)) {
        return Object.values(value).some((v) => v !== '');
      }
      return Array.isArray(value) ? value.length > 0 : value !== '';
    }
  ).length;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Filter trigger button */}
      <button
        type="button"
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter panel */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {filterOptions.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Save filter option */}
          {showSaveOption && (
            <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Name this filter"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <button
                type="button"
                className="p-2 bg-purple-600 text-white rounded-md text-sm disabled:bg-purple-300"
                disabled={!filterName.trim()}
                onClick={handleSaveFilter}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Saved filters */}
          {state.userPreferences.savedFilters.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Saved Filters</p>
              <div className="flex flex-wrap gap-2">
                {state.userPreferences.savedFilters.map((savedFilter) => (
                  <button
                    key={savedFilter.id}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-xs flex items-center"
                    onClick={() => {
                      setActiveFilters(savedFilter.filter);
                      onApplyFilters(savedFilter.filter);
                    }}
                  >
                    <span>{savedFilter.name}</span>
                    <XMarkIcon
                      className="h-3 w-3 ml-1 text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                          type: 'DELETE_SAVED_FILTER',
                          payload: savedFilter.id,
                        });
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              onClick={handleClearFilters}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 