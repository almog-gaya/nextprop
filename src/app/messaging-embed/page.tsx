'use client';

import { useEffect, useState } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { MessagingSkeleton } from '@/components/SkeletonLoaders';
import { Conversation, ConversationDisplay, Message } from '@/types/messageThread';
import MessageThread from '@/components/conversation/MessageThread';
import ConversationList from '@/components/conversation/ConversationList';
import axios from 'axios';

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

export default function MessagingEmbedPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [contacts, setContacts] = useState<any[]>([]); // Add contacts state
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [hasPendingNewMessage, setHasPendingNewMessage] = useState(false);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        log('Fetching contacts...');
        const response = await axios.get('/api/contacts');
        const data = response.data;
        
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
          log(`Found ${data.contacts.length} contacts`);
        } else {
          log('Invalid contacts format:', data);
          setContacts([]);
        }
      } catch (error) {
        log('Failed to fetch contacts:', error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, []);

  // Fetching conversations
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

          const formattedConversations = await Promise.all(data.conversations.map(async (conv: Conversation) => {
            const name = conv.fullName || conv.contactName || conv.email || conv.phone || 'Unknown Contact';
            const initials = name.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            let previewMessage = conv.lastMessageBody || 'No messages yet';

            if (conv.id === activeConversationId) {
              try {
                const msgResponse = await fetch(`/api/conversations/${conv.id}/messages?limit=1`);
                const msgData = await msgResponse.json();

                if (msgData.messages && msgData.messages.length > 0) {
                  const latestMessage = msgData.messages[0];
                  previewMessage = latestMessage.body || latestMessage.text || previewMessage;
                  log(`Updated preview for conversation ${conv.id}: ${previewMessage}`);
                }
              } catch (error) {
                log(`Error fetching latest message for conversation ${conv.id}:`, error);
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

          const sortedConversations = formattedConversations.sort((a: any, b: any) => {
            if (a.unread && !b.unread) return -1;
            if (!a.unread && b.unread) return 1;
            return 0;
          });

          setConversations(sortedConversations);

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
        if (messageSent) {
          setMessageSent(false);
        }
      }
    };

    fetchConversations();
  }, [messageSent]);

  // Fetching messages
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

      setHasMoreMessages(data.nextPage || false);
      if (data.lastMessageId) {
        setMessagesPage(data.lastMessageId);
      }

      if (Array.isArray(data?.messages)) {
        const formattedMessages = data.messages
          .filter((msg: any) => msg && (msg.body || msg.text))
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

        formattedMessages.sort((a: any, b: any) => {
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        });

        if (append) {
          setMessages(prev => [...formattedMessages, ...prev]);
        } else {
          setMessages(formattedMessages);
        }

        if (formattedMessages.length > 0 && !append) {
          const latestMessage = [...formattedMessages].sort((a: any, b: any) => {
            return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
          })[0];

          setConversations(prevConversations => {
            const updatedConversations = [...prevConversations];
            const index = updatedConversations.findIndex(conv => conv.id === conversationId);

            if (index !== -1 && latestMessage) {
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

  useEffect(() => {
    if (activeConversationId) {
      setMessagesPage(null);
      setHasMoreMessages(false);
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadMoreMessages = (isRefresh = false) => {
    if (!activeConversationId || (loadingMessages && !isRefresh)) return;

    if (isRefresh) {
      setMessages([]);
      setMessagesPage(null);
      fetchMessages(activeConversationId);
    } else if (messagesPage) {
      fetchMessages(activeConversationId, messagesPage, true);
    }
  };

  const getActiveConversationContactId = () => {
    const activeConversation = conversations.find(conv => conv.id === activeConversationId);
    return activeConversation?.contactId || null;
  };

  const handleSendMessage = async (text: string, callback?: (success: boolean) => void) => {
    if (!activeConversationId || !text) {
      callback?.(false);
      return;
    }

    try {
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        senderId: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateAdded: new Date().toISOString()
      };

      setMessages(prev => [...prev, tempMessage]);

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
          if (index > 0) {
            const [conversation] = updatedConversations.splice(index, 1);
            updatedConversations.unshift(conversation);
          }
        }
        return updatedConversations;
      });

      const contactId = getActiveConversationContactId();

      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, contactId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, id: data.id || msg.id }
            : msg
        ));
        setMessageSent(true); // Trigger conversation list refresh
        callback?.(true);
      } else {
        log('Failed to send message:', data.error);
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

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);

  const markConversationAsRead = async (conversationId: string) => {
    log('Marking conversation as read:', conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      log('Mark as read response:', data);

      if (data.success) {
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

  const handleConversationSelect = (id: string) => {
    if (id === activeConversationId) return;

    setActiveConversationId(id);
    setMessages([]);
    setMessagesPage(null);
    setLoadingMessages(true);
    fetchMessages(id);

    const conversation = conversations.find(conv => conv.id === id);
    if (conversation && conversation.unread) {
      markConversationAsRead(id);
      setConversations(prevConversations => {
        return prevConversations.map(conv =>
          conv.id === id
            ? { ...conv, unread: false, unreadCount: 0 }
            : conv
        );
      });
    }
  };

  useEffect(() => {
    const checkForNewMessages = async () => {
      try {
        if (loading) return;

        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (data.error) {
          log('Error fetching conversations:', data.error);
          return;
        }

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
              timestamp: 'Recent',
              unread: conv.unreadCount > 0,
              unreadCount: conv.unreadCount || 0,
              originalData: conv
            };
          });

          const hasNewUnreadMessages = newConversations.some((newConv: ConversationDisplay) => {
            const existingConv = conversations.find(conv => conv.id === newConv.id);
            return newConv.unread && (!existingConv || newConv.unreadCount > (existingConv?.unreadCount || 0));
          });

          if (hasNewUnreadMessages) {
            toast.info('You have new unread messages', {
              description: 'Check your conversations for new messages',
              duration: 4000,
            });
            setHasPendingNewMessage(true);
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => log('Could not play notification sound', e));
            } catch (e) {
              log('Audio not supported');
            }
          }

          setConversations(currentConvs => {
            const updatedConversations = newConversations.map((newConv: ConversationDisplay) => {
              if (newConv.id === activeConversationId) {
                const existingConv = currentConvs.find(c => c.id === activeConversationId);
                if (existingConv) {
                  return {
                    ...newConv,
                    unread: false,
                    unreadCount: 0
                  };
                }
              }
              return newConv;
            });

            return updatedConversations.sort((a: ConversationDisplay, b: ConversationDisplay) => {
              if (a.unread && !b.unread) return -1;
              if (!a.unread && b.unread) return 1;
              return 0;
            });
          });
        }
      } catch (error) {
        log('Error checking for new messages:', error);
      }
    };

    const interval = setInterval(checkForNewMessages, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasPendingNewMessage) {
      setHasPendingNewMessage(false);
    }
  }, [activeConversationId, hasPendingNewMessage]);

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
    <DashboardLayout title="Messaging">
      {loading || loadingMessages ? (
        <MessagingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-96px)] bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="md:col-span-4 border-r border-gray-200 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleConversationSelect}
              contacts={contacts}
            />
          </div>
          <div className="md:col-span-8 flex flex-col overflow-hidden">
            {renderMessageThread()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}