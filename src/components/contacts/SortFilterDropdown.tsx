import React, { useState } from 'react';

interface SortFilterDropdownProps {
  onSelectSort: (option: string) => void;
  onClearSort: () => void;
}

const SortFilterDropdown: React.FC<SortFilterDropdownProps> = ({ onSelectSort, onClearSort }) => {
  // State for selected sort option
  const [selectedSort, setSelectedSort] = useState('Title'); // Default to Title as shown in screenshot
  // Placeholder state for sort direction (Asc/Desc)
  const [sortDirection, setSortDirection] = useState('asc'); // Default to ascending

  const options = ['Title', 'Due Date', 'Created At', 'Updated At'];

  const handleSortSelect = (option: string) => {
    setSelectedSort(option);
    // onSelectSort(option); // You might want to call the parent handler here
  };

  const handleClear = () => {
    setSelectedSort(''); // Or set to a default, e.g., 'Title'
    setSortDirection('asc'); // Reset direction as well
    onClearSort(); // Call the parent clear handler
  };

  // Placeholder for sort direction toggle button logic
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
      <div className="px-4 py-2 flex items-center justify-between text-sm font-semibold text-gray-800">
        <span>Sort By</span>
        <button className="text-gray-500 hover:text-gray-700 font-normal" onClick={handleClear}>Clear</button>
      </div>
      <div className="border-t border-gray-100 my-1"></div>
      {/* Selected Sort Option Display */}
      <div className="px-4 py-2 text-sm">
        <button
          className="w-full text-left px-3 py-1.5 border border-gray-300 rounded-md flex items-center justify-between"
          // onClick={() => setIsOptionsOpen(true)} // Could add state here to toggle options visibility
        >
          <span>{selectedSort || 'Select Sort'}</span>
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {/* Sort Direction Toggle (Placeholder) */}
        {selectedSort && (
            <button onClick={toggleSortDirection} className="mt-2 p-1 rounded hover:bg-gray-100 flex items-center justify-center">
                {sortDirection === 'asc' ? (
                   <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M16 4v16m-3 0H4M13 4h-.01M16 4v.01" /></svg>
                ) : (
                   <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 20h13M16 4v16m-3 0H4m9-16h.01M16 20v.01" /></svg>
                )}
            </button>
        )}
      </div>
      {/* Sort Options List */}
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {options.map((option) => (
          <button
            key={option}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center justify-between"
            onClick={() => handleSortSelect(option)}
            role="menuitem"
          >
            {option}
            {selectedSort === option && (
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortFilterDropdown; 