'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';



function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-medium flex-shrink-0">
      {initials}
    </div>
  );
}

function ConversationList({ conversations, activeId, onSelect }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const conversationsPerPage = 15;
  const totalPages = Math.ceil((conversations?.length || 0) / conversationsPerPage);
  
  // Filter conversations based on search term
  const filteredConversations = searchTerm
    ? conversations.filter((conv: any) => 
        conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : conversations;
  
  // Get current page of conversations
  const displayedConversations = filteredConversations.slice(
    (page - 1) * conversationsPerPage, 
    page * conversationsPerPage
  );
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations"
            className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100vh - 170px)' }}>
        {displayedConversations.length > 0 ? (
          displayedConversations.map((conversation: any) => (
            <div
              key={conversation.id}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${activeId === conversation.id ? 'bg-gray-100' : ''
                }`}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar initials={conversation.avatar} />
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conversation.unread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
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
            className={`px-3 py-1 text-sm rounded ${page === 1 ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className={`px-3 py-1 text-sm rounded ${page === totalPages ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function MessageThread({ activeConversation, onSendMessage, messages, onLoadMore, hasMore, loading }: any) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Scroll to bottom when messages change, but only for new messages
  useEffect(() => {
    if (messagesEndRef.current && !loading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If no active conversation is selected
  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
          <p>Please select a conversation from the list to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-3 sticky top-0 z-10 bg-white">
        <div className="flex items-center">
          <div className="md:hidden mr-2">
            <button className="p-2 rounded-md hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
          </div>
          <Avatar initials={getInitials(activeConversation.name)} />
          <div className="ml-3 flex-grow">
            <h2 className="font-medium">{activeConversation.name || 'Unknown Contact'}</h2>
            <div className="flex items-center text-sm text-gray-500">
              {activeConversation.phone && (
                <span className="mr-2">{activeConversation.phone}</span>
              )}
              {activeConversation.email && (
                <span>{activeConversation.email}</span>
              )}
            </div>
          </div>
          <div className="flex">
            <button className="p-2 rounded-full hover:bg-gray-100 mr-1">
              <Phone size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 mr-1">
              <Video size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {hasMore && (
          <div className="flex justify-center my-2">
            <button 
              onClick={onLoadMore}
              disabled={loading}
              className={`text-sm ${loading ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} font-semibold py-1 px-3 rounded-full transition-colors`}
            >
              {loading ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}
        
        {messages && messages.length > 0 ? (
          messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.senderId === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="break-words whitespace-pre-wrap text-sm">{message.text}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-gray-500">
            <div className="text-center p-4">
              {activeConversation ? (
                <p>No messages in this conversation yet. Send a message to start the conversation.</p>
              ) : (
                <p>Select a conversation to view messages.</p>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white shadow-lg">
        <div className="flex items-center gap-2">
          <textarea
            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] text-base"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-colors flex-shrink-0 hover:shadow-md w-12 h-12 flex items-center justify-center"
            onClick={handleSend}
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

 
interface Conversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType: string;
  type: string;
  unreadCount: number;
  fullName: string;
  contactName: string;
  email: string;
  phone: string;
}

 
interface Message {
  id: string;
  body: string;
  text?: string;
  direction: string;
  dateAdded: string;
  messageType: string;
}

export default function MessagingEmbedPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // fetching conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        console.log('Fetching conversations...');
        const response = await fetch('/api/conversations');
        const data = await response.json();
        console.log('Conversations API Response:', data);

        if (data.error) {
          console.error('Error fetching conversations:', data.error);
          setConversations([]);
          setLoading(false);
          return;
        }

        if (Array.isArray(data?.conversations)) {
          console.log(`Found ${data.conversations.length} conversations`);
          
          // Format conversations for display
          const formattedConversations = data.conversations.map((conv: Conversation) => {
            // Create a display name from the available fields
            const name = conv.fullName || conv.contactName || conv.email || conv.phone || 'Unknown Contact';
            
            // Get initials for avatar
            const initials = name.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);
            
            return {
              id: conv.id,
              name: name,
              avatar: initials,
              lastMessage: conv.lastMessageBody || 'No messages yet',
              timestamp: 'Recent',
              unread: conv.unreadCount > 0,
              contactId: conv.contactId,
              email: conv.email,
              phone: conv.phone,
              // Store the original conversation data for reference
              originalData: conv
            };
          });
          
          setConversations(formattedConversations);
          
          // Set active conversation if none is selected
          if (!activeConversationId && formattedConversations.length > 0) {
            console.log('Setting initial active conversation:', formattedConversations[0].id);
            setActiveConversationId(formattedConversations[0].id);
          }
        } else {
          console.error('Invalid conversations format:', data);
          setConversations([]);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [activeConversationId]);

  
  // fetching messages
  const fetchMessages = async (conversationId: string, pageToken?: string, append = false) => {
    if (!conversationId) return;

    setLoadingMessages(true);
    try {
      let url = `/api/conversations/${conversationId}/messages`;
      if (pageToken) {
        url += `?page=${pageToken}`;
      }
      
      console.log(`Fetching messages for conversation: ${conversationId}${pageToken ? ', page: ' + pageToken : ''}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Messages API Response:', data);

      if (data.error) {
        console.error('Error fetching messages:', data.error);
        if (!append) {
          setMessages([]);
        }
        return;
      }

      // Check if there are more pages
      setHasMoreMessages(data.nextPage || false);
      if (data.lastMessageId) {
        setMessagesPage(data.lastMessageId);
      }

      if (Array.isArray(data?.messages)) {
        console.log(`Found ${data.messages.length} messages`);
        
        // Add additional validation and formatting for messages
        const formattedMessages = data.messages
          .filter((msg: any) => msg && (msg.body || msg.text)) // Filter out any invalid messages
          .map((msg: Message) => ({
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            senderId: msg.direction === 'inbound' ? 'client' : 'user',
            text: msg.body || msg.text || '[No message content]',
            timestamp: msg.dateAdded ? new Date(msg.dateAdded).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent'
          }));
        
        // Sort messages by date if available
        formattedMessages.sort((a: any, b: any) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return a.timestamp.localeCompare(b.timestamp);
        });
        
        console.log('Formatted messages:', formattedMessages);
        
        // Either set or append messages depending on if we're loading more
        if (append) {
          setMessages(prev => [...formattedMessages, ...prev]);
        } else {
          setMessages(formattedMessages);
        }
      } else {
        console.error('Invalid messages format:', data);
        if (!append) {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      if (!append) {
        setMessages([]);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Update the useEffect that calls fetchMessages
  useEffect(() => {
    if (activeConversationId) {
      // Reset pagination state when conversation changes
      setMessagesPage(null);
      setHasMoreMessages(false);
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Add a loadMoreMessages function
  const loadMoreMessages = () => {
    if (activeConversationId && messagesPage && !loadingMessages) {
      fetchMessages(activeConversationId, messagesPage, true);
    }
  };

  // Update handleSendMessage
  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !text.trim()) return;

    // Optimistically add the message to the UI
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      senderId: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      console.log(`Sending message to conversation ${activeConversationId}: ${text}`);
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      console.log('Send message response:', data);

      if (data.error) {
        console.error('Error sending message:', data.error);
        // You could update the UI to show the error or retry
        return;
      }

      // Replace the temp message with the real one if needed
      // or just leave it as is since we're already showing it
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could update the UI to show the error or retry
    }
  };

  // Update the render method to pass the active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId);
  
  return (
    <DashboardLayout title="Messaging >>>">
      <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-96px)] bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="md:col-span-4 border-r border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={setActiveConversationId}
            />
          )}
        </div>
        <div className="md:col-span-8 flex flex-col overflow-hidden">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <div>Loading messages...</div>
            </div>
          ) : (
            <MessageThread
              messages={messages}
              onSendMessage={handleSendMessage}
              activeConversation={activeConversation}
              onLoadMore={loadMoreMessages}
              hasMore={hasMoreMessages}
              loading={loadingMessages}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}