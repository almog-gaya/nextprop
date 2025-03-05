'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = false;

const log = (message: string, data?: any) => {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

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

  // Helper function to truncate long messages for preview
  const truncateMessage = (message: string) => {
    if (!message) return 'No messages yet';
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
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
                    {truncateMessage(conversation.lastMessage)}
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
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ')
      .filter((n: string) => n.length > 0)
      .map((n: string) => n[0])
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

  // Scroll to bottom immediately when sending status changes to make sure user sees their sent message
  useEffect(() => {
    if (sendingStatus === 'sending' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sendingStatus]);

  const handleSend = () => {
    if (newMessage.trim()) {
      setSendingStatus('sending');
      onSendMessage(newMessage, (success: boolean) => {
        setSendingStatus(success ? 'success' : 'error');
        setTimeout(() => setSendingStatus('idle'), 3000);
      });
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRefresh = () => {
    if (activeConversation && !refreshing) {
      setRefreshing(true);
      onLoadMore(true); // Pass true to indicate it's a refresh
      setTimeout(() => setRefreshing(false), 1000);
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

  // Render skeleton loading state for messages
  const renderSkeletonLoader = () => {
    return (
      <div className="animate-pulse space-y-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
            <div 
              className={`max-w-[65%] rounded-lg px-4 py-2 ${
                i % 2 === 0 ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
            <button 
              className="p-2 rounded-full hover:bg-gray-100 mr-1" 
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <div className={`${refreshing ? 'animate-spin' : ''}`}>
                <RefreshCw size={20} className="text-gray-600" />
              </div>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 mr-1">
              <Phone size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadMore}
              className="bg-white text-blue-600 px-4 py-2 rounded-full border border-blue-300 text-sm font-medium hover:bg-blue-50 transition-colors"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}
        
        {loading && messages.length === 0 ? (
          renderSkeletonLoader()
        ) : messages && messages.length > 0 ? (
          messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.senderId === 'user'
                    ? message.sendFailed ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="break-words whitespace-pre-wrap text-sm">{message.text}</p>
                <div
                  className={`text-xs mt-1 flex items-center ${
                    message.senderId === 'user' 
                      ? message.sendFailed ? 'text-red-500' : 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {message.timestamp}
                  {message.sendFailed && (
                    <span className="ml-2 text-red-500 flex items-center">
                      <AlertCircle size={12} className="mr-1" /> Failed to send
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-gray-500">
            <div className="text-center p-4">
              {loading ? (
                <p>Loading messages...</p>
              ) : activeConversation ? (
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
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-end">
          <textarea
            className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px] max-h-[160px]"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendingStatus === 'sending'}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendingStatus === 'sending'}
            className={`ml-2 p-3 rounded-full flex items-center justify-center ${
              !newMessage.trim() || sendingStatus === 'sending'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sendingStatus === 'sending' ? (
              <div className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} className={!newMessage.trim() ? 'text-gray-400' : 'text-white'} />
            )}
          </button>
        </div>
        
        {/* Message Status */}
        {sendingStatus === 'success' && (
          <div className="mt-1 text-xs text-green-600 flex items-center">
            <CheckCircle size={12} className="mr-1" /> Message sent successfully
          </div>
        )}
        {sendingStatus === 'error' && (
          <div className="mt-1 text-xs text-red-600 flex items-center">
            <AlertCircle size={12} className="mr-1" /> Failed to send message. Please try again.
          </div>
        )}
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
  originalData?: any;
}

 
interface Message {
  id: string;
  body: string;
  text?: string;
  direction: string;
  dateAdded: string;
  messageType: string;
}

// Define a type for our extended conversation object
interface ConversationDisplay extends Conversation {
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  originalData?: any;
}

export default function MessagingEmbedPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [hasPendingNewMessage, setHasPendingNewMessage] = useState(false);

  // fetching conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        log('Fetching conversations...');
        const response = await fetch('/api/conversations');
        const data = await response.json();
        log('Conversations API Response:', data);

        if (data.error) {
          log('Error fetching conversations:', data.error);
          setConversations([]);
          setLoading(false);
          return;
        }

        if (Array.isArray(data?.conversations)) {
          log(`Found ${data.conversations.length} conversations`);
          
          // Format conversations for display
          const formattedConversations = await Promise.all(data.conversations.map(async (conv: Conversation) => {
            // Create a display name from the available fields
            const name = conv.fullName || conv.contactName || conv.email || conv.phone || 'Unknown Contact';
            
            // Get initials for avatar
            const initials = name.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);
            
            // Fetch the most recent message for this conversation to ensure we have the latest
            // Only do this for the active conversation to avoid too many API calls
            let previewMessage = conv.lastMessageBody || 'No messages yet';
            
            if (conv.id === activeConversationId) {
              try {
                const msgResponse = await fetch(`/api/conversations/${conv.id}/messages?limit=1`);
                const msgData = await msgResponse.json();
                
                if (msgData.messages && msgData.messages.length > 0) {
                  // Use the most recent message as preview
                  const latestMessage = msgData.messages[0];
                  previewMessage = latestMessage.body || latestMessage.text || previewMessage;
                  log(`Updated preview for conversation ${conv.id}: ${previewMessage}`);
                }
              } catch (error) {
                log(`Error fetching latest message for conversation ${conv.id}:`, error);
                // Use the existing lastMessageBody as fallback
              }
            }
            
            return {
              id: conv.id,
              name: name,
              avatar: initials,
              lastMessage: previewMessage,
              timestamp: 'Recent',
              unread: conv.unreadCount > 0,
              contactId: conv.contactId,
              email: conv.email,
              phone: conv.phone,
              originalData: conv
            };
          }));
          
          log('Conversations with unread status:', formattedConversations.map(c => ({ id: c.id, name: c.name, unread: c.unread, unreadCount: c.originalData?.unreadCount })));
          
          // Sort conversations by most recent activity (unread first, then most recent)
          const sortedConversations = formattedConversations.sort((a: any, b: any) => {
            // First sort by unread status (unread conversations at the top)
            if (a.unread && !b.unread) return -1;
            if (!a.unread && b.unread) return 1;
            
            // Then sort by recency (assuming the order from API is by recent activity)
            // This maintains the server-side sorting
            return 0;
          });
          
          setConversations(sortedConversations);
          
          // Set active conversation if none is selected
          if (!activeConversationId && sortedConversations.length > 0) {
            log('Setting initial active conversation:', sortedConversations[0].id);
            setActiveConversationId(sortedConversations[0].id);
          }
        } else {
          log('Invalid conversations format:', data);
          setConversations([]);
        }
      } catch (error) {
        log('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
        
        // Reset the message sent flag after fetching conversations
        if (messageSent) {
          setMessageSent(false);
        }
      }
    };

    fetchConversations();
  }, [activeConversationId, messageSent]);

  
  // fetching messages
  const fetchMessages = async (conversationId: string, pageToken?: string, append = false) => {
    if (!conversationId) return;

    if (!append) {
      setLoadingMessages(true);
    }
    
    try {
      let url = `/api/conversations/${conversationId}/messages`;
      if (pageToken) {
        url += `?page=${pageToken}`;
      }
      
      // Limit console logging to reduce noise
      if (!pageToken) {
        log(`Fetching messages for conversation: ${conversationId}`);
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        log('Error fetching messages:', data.error);
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
            }) : 'Recent',
            dateAdded: msg.dateAdded || new Date().toISOString()
          }));
        
        // Sort messages by date (oldest first for display)
        formattedMessages.sort((a: any, b: any) => {
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        });
        
        // Either set or append messages depending on if we're loading more
        if (append) {
          setMessages(prev => [...formattedMessages, ...prev]);
        } else {
          setMessages(formattedMessages);
        }
        
        // Update the conversation preview if we have newer messages
        if (formattedMessages.length > 0 && !append) {
          // Find the most recent message
          const latestMessage = [...formattedMessages].sort((a: any, b: any) => {
            return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
          })[0];
          
          // Update the conversation in the list with this latest message
          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];
            const index = updatedConversations.findIndex(conv => conv.id === conversationId);
            
            if (index !== -1 && latestMessage) {
              // Create a properly typed updated conversation object
              const updatedConversation: ConversationDisplay = {
                ...updatedConversations[index],
                lastMessage: latestMessage.text,
                lastMessageBody: latestMessage.text
              };
              
              updatedConversations[index] = updatedConversation;
            }
            return updatedConversations;
          });
        }
      } else {
        log('Invalid messages format:', data);
        if (!append) {
          setMessages([]);
        }
      }
    } catch (error) {
      log('Failed to fetch messages:', error);
      if (!append) {
        setMessages([]);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Update messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      // Reset pagination state when conversation changes
      setMessagesPage(null);
      setHasMoreMessages(false);
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Add a loadMoreMessages function
  const loadMoreMessages = (isRefresh = false) => {
    if (!activeConversationId || (loadingMessages && !isRefresh)) return;
    
    if (isRefresh) {
      // For refresh, we want to fetch the most recent messages
      setMessages([]);
      setMessagesPage(null);
      fetchMessages(activeConversationId);
    } else if (messagesPage) {
      // For loading more messages (earlier messages), we append
      fetchMessages(activeConversationId, messagesPage, true);
    }
  };

  // Update handleSendMessage to also update the conversation preview immediately
  const handleSendMessage = async (text: string, callback?: (success: boolean) => void) => {
    if (!activeConversationId || !text) {
      callback?.(false);
      return;
    }

    try {
      // Optimistically add message to UI immediately
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        senderId: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateAdded: new Date().toISOString()
      };
      
      // Add optimistic message to UI
      setMessages(prev => [...prev, tempMessage]);

      // Also update conversation preview right away
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        const index = updatedConversations.findIndex(conv => conv.id === activeConversationId);
        
        if (index !== -1) {
          const updatedConversation: ConversationDisplay = {
            ...updatedConversations[index],
            lastMessage: text,
            lastMessageBody: text,
            timestamp: 'Just now'
          };
          
          updatedConversations[index] = updatedConversation;
          
          // Move this conversation to the top if it's not already
          if (index > 0) {
            const [conversation] = updatedConversations.splice(index, 1);
            updatedConversations.unshift(conversation);
          }
        }
        return updatedConversations;
      });

      // Make API call to send message
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the optimistic message with the real message details
        setMessages(prev => prev.map(msg => 
          msg.id === tempId
            ? { ...msg, id: data.id || msg.id }
            : msg
        ));
        
        callback?.(true);
      } else {
        log('Failed to send message:', data.error);
        
        // Mark the message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId
            ? { ...msg, sendFailed: true }
            : msg
        ));
        
        callback?.(false);
      }
    } catch (error) {
      log('Error sending message:', error);
      callback?.(false);
    }
  };

  // Update the render method to pass the active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId);
  
  // Add a function to mark a conversation as read
  const markConversationAsRead = async (conversationId: string) => {
    log('Marking conversation as read:', conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      log('Mark as read response:', data);

      if (data.success) {
        // Update the conversation's unread status in the state
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unread: false, originalData: { ...conv.originalData, unreadCount: 0 } } 
              : conv
          )
        );
      }
    } catch (error) {
      log('Failed to mark conversation as read:', error);
    }
  };

  // Update the setActiveConversationId function to also mark the conversation as read
  const handleConversationSelect = (id: string) => {
    // Don't reset state if same conversation is selected
    if (id === activeConversationId) return;
    
    // Set active ID first so UI updates immediately
    setActiveConversationId(id);
    
    // Clear messages and show loading state
    setMessages([]);
    setMessagesPage(null);
    setLoadingMessages(true);
    
    // After UI is updated to show loading, fetch messages
    fetchMessages(id);
    
    // Mark the conversation as read when selected
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation && conversation.unread) {
      markConversationAsRead(id);
      
      // Update conversation state to reflect read status
      setConversations(prevConversations => {
        return prevConversations.map(conv => 
          conv.id === id
            ? { ...conv, unread: false, unreadCount: 0 }
            : conv
        );
      });
    }
  };

  // Update the checkForNewMessages function
  useEffect(() => {
    // Function to check for new messages
    const checkForNewMessages = async () => {
      try {
        // Don't check for new messages if we're actively refreshing
        if (loading) return;
        
        // Make API call to get latest conversations
        const response = await fetch('/api/conversations');
        const data = await response.json();
        
        if (data.error) {
          log('Error fetching conversations:', data.error);
          return;
        }
        
        // Process the response to extract contact names and generate initials
        if (Array.isArray(data.conversations)) {
          const newConversations = data.conversations.map((conv: Conversation) => {
            const name = conv.fullName || conv.contactName || 'Unknown Contact';
            const initials = name
              .split(' ')
              .filter((n: string) => n.length > 0)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);
              
            return {
              id: conv.id,
              name,
              avatar: initials,
              contactId: conv.contactId,
              email: conv.email,
              phone: conv.phone,
              lastMessage: conv.lastMessageBody || 'No messages yet',
              timestamp: 'Recent',  // We'll improve this
              unread: conv.unreadCount > 0,
              unreadCount: conv.unreadCount || 0,
              originalData: conv
            };
          });
          
          // Check for new unread messages
          const hasNewUnreadMessages = newConversations.some((newConv: ConversationDisplay) => {
            // Find matching conversation in current state
            const existingConv = conversations.find(conv => conv.id === newConv.id);
            
            // If it's unread and either doesn't exist in current state or has more unread count
            return newConv.unread && (!existingConv || newConv.unreadCount > (existingConv?.unreadCount || 0));
          });
          
          if (hasNewUnreadMessages) {
            // Show notification for new messages
            toast.info('You have new unread messages', {
              description: 'Check your conversations for new messages',
              duration: 4000,
            });
            
            // Flag that we have pending new messages
            setHasPendingNewMessage(true);
            
            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => log('Could not play notification sound', e));
            } catch (e) {
              log('Audio not supported');
            }
          }
          
          // Logic to update state without losing current active conversation
          setConversations(currentConvs => {
            // For the active conversation, keep the current version to avoid UI glitches
            const updatedConversations = newConversations.map((newConv: ConversationDisplay) => {
              // If this is the active conversation, preserve message display state
              if (newConv.id === activeConversationId) {
                const existingConv = currentConvs.find(c => c.id === activeConversationId);
                if (existingConv) {
                  return {
                    ...newConv,
                    // Keep the unread status as false if we're currently viewing it
                    unread: false,
                    unreadCount: 0
                  };
                }
              }
              return newConv;
            });
            
            // Sort by unread status (unread first) and then by recency
            return updatedConversations.sort((a: ConversationDisplay, b: ConversationDisplay) => {
              // First by unread status
              if (a.unread && !b.unread) return -1;
              if (!a.unread && b.unread) return 1;
              
              // Then by most recent
              return 0; // We would need timestamps to sort by recency
            });
          });
        }
      } catch (error) {
        log('Error checking for new messages:', error);
      }
    };

    // Check for new messages periodically
    const interval = setInterval(checkForNewMessages, 120000); // 2 minutes
    
    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Reset the pending new message flag when active conversation changes
  useEffect(() => {
    if (hasPendingNewMessage) {
      setHasPendingNewMessage(false);
    }
  }, [activeConversationId, hasPendingNewMessage]);

  // Update the message thread component to show new message indicator
  const renderMessageThread = () => {
    if (!activeConversationId) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p>Choose a contact from the left to start chatting.</p>
          </div>
        </div>
      );
    }

    const activeConversation = conversations.find(conv => conv.id === activeConversationId);
    if (!activeConversation) return null;

    return (
      <MessageThread
        activeConversation={activeConversation}
        onSendMessage={handleSendMessage}
        messages={messages}
        onLoadMore={loadMoreMessages}
        hasMore={hasMoreMessages}
        loading={loadingMessages}
      />
    );
  };

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
              onSelect={handleConversationSelect}
            />
          )}
        </div>
        <div className="md:col-span-8 flex flex-col overflow-hidden">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <div>Loading messages...</div>
            </div>
          ) : (
            renderMessageThread()
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}