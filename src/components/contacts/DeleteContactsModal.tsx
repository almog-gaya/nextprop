import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface DeleteContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onDelete: () => void;
}

export default function DeleteContactsModal({ isOpen, onClose, selectedContacts, onDelete }: DeleteContactsModalProps) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const initials = (contact: Contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();
    }
    if (contact.name) {
      return contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'C';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText === 'DELETE') {
      onDelete();
      setConfirmText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-red-50">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm-2 6h8" /></svg>
              </span>
              <span className="text-xl font-semibold text-gray-900">
                Delete {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''}?
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 pb-0">
            <div className="flex items-center gap-2 mb-4">
              {selectedContacts.length <= 3 ? (
                selectedContacts.map((c, idx) => (
                  <span key={c.id} className={`inline-flex items-center justify-center rounded-full w-8 h-8 text-base font-bold border ${idx === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                    {initials(c)}
                  </span>
                ))
              ) : (
                <>
                  <span className="inline-flex items-center justify-center rounded-full w-8 h-8 text-base font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {selectedContacts.length}
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full w-8 h-8 text-base font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {initials(selectedContacts[0])}
                  </span>
                </>
              )}
            </div>
            <div className="mb-2 text-sm text-gray-700 font-semibold">
              <span className="text-gray-900">Note</span> : Deleted contacts can be restored within 2 months
            </div>
            <div className="mb-4 text-xs text-gray-500">
              Deleting any contacts will also remove the corresponding: Conversations, Notes, Opportunities, Tasks, Appointments, Manual Actions, Community Group Owners. It will also stop any active campaigns and workflows for the contacts.
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Type 'DELETE' to confirm</label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="DELETE"
            />
          </div>
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-6 flex items-start gap-2">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            <span className="text-sm text-blue-700">Bulk Actions are performed over period of time. You can track the progress on the Bulk Actions page.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 px-6 pb-6 pt-4 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmText !== 'DELETE'}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 