import React, { useState, useRef, useEffect } from 'react';
import NewTaskModal from './NewTaskModal';
import StatusFilterDropdown from './StatusFilterDropdown';
import DueDateCalendar from './DueDateCalendar';
import SortFilterDropdown from './SortFilterDropdown';
import AdvancedFiltersDrawer from './AdvancedFiltersDrawer';
import ManageFieldsModal from './ManageFieldsModal';

// Placeholder for AssigneeFilterDropdown component
const AssigneeFilterDropdown = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 p-4">
      <input
        type="text"
        placeholder="Search"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3"
      />
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-800">All team members</div>
        <div className="flex items-center text-gray-700 text-sm">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 mr-2">AE</div>
          Almog Elmaliah
        </div>
        <div className="flex items-center text-gray-700 text-sm">
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 mr-2">BA</div>
          Bahadur Almog's Team
        </div>
         <div className="flex items-center text-gray-700 text-sm">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 mr-2">CL</div>
          Cecilia Lenci
        </div>
        <div className="text-sm font-semibold text-gray-800 mt-3">Unassigned</div>
         <div className="flex items-center text-gray-700 text-sm">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 mr-2">-</div>
          Unassigned
        </div>
      </div>
    </div>
  );
};

export default function ContactTasksTab() {
  const [activeSecondaryTab, setActiveSecondaryTab] = useState('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDueDateCalendarOpen, setIsDueDateCalendarOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);

  const assigneeButtonRef = useRef(null);
  const statusButtonRef = useRef(null);
  const dueDateButtonRef = useRef(null);
  const sortButtonRef = useRef(null);
  const advancedFiltersDrawerRef = useRef(null);
  const manageFieldsModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeButtonRef.current && !assigneeButtonRef.current.contains(event.target)) {
        setIsAssigneeDropdownOpen(false);
      }
      if (statusButtonRef.current && !statusButtonRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (dueDateButtonRef.current && !dueDateButtonRef.current.contains(event.target)) {
        setIsDueDateCalendarOpen(false);
      }
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
      if (advancedFiltersDrawerRef.current && !advancedFiltersDrawerRef.current.contains(event.target)) {
        setIsAdvancedFiltersOpen(false);
      }
      if (manageFieldsModalRef.current && !manageFieldsModalRef.current.contains(event.target)) {
        setIsManageFieldsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssigneeDropdownOpen, isStatusDropdownOpen, isDueDateCalendarOpen, isSortDropdownOpen, isAdvancedFiltersOpen, isManageFieldsOpen]);

  const handleOpenNewTaskModal = () => {
    setIsNewTaskModalOpen(true);
  };

  const handleCloseNewTaskModal = () => {
    setIsNewTaskModalOpen(false);
  };

  const toggleAssigneeDropdown = () => {
    setIsAssigneeDropdownOpen(prev => !prev);
    setIsStatusDropdownOpen(false);
    setIsDueDateCalendarOpen(false);
    setIsSortDropdownOpen(false); // Close other dropdowns
  };

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen(prev => !prev);
    setIsAssigneeDropdownOpen(false);
    setIsDueDateCalendarOpen(false);
    setIsSortDropdownOpen(false); // Close other dropdowns
  };

  const toggleDueDateCalendar = () => {
    setIsDueDateCalendarOpen(prev => !prev);
    setIsAssigneeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsSortDropdownOpen(false); // Close other dropdowns
  };
  
  const toggleSortDropdown = () => {
    setIsSortDropdownOpen(prev => !prev);
    setIsAssigneeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsDueDateCalendarOpen(false);
  };

  // Placeholder handlers for sort selection and clear
  const handleSelectSort = (option: string) => {
    console.log('Selected Sort:', option);
    setIsSortDropdownOpen(false); // Close after selection
  };

  const handleClearSort = () => {
    console.log('Clear Sort');
    setIsSortDropdownOpen(false); // Close after clearing
  };

  const toggleAdvancedFilters = () => {
    setIsAdvancedFiltersOpen(prev => !prev);
    setIsAssigneeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsDueDateCalendarOpen(false);
    setIsSortDropdownOpen(false);
    setIsManageFieldsOpen(false);
  };

  const toggleManageFields = () => {
    setIsManageFieldsOpen(prev => !prev);
    setIsAssigneeDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setIsDueDateCalendarOpen(false);
    setIsSortDropdownOpen(false);
    setIsAdvancedFiltersOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-0 w-full flex flex-col h-full">
      {/* Header and Top Add Task Button */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900 mr-4">Tasks</h2>
          <span className="text-xs font-normal text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">0 Tasks</span>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center"
          onClick={handleOpenNewTaskModal}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Task
        </button>
      </div>

      {/* Secondary Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        <button 
          className={`pb-2 px-4 text-sm font-medium ${activeSecondaryTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSecondaryTab('all')}
        >
          All
        </button>
        <button 
          className={`pb-2 px-4 text-sm font-medium ${activeSecondaryTab === 'dueToday' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSecondaryTab('dueToday')}
        >
          Due Today
        </button>
        <button 
          className={`pb-2 px-4 text-sm font-medium ${activeSecondaryTab === 'overdue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSecondaryTab('overdue')}
        >
          Overdue
        </button>
        <button 
          className={`pb-2 px-4 text-sm font-medium ${activeSecondaryTab === 'upcoming' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveSecondaryTab('upcoming')}
        >
          Upcoming
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gray-200">
        <div className="relative" ref={assigneeButtonRef}>
          <button 
            className="bg-white text-gray-700 rounded-full px-3 py-1 text-sm border border-gray-300 flex items-center hover:bg-gray-100"
            onClick={toggleAssigneeDropdown}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Assignee: Any
          </button>
          <AssigneeFilterDropdown isOpen={isAssigneeDropdownOpen} onClose={toggleAssigneeDropdown} />
        </div>

        <div className="relative" ref={statusButtonRef}>
          <button 
            className="bg-white text-gray-700 rounded-full px-3 py-1 text-sm border border-gray-300 flex items-center hover:bg-gray-100"
            onClick={toggleStatusDropdown}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Status: All
          </button>
          <StatusFilterDropdown isOpen={isStatusDropdownOpen} onClose={toggleStatusDropdown} />
        </div>

        <div className="relative" ref={dueDateButtonRef}>
          <button 
            className="bg-white text-gray-700 rounded-full px-3 py-1 text-sm border border-gray-300 flex items-center hover:bg-gray-100"
            onClick={toggleDueDateCalendar}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Due Date: Any
          </button>
          <DueDateCalendar isOpen={isDueDateCalendarOpen} onClose={toggleDueDateCalendar} />
        </div>

        {/* Advanced Filters Button */}
        <button 
          className="bg-white text-gray-700 rounded-full px-3 py-1 text-sm border border-gray-300 flex items-center hover:bg-gray-100"
          onClick={toggleAdvancedFilters}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1">
            <path fill="currentColor" d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/>
          </svg>
          Advanced Filters
        </button>

        <div className="relative" ref={sortButtonRef}>
          <button 
            className="bg-white text-blue-700 rounded-full px-3 py-1 text-sm border border-blue-300 flex items-center hover:bg-blue-100"
             onClick={toggleSortDropdown}
          >
            <svg className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M16 4v16m-3 0H4M13 4h-.01M16 4v.01" /></svg>
            Sort (1)
          </button>
          {isSortDropdownOpen && (
            <SortFilterDropdown
              onSelectSort={handleSelectSort}
              onClearSort={handleClearSort}
            />
          )}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="w-full px-3 py-1 text-sm border border-gray-300 rounded-full pl-10 focus:outline-none focus:ring- blue-500 focus:border-blue-500" placeholder="Search for task title" />
        </div>
        <button className="bg-white text-gray-700 rounded-full px-3 py-1 text-sm border border-gray-300 flex items-center ml-auto hover:bg-gray-100"
          onClick={toggleManageFields}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Manage Fields
        </button>
      </div>

      {/* Table headers (placeholder) */}
  <div className="overflow-x-auto flex-grow ml-2 mr-2">
  <table className="min-w-full overflow-x-auto  divide-y divide-gray-200 border border-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
          Title
          <svg className="ml-1 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associated ...</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date (Est)</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {/* Empty state */}
      <tr>
        <td  colSpan={10} className="py-16 text-center justify-center">
          <div className="flex flex-col items-center justify-center">
            {/* Illustration (simple cat at desk SVG) */}
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="60" width="100" height="8" rx="2" fill="#E5E7EB" />
              <rect x="60" y="68" width="60" height="4" rx="2" fill="#E5E7EB" />
              <ellipse cx="90" cy="100" rx="40" ry="8" fill="#F3F4F6" />
              <circle cx="90" cy="60" r="18" fill="#fff" stroke="#A3A3A3" strokeWidth="2" />
              <ellipse cx="90" cy="70" rx="10" ry="4" fill="#A3A3A3" />
              <rect x="80" y="80" width="20" height="10" rx="3" fill="#fff" stroke="#A3A3A3" strokeWidth="2" />
              <ellipse cx="90" cy="90" rx="5" ry="2" fill="#A3A3A3" />
            </svg>
            <div className="text-lg font-semibold text-gray-800 mb-1">It's so lonely in here!</div>
            <div className="text-gray-500 mb-6">No Tasks in sight! Ready to create a fresh one?</div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-2 py-2 flex items-center"
              onClick={handleOpenNewTaskModal}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">Page 1 of 1</div>
        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button className="px-3 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Prev</button>
          <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md">1</span>
          <button className="px-3 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Next</button>
        </div>
      </div>

      {/* New Task Modal */}
      <NewTaskModal isOpen={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} />

      {/* Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        isOpen={isAdvancedFiltersOpen}
        onClose={toggleAdvancedFilters}
        ref={advancedFiltersDrawerRef}
      />

      {/* Manage Fields Modal */}
      <ManageFieldsModal
        isOpen={isManageFieldsOpen}
        onClose={toggleManageFields}
        ref={manageFieldsModalRef}
      />
    </div>
  );
} 