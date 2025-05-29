import React, { useState, forwardRef, useImperativeHandle } from 'react';

interface AdvancedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedFiltersDrawer = forwardRef<HTMLDivElement, AdvancedFiltersDrawerProps>(({ isOpen, onClose }, ref) => {
  const [openSections, setOpenSections] = useState<{
    taskInfo: boolean;
    associations: boolean;
    otherDetails: boolean;
  }>({
    taskInfo: true,
    associations: true,
    otherDetails: true,
  });

  const toggleSection = (section: 'taskInfo' | 'associations' | 'otherDetails') => {
    setOpenSections(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Drawer */}
      <div ref={ref} className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0" style={{ minWidth: '360px' }}>
        <div className="h-full divide-y divide-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-between justify-between px-6 py-4 border-b border-gray-200">
          
              <h2 className="text-lg font-medium text-gray-900" id="slide-over-heading">
                Advanced Filters
              </h2>
              <div className="ml-3 h-7 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
              
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
       
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-grow">
            <div className=" px-6 py-4">
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.376l3.707 3.707a1 1 0 01-1.414 1.414l-3.707-3.707A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="search"
                  name="search"
                  id="search"
                  className="block w-full h-10 rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search Field"
                />
              </div>
            </div>

            {/* Filter Sections */}
            <div className="">
              {/* Task Info Section */}
              <div className={`border-b border-gray-200 `}>
                <button
                  className="flex w-full items-center justify-between px-6 py-3 bg-gray-200 text-sm font-medium text-gray-900"
                  onClick={() => toggleSection('taskInfo')}
                >
                  Task Info
                  <svg
                    className={`h-5 w-5 transform transition-transform duration-200 ${openSections.taskInfo ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.taskInfo && (
                  <div className=" text-sm text-gray-700">
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50">Title</div>
                    <div className="pl-6  py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50">Description</div>
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50">Status</div>
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer border-gray-50">Due Date ( EDT )</div>
                  </div>
                )}
              </div>

              {/* Associations Section */}
              <div className={`border-b border-gray-200 `}>
                <button
                  className="flex w-full items-center justify-between px-6 py-3 bg-gray-200 text-sm font-medium text-gray-900"
                  onClick={() => toggleSection('associations')}
                >
                  Associations
                  <svg
                    className={`h-5 w-5 transform transition-transform duration-200 ${openSections.associations ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.associations && (
                  <div className=" text-sm text-gray-700">
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer  border-gray-50">Associated Contacts</div>
                  </div>
                )}
              </div>

              {/* Other Details Section */}
              <div className={`border-b border-gray-200 `}>
                <button
                  className="flex w-full items-center justify-between px-6 py-3 bg-gray-200 text-sm font-medium text-gray-900"
                  onClick={() => toggleSection('otherDetails')}
                >
                  Other Details
                  <svg
                    className={`h-5 w-5 transform transition-transform duration-200 ${openSections.otherDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSections.otherDetails && (
                  <div className="text-sm text-gray-700">
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50">Assignee</div>
                    <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50">Created At ( EDT )</div>
                      <div className="pl-6 py-2 hover:bg-gray-100 cursor-pointer  border-gray-50">Updated At ( EDT )</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdvancedFiltersDrawer; 