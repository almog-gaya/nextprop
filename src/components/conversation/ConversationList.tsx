import { Search } from 'lucide-react';
import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import Avatar from './Avatar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  contacts: Contact[];
  onConversationStarted?: () => void;
}

const NewConversationModal = memo(
  ({
    isOpen,
    onClose,
    contacts,
    newConversation,
    setNewConversation,
    handleStartConversation,
    isSubmitting,
  }: {
    isOpen: boolean;
    onClose: () => void;
    contacts: Contact[];
    newConversation: {
      contactId: string;
      message: string;
      type: 'SMS' | 'Email';
      fromNumber: string;
      subject: string;
      scheduledTimestamp: string;
    };
    setNewConversation: React.Dispatch<
      React.SetStateAction<{
        contactId: string;
        message: string;
        type: 'SMS' | 'Email';
        fromNumber: string;
        subject: string;
        scheduledTimestamp: string;
      }>
    >;
    handleStartConversation: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
  }) => {
    if (!isOpen) return null;

    const filteredContacts = useMemo(
      () => contacts.filter((contact) => newConversation.type === 'SMS' ? !!contact.phone : !!contact.email),
      [contacts, newConversation.type]
    );

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Start New Conversation</h3>
          <form onSubmit={handleStartConversation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select
                value={newConversation.type}
                onChange={(e) =>
                  setNewConversation((prev) => ({
                    ...prev,
                    type: e.target.value as 'SMS' | 'Email',
                    contactId: '',
                  }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Contact</label>
              <select
                value={newConversation.contactId}
                onChange={(e) =>
                  setNewConversation((prev) => ({ ...prev, contactId: e.target.value }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a contact</option>
                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}{' '}
                    {newConversation.type === 'SMS' ? `(${contact.phone || 'No phone'})` : `(${contact.email || 'No email'})`}
                  </option>
                ))}
              </select>
              {filteredContacts.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No contacts available with {newConversation.type === 'SMS' ? 'phone numbers' : 'email addresses'}
                </p>
              )}
            </div>

            {newConversation.type === 'Email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newConversation.subject}
                  onChange={(e) => setNewConversation((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter email subject"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newConversation.message}
                onChange={(e) => setNewConversation((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                rows={4}
                required
                disabled={isSubmitting}
                placeholder={`Enter your ${newConversation.type === 'SMS' ? 'SMS message' : 'email body'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
              <input
                type="datetime-local"
                value={newConversation.scheduledTimestamp}
                onChange={(e) =>
                  setNewConversation((prev) => ({ ...prev, scheduledTimestamp: e.target.value }))
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex items-center"
                disabled={isSubmitting || filteredContacts.length === 0}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    />
                  </svg>
                )}
                {isSubmitting ? 'Processing...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.contacts === nextProps.contacts &&
    prevProps.newConversation === nextProps.newConversation
);

const ConversationList = memo(function ConversationList({
  conversations,
  activeId,
  onSelect,
  contacts,
  onConversationStarted,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const conversationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const conversationsPerPage = 15;
  const totalPages = Math.ceil((conversations?.length || 0) / conversationsPerPage);

  const [newConversation, setNewConversation] = useState({
    contactId: '',
    message: '',
    type: 'SMS' as 'SMS' | 'Email',
    fromNumber: user?.lcPhone?.locationId || '+12543585931',
    subject: '',
    scheduledTimestamp: '',
  });

  // Debugging re-renders
  useEffect(() => {
    console.log('ConversationList rendered');
  });

  // Scroll to active conversation when it changes
  useEffect(() => {
    if (activeId && conversationRefs.current[activeId]) {
      conversationRefs.current[activeId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeId]);

  const filteredConversations = useMemo(
    () =>
      searchTerm
        ? conversations.filter(
            (conv) =>
              conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : conversations,
    [conversations, searchTerm]
  );

  const displayedConversations = useMemo(
    () => filteredConversations.slice((page - 1) * conversationsPerPage, page * conversationsPerPage),
    [filteredConversations, page]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
    searchInputRef.current?.focus();
  }, []);

  const handleNextPage = useCallback(() => {
    if (page < totalPages) setPage(page + 1);
  }, [page, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page]);

  const truncateMessage = useCallback((message: string) => {
    return message?.length > 50 ? message.substring(0, 50) + '...' : message || 'No messages yet';
  }, []);

  const handleStartConversation = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        if (!newConversation.contactId) {
          toast.error('Please select a contact');
          return;
        }
        if (!newConversation.message.trim()) {
          toast.error('Please enter a message');
          return;
        }
        if (newConversation.type === 'Email' && !newConversation.subject.trim()) {
          toast.error('Please enter a subject for the email');
          return;
        }

        const selectedContact = contacts.find((c) => c.id === newConversation.contactId);
        if (!selectedContact) {
          toast.error('Invalid contact selected');
          return;
        }

        if (newConversation.type === 'SMS' && !selectedContact.phone) {
          toast.error('Selected contact has no phone number for SMS');
          return;
        }
        if (newConversation.type === 'Email' && !selectedContact.email) {
          toast.error('Selected contact has no email address');
          return;
        }

        const scheduledTimestamp = newConversation.scheduledTimestamp
          ? Math.floor(new Date(newConversation.scheduledTimestamp).getTime() / 1000)
          : undefined;

        const payload = {
          type: newConversation.type,
          body: newConversation.message.trim(),
           message: newConversation.message.trim(),
          contactId: newConversation.contactId,
          ...(newConversation.type === 'SMS' && {
            message: newConversation.message.trim(),
            fromNumber: newConversation.fromNumber,
            toNumber: selectedContact.phone,
          }),
          ...(newConversation.type === 'Email' && {
            html: newConversation.message.trim(),
            emailTo: selectedContact.email,
            subject: newConversation.subject,
            emailFrom: 'bahadurhere@gmail.com',
          }),
          ...(scheduledTimestamp && { scheduledTimestamp }),
        };

        console.log('Sending payload to /api/conversations/messages:', payload);

        const response = await axios.post('/api/conversations/messages', payload);

        if (response.data && response.data.msg === 'Message queued successfully') {
          toast.success(
            `Conversation ${scheduledTimestamp ? 'scheduled' : 'started'} successfully`
          );
          setIsNewConversationModalOpen(false);
          setNewConversation({
            contactId: '',
            message: '',
            type: 'SMS',
            fromNumber: user?.lcPhone?.locationId || '+12543585931',
            subject: '',
            scheduledTimestamp: '',
          });
          if (response.data.conversationId) {
            onSelect(response.data.conversationId);
          }
          onConversationStarted?.();
        } else {
          toast.error(response.data?.message || response.data?.msg || 'Unexpected response from server');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to start conversation';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [newConversation, contacts, user, onSelect, onConversationStarted]
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="flex justify-between items-center">
          <div className="relative flex-grow">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations"
              className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setIsNewConversationModalOpen(true)}
            className="ml-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Start Conversation
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100vh - 170px)' }}>
        {displayedConversations.length > 0 ? (
          displayedConversations.map((conversation: Conversation) => (
            <div
              key={conversation.id}
              ref={(el) => (conversationRefs.current[conversation.id] = el)}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                activeId === conversation.id ? 'bg-gray-100' : ''
              }`}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar initials={conversation.avatar} />
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      conversation.unread ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {truncateMessage(conversation.lastMessage)}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600 flex-shrink-0 mt-1.5"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No conversations match your search' : 'No conversations found'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-2 border-t border-gray-200 flex items-center justify-between sticky bottom-0 bg-white">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`px-3 py-1 text-sm rounded ${
              page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`px-3 py-1 text-sm rounded ${
              page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            Next
          </button>
        </div>
      )}

      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        contacts={contacts}
        newConversation={newConversation}
        setNewConversation={setNewConversation}
        handleStartConversation={handleStartConversation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  const conversationsEqual = prevProps.conversations === nextProps.conversations ||
    (prevProps.conversations.length === nextProps.conversations.length &&
     prevProps.conversations.every((prevConv, index) =>
       prevConv.id === nextProps.conversations[index].id &&
       prevConv.lastMessage === nextProps.conversations[index].lastMessage &&
       prevConv.unread === nextProps.conversations[index].unread
     ));
  return (
    conversationsEqual &&
    prevProps.activeId === nextProps.activeId &&
    prevProps.contacts === nextProps.contacts &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onConversationStarted === nextProps.onConversationStarted
  );
});

export default ConversationList;