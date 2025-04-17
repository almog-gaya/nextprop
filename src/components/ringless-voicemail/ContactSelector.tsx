import React, { useCallback } from 'react';
import { XIcon, FileTextIcon } from 'lucide-react';

interface ContactSelectorProps {
  contacts: any[];
  selectedContacts: any[];
  searchQuery: string;
  isSearching: boolean;
  isFetching: boolean;
  totalContacts: number;
  onSearchChange: (value: string) => void;
  onToggleContact: (contact: any) => void;
  onClearSelected: () => void;
  onSelectAll: () => void;
  onOpenBulkUpload: () => void;
  loaderRef: React.RefObject<HTMLLIElement | null>;
  stageName?: string | null;
}

function ContactSelector({
  contacts,
  selectedContacts,
  searchQuery,
  isSearching,
  isFetching,
  totalContacts,
  onSearchChange,
  onToggleContact,
  onClearSelected,
  onSelectAll,
  onOpenBulkUpload,
  loaderRef,
  stageName = null,
}: ContactSelectorProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleToggleContact = useCallback(
    (contact: any) => () => {
      onToggleContact(contact);
    },
    [onToggleContact]
  );

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Select Contacts</h4>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            id="contact-search"
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400"
            placeholder="Search contacts by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search contacts by name"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          {searchQuery && (
            <XIcon
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150"
              onClick={handleClearSearch}
              aria-label="Clear search"
            />
          )}
        </div>
        <button
          onClick={onOpenBulkUpload}
          className="flex items-center px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <FileTextIcon className="h-4 w-4 mr-2" />
          Bulk Upload
        </button>
      </div>

      <div className="mt-6"> 
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium text-gray-700">Available Contacts ({selectedContacts.length})</h5>
          {stageName && <span className="ml-2 text-purple-600 font-medium">in {stageName}</span>}
          {selectedContacts.length != totalContacts && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-sm text-black-600 hover:text-grey-700 font-medium transition-colors duration-150"
            >
              Select All
            </button>
          )}
        </div>
        
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-white shadow-inner">
          <ul className="divide-y divide-gray-200">
            {isSearching ? (
              <li className="px-4 py-3 text-center text-sm text-gray-500">Searching contacts...</li>
            ) : contacts.length > 0 ? (
              contacts.map((contact) => {
                const isSelected = selectedContacts.some((c) => c.id === contact.id);
                const contactName = contact.name || `${contact.firstName || contact.contactName || 'Unnamed'} ${contact.lastName || ''}`.trim();
                return (
                  <li
                    key={contact.id}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150 hover:bg-gray-100 ${isSelected ? 'bg-purple-50' : ''}`}
                    onClick={handleToggleContact(contact)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contactName}</p>
                      {contact.fullAddress && (
                        <p className="text-xs text-gray-600 truncate">{contact.fullAddress}</p>
                      )}
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-gray-500 truncate">{contact.phone || 'No phone'}</p>
                        {contact.value && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                            {contact.value}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer transition-all duration-150"
                        checked={isSelected}
                        onChange={handleToggleContact(contact)}
                        aria-label={`Select ${contactName}`}
                      />
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-center text-sm text-gray-500">
                {isFetching? 'Please wait...' : searchQuery ? 'No contacts matching your search' : 'No contacts available'}
              </li>
            )}
            {isFetching && !isSearching && (
              <li className="px-4 py-3 flex justify-center">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-500">Loading contacts...</span>
                </div>
              </li>
            )}
            <li ref={loaderRef} className="h-1" />
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium text-gray-700">Selected Contacts ({selectedContacts.length})</h5>
          {selectedContacts.length > 0 && (
            <button
              type="button"
              onClick={onClearSelected}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-150"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 min-h-[4rem] flex items-center">
          {selectedContacts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedContacts.map((contact) => (
                <span
                  key={contact.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shadow-sm"
                >
                  {contact.name || contact.firstName || contact.contactName || contact.phone || 'Unknown Contact'}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No contacts selected yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ContactSelector);