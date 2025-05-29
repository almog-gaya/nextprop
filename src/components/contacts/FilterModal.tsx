import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (filters: any) => void;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  options?: { key: string; value: string }[];
}

interface AppliedFilter {
  id: string;
  filterName: string;
  filterName_lc: string;
  extras: Record<string, any>;
  selectedOption: {
    filterName: string;
    filterName_lc: string;
    condition: string;
    firstValue: string | { key: string; value: string }[];
  };
}

interface FilterGroup {
  id: string;
  operator: 'AND' | 'OR';
  filters: AppliedFilter[];
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  // All filter fields with their types and options
  const filterFields: FilterField[] = [
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'first_name', label: 'First Name', type: 'text' },
    { key: 'full_name', label: 'Full Name', type: 'text' },
    { key: 'last_name', label: 'Last Name', type: 'text' },
    { key: 'tag', label: 'Tag', type: 'text' },
    { 
      key: 'dnd', 
      label: 'DND', 
      type: 'select',
      options: [
        { key: 'all', value: 'Enabled for All Channels' },
        { key: 'call', value: 'Enabled for Calls & Voicemails' },
        { key: 'sms', value: 'Enabled for SMS' }
      ]
    },
    { key: 'created', label: 'Created', type: 'text' },
  ];

  const [selectedOperator, setSelectedOperator] = useState('is');
  const [filterValue, setFilterValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', operator: 'AND', filters: [] }
  ]);
  const [activeGroupId, setActiveGroupId] = useState<string>('1');
  const [showFilterSummary, setShowFilterSummary] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    setSelectedOperator('is');
    setFilterValue('');
  }, [activeFilter]);

  const handleApply = () => {
    if (activeFilter) {
      const field = filterFields.find(f => f.key === activeFilter);
      if (!field) return;

      const newFilter: AppliedFilter = {
        id: generateId(),
        filterName: field.label,
        filterName_lc: field.key,
        extras: {},
        selectedOption: {
          filterName: field.label,
          filterName_lc: field.key,
          condition: selectedOperator,
          firstValue: field.type === 'select' 
            ? [{ key: filterValue, value: field.options?.find(opt => opt.key === filterValue)?.value || '' }]
            : [{ key: filterValue, value: filterValue }]
        }
      };

      setFilterGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === activeGroupId 
            ? { ...group, filters: [...group.filters, newFilter] }
            : group
        )
      );

      // Reset the form
      setSelectedOperator('is');
      setFilterValue('');
      setActiveFilter(null);
      setShowFilterSummary(true);

      // Call onSuccess with the updated filters
      if (onSuccess) {
        const payload = {
          locationId: "rhJba4qZDxLza65WYvnW",
          page: 1,
          pageLimit: 20,
          sort: [],
          filters: [{
            group: "OR",
            filters: filterGroups.map(group => ({
              group: group.operator,
              filters: group.filters
            }))
          }]
        };
        onSuccess(payload);
      }
    }
  };

  const handleClearAll = () => {
    const newGroup: FilterGroup = { 
      id: generateId(), 
      operator: 'AND' as const, 
      filters: [] 
    };
    setFilterGroups([newGroup]);
    setActiveGroupId(newGroup.id);
    setShowFilterSummary(false);
    setActiveFilter(null);
    
    // Call onSuccess with empty filters
    if (onSuccess) {
      const payload = {
        locationId: "rhJba4qZDxLza65WYvnW",
        page: 1,
        pageLimit: 20,
        sort: [],
        filters: [{
          group: "OR",
          filters: [{
            group: "AND",
            filters: []
          }]
        }]
      };
      onSuccess(payload);
    }
  };

  const handleEditFilter = (groupId: string, filterIndex: number) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const filter = group.filters[filterIndex];
    setActiveFilter(filter.filterName_lc);
    setSelectedOperator(filter.selectedOption.condition);
    setFilterValue(
      Array.isArray(filter.selectedOption.firstValue)
        ? filter.selectedOption.firstValue[0].key
        : filter.selectedOption.firstValue
    );
    setActiveGroupId(groupId);
    setShowFilterSummary(false);
  };

  const handleDeleteFilter = (groupId: string, filterIndex: number) => {
    setFilterGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, filters: group.filters.filter((_, idx) => idx !== filterIndex) }
          : group
      )
    );
    
    // Call onSuccess with the updated filters
    if (onSuccess) {
      const payload = {
        locationId: "rhJba4qZDxLza65WYvnW",
        page: 1,
        pageLimit: 20,
        sort: [],
        filters: [{
          group: "OR",
          filters: filterGroups.map(group => ({
            group: group.operator,
            filters: group.filters
          }))
        }]
      };
      onSuccess(payload);
    }
  };

  const toggleFilterGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setFilterGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, operator }
          : group
      )
    );
    
    // Call onSuccess with the updated filters
    if (onSuccess) {
      const payload = {
        locationId: "rhJba4qZDxLza65WYvnW",
        page: 1,
        pageLimit: 20,
        sort: [],
        filters: [{
          group: "OR",
          filters: filterGroups.map(group => ({
            group: group.operator,
            filters: group.filters
          }))
        }]
      };
      onSuccess(payload);
    }
  };

  const addNewFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      operator: 'AND',
      filters: []
    };
    setFilterGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length === 1) return; // Don't remove the last group
    setFilterGroups(prev => prev.filter(group => group.id !== groupId));
    
    // Call onSuccess with the updated filters
    if (onSuccess) {
      const payload = {
        locationId: "rhJba4qZDxLza65WYvnW",
        page: 1,
        pageLimit: 20,
        sort: [],
        filters: [{
          group: "OR",
          filters: filterGroups
            .filter(group => group.id !== groupId)
            .map(group => ({
              group: group.operator,
              filters: group.filters
            }))
        }]
      };
      onSuccess(payload);
    }
  };

  const handleAddFilter = () => {
    setActiveFilter(null);
    setSelectedOperator('is');
    setFilterValue('');
    setShowFilterSummary(false);
  };

  const renderFilterSummary = () => (
    <div className="flex flex-col h-full">
      <button onClick={handleClearAll} className="text-blue-500 text-sm px-6 py-2 text-left hover:underline">
        Clear all filters
      </button>
      <div className="flex-1 px-6 pb-4">
        {filterGroups.map((group, groupIndex) => (
          <div key={group.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleFilterGroupOperator(group.id, 'AND')}
                  className={`flex items-center gap-1 px-3 py-1 border rounded text-sm ${
                    group.operator === 'AND' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  AND
                </button>
                <button 
                  onClick={() => toggleFilterGroupOperator(group.id, 'OR')}
                  className={`flex items-center gap-1 px-3 py-1 border rounded text-sm ${
                    group.operator === 'OR' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  OR
                </button>
              </div>
              {groupIndex > 0 && (
                <button 
                  onClick={() => removeFilterGroup(group.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove Group
                </button>
              )}
            </div>
            {group.filters.map((filter, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-blue-700 font-medium">{filter.filterName}:</span>
                  <span className="ml-1 text-sm text-gray-700">
                    {filter.selectedOption.condition === 'is_empty' ? 'Is empty' : 
                     filter.selectedOption.condition === 'is_not_empty' ? 'Is not empty' : 
                     `${filter.selectedOption.condition.replace('_', ' ')} ${
                       Array.isArray(filter.selectedOption.firstValue)
                         ? filter.selectedOption.firstValue[0].value
                         : filter.selectedOption.firstValue
                     }`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditFilter(group.id, idx)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6H3v6z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDeleteFilter(group.id, idx)} className="p-1 hover:bg-gray-100 rounded" title="Delete">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {groupIndex === filterGroups.length - 1 && (
              <button
                onClick={handleAddFilter}
                className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Filter
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addNewFilterGroup}
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Filter Group
        </button>
      </div>
      <div className="px-6 pb-6">
        <button
          onClick={() => setIsImagePopupOpen(true)}
          className="w-full py-2 bg-gray-50 border border-gray-200 rounded text-gray-700 font-medium flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          Save as smart list
        </button>
      </div>
    </div>
  );

  const renderFilterDetails = (filterKey: string) => {
    const field = filterFields.find(f => f.key === filterKey);
    if (!field) return null;

    return (
      <div className="p-6">
        <button onClick={() => setActiveFilter(null)} className="mb-4 text-blue-500 flex items-center">
          <ChevronLeftIcon className="h-5 w-5 mr-1" /> Back
        </button>
        <h3 className="text-lg font-semibold mb-2">{field.label}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is'}
                onChange={() => setSelectedOperator('is')}
              />
              <span className='mb-0.5'>Is</span>
            </div>
            {field.type === 'select' ? (
              <div className="relative m-2">
                <select
                  className="w-full pl-3 pr-3 py-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  disabled={selectedOperator !== 'is'}
                >
                  <option value="">Select an option</option>
                  {field.options?.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.value}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative m-2">
                <input
                  type="search"
                  className="w-full pl-10 pr-3 py-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  placeholder="Please Input"
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  disabled={selectedOperator !== 'is'}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <p className="text-xs text-gray-500 m-2">
              Matches entries based on the exact whole word or phrase specified. Example: If you want to search for 'Field Value', you can search by 'Field' or 'Value'
            </p>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_not'}
                onChange={() => setSelectedOperator('is_not')}
              />
              <span className='mb-0.5'>Is not</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_empty'}
                onChange={() => setSelectedOperator('is_empty')}
              />
              <span className='mb-0.5'>Is empty</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_not_empty'}
                onChange={() => setSelectedOperator('is_not_empty')}
              />
              <span className='mb-0.5'>Is not empty</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="px-4 py-2 bg-gray-100 rounded mr-2" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleApply}>Apply</button>
        </div>
      </div>
    );
  };

  // Filter fields by search term
  const filteredFields = filterFields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300" style={{ minWidth: 360 }}>
        {/* Always show the filter header at the top */}
        <div className="flex items-center px-6 pt-6 pb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full mr-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="20" fill="#9806FF" fillOpacity="0.14" />
              <path d="M18.5012 14.0046H28.2431M18.5012 14.0046C18.5012 14.4021 18.3433 14.7833 18.0622 15.0644C17.7812 15.3455 17.4 15.5034 17.0025 15.5034C16.605 15.5034 16.2238 15.3455 15.9427 15.0644C15.6616 14.7833 15.5037 14.4021 15.5037 14.0046M18.5012 14.0046C18.5012 13.6071 18.3433 13.2259 18.0622 12.9448C17.7812 12.6638 17.4 12.5059 17.0025 12.5059C16.605 12.5059 16.2238 12.6638 15.9427 12.9448C15.6616 13.2259 15.5037 13.6071 15.5037 14.0046M15.5037 14.0046H11.7568M18.5012 25.9946H28.2431M18.5012 25.9946C18.5012 26.3921 18.3433 26.7733 18.0622 27.0544C17.7812 27.3355 17.4 27.4934 17.0025 27.4934C16.605 27.4934 16.2238 27.3355 15.9427 27.0544C15.6616 26.7733 15.5037 26.3921 15.5037 25.9946M18.5012 25.9946C18.5012 25.5971 18.3433 25.2159 18.0622 24.9348C17.7812 24.6538 17.4 24.4959 17.0025 24.4959C16.605 24.4959 16.2238 24.6538 15.9427 24.9348C15.6616 25.2159 15.5037 25.5971 15.5037 25.9946M15.5037 25.9946H11.7568M24.4962 19.9996H28.2431M24.4962 19.9996C24.4962 20.3971 24.3383 20.7783 24.0572 21.0594C23.7762 21.3405 23.395 21.4984 22.9975 21.4984C22.6 21.4984 22.2188 21.3405 21.9377 21.0594C21.6566 20.7783 21.4987 20.3971 21.4987 19.9996M24.4962 19.9996C24.4962 19.6021 24.3383 19.2209 24.0572 18.9398C23.7762 18.6588 23.395 18.5009 22.9975 18.5009C22.6 18.5009 22.2188 18.6588 21.9377 18.9398C21.6566 19.2209 21.4987 19.6021 21.4987 19.9996M21.4987 19.9996H11.7568" stroke="#9C03FF" strokeWidth="1.49902" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-900 leading-tight">Filters</p>
          </div>
          <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-gray-100">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Gap of 12px */}
        <div className="px-6 pb-4">
          <input
            type="text"
            placeholder="Search filters..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* The rest of your conditional rendering */}
        {showFilterSummary && filterGroups.length > 0 ? (
          renderFilterSummary()
        ) : activeFilter ? (
          renderFilterDetails(activeFilter)
        ) : (
          <div className="px-6 pb-4">
            <div className="space-y-2">
              {filteredFields.map((field) => (
                <button
                  key={field.key}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 border border-transparent transition"
                  onClick={() => setActiveFilter(field.key)}
                >
                  <span>{field.label}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ImagePopup component */}
      {isImagePopupOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsImagePopupOpen(false)}></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Smart List</h3>
              <button onClick={() => setIsImagePopupOpen(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="smartListName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="smartListName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsImagePopupOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterModal; 