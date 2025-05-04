import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string) => void;
}

export default function NewMessageModal({ isOpen, onClose, onSelectContact }: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/search?q=${query}`);
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full px-4 py-2 border rounded-lg pr-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchContacts(e.target.value);
            }}
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : contacts.length > 0 ? (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  onSelectContact(contact.id);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <div>
                  <div className="font-medium">{contact.name}</div>
                  {contact.phone && <div className="text-sm text-gray-500">{contact.phone}</div>}
                  {contact.email && <div className="text-sm text-gray-500">{contact.email}</div>}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">No contacts found</div>
          )}
        </div>
      </div>
    </div>
  );
}