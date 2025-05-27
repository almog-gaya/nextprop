import React, { useState } from 'react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const [showDescription, setShowDescription] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0" style={{ minWidth: '360px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="">
            
            <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4">
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="taskTitle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task title"
            />
          </div>

          {showDescription ? (
            <div className="mb-4">
              <button
                className="text-red-600 text-sm font-medium mb-2 flex items-center"
                onClick={() => setShowDescription(false)}
              >
                 <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Remove description
              </button>
              <textarea
                id="taskDescription"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description..."
              />
            </div>
          ) : (
            <div className="mb-4">
              <button
                className="text-blue-600 text-sm font-medium mb-2 flex items-center"
                onClick={() => setShowDescription(true)}
              >
                 <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                 Add description
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date and time (EDT)</label>
            <div className="flex gap-3">
              <input
                type="date"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="time"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-700">Recurring tasks</span>
            {/* Toggle switch placeholder */}
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <select id="contact" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option>Select contact</option>
              {/* Map contacts here */}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
            <select id="assignee" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option>Select assignee</option>
              {/* Map assignees here */}
            </select>
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
          {/* 'Save and Add Another' button - hidden for now as per screenshot */}
          {/* <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Save and Add Another
          </button> */}
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 