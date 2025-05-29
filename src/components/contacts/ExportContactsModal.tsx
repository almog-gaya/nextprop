import React from 'react';

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onExport: () => void;
}

export default function ExportContactsModal({ isOpen, onClose, selectedContacts, onExport }: ExportContactsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b">
          <span className="text-[18px] font-medium text-gray-800">Export Contacts</span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 focus:outline-none"
            style={{ marginTop: '-4px' }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex items-center px-8 pt-8 pb-6">
          <span className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-green-500 text-white text-base font-bold mr-4">
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" fill="#4ade80" /><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
            <span className="absolute text-white text-sm font-semibold" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>{selectedContacts.length}</span>
          </span>
          <span className="text-lg font-semibold text-gray-900">Export following contacts</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-center space-x-4 px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExport}
            className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-500 rounded-lg bg-white hover:bg-blue-50 focus:outline-none"
          >
            Export Contacts
          </button>
        </div>
      </div>
    </div>
  );
} 