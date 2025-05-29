import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { ActionType } from '@/app/api/bulk-actions/request/tags/route';
import { showSuccess, showError } from '@/lib/toast';
import { Contact } from '@/types';

interface Tag {
  value: string;
  label: string;
}

interface RemoveTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onContactsUpdate?: (updatedContacts: Contact[]) => void;
}

export default function RemoveTagsModal({ isOpen, onClose, selectedContacts, onContactsUpdate }: RemoveTagsModalProps) {
  const [actionName, setActionName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [touched, setTouched] = useState<{ action?: boolean; tags?: boolean }>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [removeAll, setRemoveAll] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Fetch available tags
  useEffect(() => {
    async function fetchTags() {
      try {
        setLoadingTags(true);
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        const tags = data.tags.map((tag: any) => ({ value: tag.name, label: tag.name }));
        setAvailableTags(tags);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError('Failed to load tags. Please try again.');
        showError('Failed to load tags. Please try again.');
      } finally {
        setLoadingTags(false);
      }
    }
    fetchTags();
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const initials = (contact: Contact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();
    }
    if (contact.name) {
      return contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'C';
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setDropdownOpen(false);
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ action: true, tags: true });
    if (!actionName || (!removeAll && selectedTags.length === 0)) return;
    try {
      await removeTagAPI(); 
      
      // Update contacts locally
      if (onContactsUpdate) {
        const updatedContacts = selectedContacts.map(contact => ({
          ...contact,
          tags: removeAll ? [] : (contact.tags || []).filter(tag => !selectedTags.includes(tag))
        }));
        onContactsUpdate(updatedContacts);
      }
      
      setActionName('');
      setSelectedTags([]);
      setTouched({});
      setDropdownOpen(false);
      setRemoveAll(false);
      onClose();
    } catch (error) {
      console.error('Error removing tags:', error);
      showError('Failed to remove tags');
    }
  };

  const removeTagAPI = async () => {
    const payload = {
      actionType: ActionType.REMOVE_TAG,
      actionName,
      ids: selectedContacts.map(c => c.id),
      tags: removeAll ? [] : selectedTags,
      removeAllTags: removeAll,
    };
    const result = await fetch('/api/bulk-actions/request/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await result.json();
    if (!result.ok) {
      throw new Error(data.message || 'Failed to remove tags');
    }
    return data;
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Remove Tags</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 pb-0">
            <div className="text-gray-500 mb-4">Specified tags will get removed from all the selected contacts</div>
            <div className="mb-6">
              <div className="text-base font-medium text-gray-800 mb-2">Remove tags from following contacts</div>
              <div className="flex items-center gap-2">
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
            </div>
            {/* Action Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={actionName}
                onChange={e => setActionName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, action: true }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description for the action"
              />
              {touched.action && !actionName && (
                <div className="text-xs text-red-500 mt-1">* Action Name required</div>
              )}
            </div>
            {/* Remove all tags */}
            <div className="mb-4 flex items-center">
              <input
                id="remove-all-tags"
                type="checkbox"
                checked={removeAll}
                onChange={e => {
                  setRemoveAll(e.target.checked);
                  if (e.target.checked) {
                    setSelectedTags([]);
                    setDropdownOpen(false);
                  }
                }}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remove-all-tags" className="text-sm font-medium text-gray-700 select-none">
                Remove all tags
              </label>
            </div>
            {removeAll && (
              <div className="text-xs text-gray-500 mb-2 ml-6">All tags will be removed from the selected contacts</div>
            )}
            {/* Tags */}
            {!removeAll && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-red-500">*</span></label>
                <div ref={dropdownRef} className="relative">
                  <div
                    className={`w-full p-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer flex items-center min-h-[40px] ${dropdownOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    onClick={() => setDropdownOpen(v => !v)}
                    tabIndex={0}
                  >
                    {selectedTags.length === 0 ? (
                      <span className="text-gray-400">Please select tags</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map(tag => (
                          <span key={tag} className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs font-medium mr-1">
                            {availableTags.find(t => t.value === tag)?.label || tag}
                            <button
                              type="button"
                              className="ml-1 text-blue-400 hover:text-blue-700 focus:outline-none"
                              onClick={e => { e.stopPropagation(); handleTagRemove(tag); }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {availableTags.filter(tag => !selectedTags.includes(tag.value)).length === 0 ? (
                        <div className="px-4 py-2 text-gray-400 text-sm">No more tags</div>
                      ) : (
                        availableTags.filter(tag => !selectedTags.includes(tag.value)).map(tag => (
                          <div
                            key={tag.value}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                            onClick={() => handleTagSelect(tag.value)}
                          >
                            {tag.label}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {touched.tags && selectedTags.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">* Tags required</div>
                )}
              </div>
            )}
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-2">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              <span className="text-sm text-blue-700">Bulk Actions are performed over period of time. You can track the progress on the Bulk Actions page.</span>
            </div>
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
              disabled={!actionName || (!removeAll && selectedTags.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove Tags
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 