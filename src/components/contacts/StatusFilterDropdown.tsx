import React from 'react';

interface StatusFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatusFilterDropdown({ isOpen, onClose }: StatusFilterDropdownProps) {
  if (!isOpen) return null;

  // Placeholder state for selected status
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    onClose();
  };

  const options = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
  ];

  return (
    <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
      {options.map((option) => (
        <button
          key={option.value}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
          onClick={() => handleStatusSelect(option.value)}
        >
          {option.label}
          {selectedStatus === option.value && (
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
      ))}
    </div>
  );
} 