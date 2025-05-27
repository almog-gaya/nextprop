import React, { useState, forwardRef, useImperativeHandle } from 'react';

interface ManageFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageFieldsModal = forwardRef<HTMLDivElement, ManageFieldsModalProps>(({ isOpen, onClose }, ref) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Drawer */}
      <div ref={ref} className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0" style={{ minWidth: '360px' }}>
        <div className="h-full divide-y divide-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <h2 className="text-lg font-medium text-gray-900" id="slide-over-heading">
                Manage Fields
              </h2>
            </div>
            <div className="ml-3 h-7 flex items-center">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-grow">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Search Input */}
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.376l3.707 3.707a1 1 0 01-1.414 1.414l-3.707-3.707A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="search"
                  name="search"
                  id="search-fields"
                  className="block w-full h-10 rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search fields"
                />
              </div>

              {/* Fields in table section */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Fields in table</h3>
                <div className="rounded-md">
                  {/* Example Field Rows (replace with actual data/mapping) */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Status</span>
                    </div>
                  </div>
                  {/* Add more field rows here */}
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Title</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Associated Contacts</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Assignee</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Due Date ( EDT )</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Updated At ( EDT )</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Created At ( EDT )</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-900">Description</span>
                    </div>
                  </div>
                   <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                      <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                      <span className="ml-2 text-sm text-gray-900">Actions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add fields section */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Add fields</h3>
                {/* Add field options here */}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ManageFieldsModal; 