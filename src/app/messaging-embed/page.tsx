'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { MessagingSkeleton } from '@/components/SkeletonLoaders';
import { Conversation, ConversationDisplay, Message } from '@/types/messageThread';
import MessageThread from '@/components/conversation/MessageThread';
import ConversationList from '@/components/conversation/ConversationList';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NewConversationCreator } from '@/components/conversation/NewConversationStarter';

const ENABLE_VERBOSE_LOGGING = true;

const log = (message: string, data?: any) => {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

function MessagingContent() {
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');
  const { user } = useAuth();

  const [state, setState] = useState({
    activeConversationId: null as string | null,
    messages: [] as any[],
    conversations: [] as ConversationDisplay[],
    contacts: [] as any[],
    loading: true,
    loadingConversations: false,
    loadingMessages: false,
    messagesPage: null as string | null,
    hasMoreMessages: false,
    hasPendingNewMessage: false,
    activeTab: 'all' as 'unread' | 'recents' | 'all',
    sortOrder: 'desc' as 'asc' | 'desc',
    showSortDropdown: false,
    pendingNewContactId: contactIdParam,
    creatingConversation: false,
    selectedNumber: null as string | null,
  });

  useEffect(() => {
    if ((user?.phoneNumbers?.length ?? 0) > 0) {
      const defaultNumber = user?.phoneNumbers?.find(num => num.isDefaultNumber);
      setState(prev => ({
        ...prev,
        selectedNumber: defaultNumber?.phoneNumber || null
      }));
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string, pageToken?: string, append = false) => {
    if (!conversationId) return;

    setState((prev) => ({ ...prev, loadingMessages: !append }));

    try {
      let url = `/api/conversations/${conversationId}/messages`;
      if (pageToken) url += `?page=${pageToken}`;

      log(`Fetching messages for conversation: ${conversationId}`);
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data?.messages)) {
        const formattedMessages =


          data.messages
            .map((msg: Message) => {
              return (

                {
                  id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                  senderId: msg.direction === 'inbound' ? 'client' : 'user',
                  text: msg.body || msg.text || msg.meta?.email?.subject || msg.activity?.data.name || '[No message content]',
                  timestamp: msg.dateAdded
                    ? new Date(msg.dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Recent',
                  dateAdded: msg.dateAdded || new Date().toISOString(),
                  status: msg.status,
                  direction: msg.direction,
                  messageType: msg.messageType,
                  activity: msg.activity,
                  meta: msg.meta,
                  attachments: msg.attachments,
                  type: msg.type,
                  altId: msg.altId,
                });
            })
            .sort((a: any, b: any) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

        setState((prev) => {
          const newMessages = append ? [...formattedMessages, ...prev.messages] : formattedMessages;
          const latestMessage = formattedMessages[formattedMessages.length - 1];
          const shouldUpdateConversation = latestMessage && prev.conversations.some((conv) =>
            conv.id === conversationId && conv.lastMessage !== latestMessage.text
          );

          return {
            ...prev,
            messages: newMessages,
            hasMoreMessages: !!data.nextPage,
            messagesPage: data.lastMessageId || null,
            loadingMessages: false,
            conversations: shouldUpdateConversation
              ? prev.conversations.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, lastMessage: latestMessage.text, lastMessageBody: latestMessage.text }
                  : conv
              )
              : prev.conversations,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          messages: append ? prev.messages : [],
          loadingMessages: false,
          conversations: prev.conversations.map((conv) =>
            conv.id === conversationId && prev.messages.length === 0 && !append
              ? { ...conv, lastMessage: 'No messages yet', lastMessageBody: "No messages yet" }
              : conv
          ),
        }));
      }
    } catch (error) {
      log('Failed to fetch messages:', error);
      setState((prev) => ({
        ...prev,
        messages: append ? prev.messages : [],
        loadingMessages: false,
      }));
    }
  }, []);

  const loadMoreMessages = useCallback((isRefresh = false) => {
    if (!state.activeConversationId || (state.loadingMessages && !isRefresh)) return;

    if (isRefresh) {
      fetchMessages(state.activeConversationId);
    } else if (state.messagesPage) {
      fetchMessages(state.activeConversationId, state.messagesPage, true);
    }
  }, [state.activeConversationId, state.loadingMessages, state.messagesPage, fetchMessages]);


  const getActiveConversationType = useCallback(() => {
    const conversation = state.conversations.find((conv) => conv.id === state.activeConversationId);
    return {
      type: conversation?.type || null,
      lastMessageType: conversation?.lastMessageType || null
    };
  }, [state.conversations, state.activeConversationId]);

  const getActiveConversation = useCallback(() => {
    const conversation = state.conversations.find((conv) => conv.id === state.activeConversationId);
    return conversation;
  }, [state.conversations, state.activeConversationId]);

  const handleSendMessage = useCallback(async (text: string, fromNumber?: string) => {
    if (!state.activeConversationId || !text) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      senderId: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateAdded: new Date().toISOString(),
      status: 'sending',
      direction: 'outbound',
      messageType: 'text',
    };

    setState((prev) => {
      const updatedConversations = prev.conversations.map((conv) => {
        if (conv.id === prev.activeConversationId) {
          return { ...conv, lastMessage: text, lastMessageBody: text, timestamp: 'Just now' };
        }
        return conv;
      });
      const index = updatedConversations.findIndex((conv) => conv.id === prev.activeConversationId);
      if (index > 0) {
        const [conversation] = updatedConversations.splice(index, 1);
        updatedConversations.unshift(conversation);
      }
      return { ...prev, messages: [...prev.messages, tempMessage], conversations: updatedConversations };
    });

    const getAppropriateType = (type: string) => {
      switch (type) {
        case 'TYPE_PHONE':
          return 'SMS';
        case 'TYPE_EMAIL':
        case 'TYPE_CUSTOM_EMAIL':
          return 'Email';
        default:
          return 'SMS';
      }
    };

    try {
      function getConvoType(convo: ConversationDisplay) {
        /// if phone and email both are available go for lastMessageType ?? type
        /// if phone is available only return Sms
        /// if email is avialable only return Email
        if (convo.email && convo.phone) {
          return convo.lastMessageType ?? convo.type;
        } else if (convo.email) {
          return 'TYPE_EMAIL'
        } else {
          return 'TYPE_PHONE'
        }

      }
      const currentContact = state.conversations.find((conv) => conv.id === state.activeConversationId);
      const messageType = getAppropriateType(getConvoType(currentContact!)!);

      const payload = {
        conversationId: state.activeConversationId,
        type: messageType,
        body: text,
        text,
        message: text,
        contactId: currentContact?.contactId || '',
        ...(messageType === 'SMS' && {
          toNumber: currentContact!.phone,
          fromNumber: fromNumber,
        }),
        ...(messageType === 'Email' && {
          html: text,
          emailTo: currentContact!.email,
          subject: "",
          emailFrom: 'no-reply@gmail.com',
        }),
      };

      const response = await fetch(
        messageType === 'Email' ? `/api/conversations/messages` :
          `/api/conversations/${state.activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: data.id || msg.id, status: 'sent' }
              : msg
          ),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === tempId
              ? { ...msg, status: 'failed' }
              : msg
          ),
        }));
        toast.error('Failed to send message');
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === tempId
            ? { ...msg, status: 'failed' }
            : msg
        ),
      }));
      toast.error('Error sending message');
    }
  }, [state.activeConversationId, getActiveConversationType]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    log('Marking conversation as read:', conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, unread: false, originalData: { ...conv.originalData, unreadCount: 0 } }
              : conv
          ),
        }));
      }
    } catch (error) {
      log('Failed to mark conversation as read:', error);
    }
  }, []);

  const handleConversationSelect = useCallback((id: string) => {
    if (id === state.activeConversationId) return;

    log('Selecting conversation:', id);
    setState((prev) => {
      const conversation = prev.conversations.find((conv) => conv.id === id);
      if (conversation?.unread) {
        markConversationAsRead(id);
      }
      return {
        ...prev,
        activeConversationId: id,
        messages: [],
        messagesPage: null,
        loadingMessages: true,
      };
    });
  }, [state.activeConversationId, markConversationAsRead]);

  const handleNumberSelect = useCallback((number: string) => {
    setState(prev => ({
      ...prev,
      selectedNumber: number
    }));
  }, []);

  const activeConversation = useMemo(() => {
    return state.conversations.find((conv) => conv.id === state.activeConversationId) || null;
  }, [state.activeConversationId, state.conversations]);

  const ContactNotFoundMessage = () => {
    if (!state.pendingNewContactId) return null;

    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">No Conversation Found</h3>
          <p className="mb-4">
            There's no existing conversation with this contact.
            Conversations cannot be created at this time.
          </p>
          <p className="text-sm text-gray-400">
            Contact ID: {state.pendingNewContactId}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    log('Message Embed rendered');

    const fetchInitialData = async () => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const [convResponse, contactsResponse] = await Promise.all([
          fetch(`/api/conversations?status=all&sort=desc&sortBy=last_message_date`),
          axios.get('/api/contacts'),
        ]);

        const convData = await convResponse.json();
        const contactsData = contactsResponse.data;

        if (Array.isArray(convData?.conversations)) {
          const formattedConversations = convData.conversations.map((conv: Conversation) => {
            const name = conv.fullName || conv.contactName || conv.email || conv.phone || 'Unknown Contact';
            const initials = name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);


            return {
              id: conv.id,
              name,
              avatar: initials,
              lastMessage: conv.lastMessageBody || 'No messages yet',
              timestamp: 'Recent',
              unread: conv.unreadCount > 0,
              contactId: conv.contactId,
              email: conv.email,
              phone: conv.phone,
              originalData: conv,
              type: conv.type,
              lastMessageType: conv.lastMessageType,
            };
          }).sort((a: ConversationDisplay, b: ConversationDisplay) =>
            (a.unread && !b.unread ? -1 : !a.unread && b.unread ? 1 : 0)
          );

          const contacts = Array.isArray(contactsData?.contacts) ? contactsData.contacts : [];

          let matchingConversation = null;
          if (contactIdParam) {
            matchingConversation = formattedConversations.find(
              (conv: ConversationDisplay) => conv.contactId === contactIdParam
            );
          }

          setState((prev) => ({
            ...prev,
            conversations: formattedConversations,
            contacts,
            activeConversationId: matchingConversation ? matchingConversation.id :
              (formattedConversations.length > 0 ? formattedConversations[0].id : null),
            pendingNewContactId: matchingConversation ? null : contactIdParam,
            loading: false,
            creatingConversation: false
          }));
        } else {
          setState((prev) => ({
            ...prev,
            conversations: [],
            contacts: Array.isArray(contactsData?.contacts) ? contactsData.contacts : [],
            pendingNewContactId: contactIdParam,
            loading: false,
            creatingConversation: false
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          conversations: [],
          contacts: [],
          loading: false,
          creatingConversation: false
        }));
      }
    };

    fetchInitialData();
  }, [contactIdParam]);

  useEffect(() => {
    if (state.activeConversationId) {
      fetchMessages(state.activeConversationId);
    }
  }, [state.activeConversationId, fetchMessages]);
  const handleConversationCreated = useCallback((newConversation: ConversationDisplay) => {
    setState((prev) => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      activeConversationId: newConversation.id,
      pendingNewContactId: null,
      creatingConversation: false,
    }));
  }, []);
  const renderMessageThread = useMemo(() => {
    if (state.pendingNewContactId) {
      return (
        <NewConversationCreator
          contactId={state.pendingNewContactId}
          onConversationCreated={handleConversationCreated}
        />
      );
    }

    if (!state.activeConversationId) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p>Choose a contact from the left to start chatting.</p>
          </div>
        </div>
      );
    }

    if (!activeConversation) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
            <p>The selected conversation could not be loaded.</p>
          </div>
        </div>
      );
    }

    if (state.loadingMessages && state.messages.length === 0) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading messages...</h3>
            <p>Retrieving your conversation history.</p>
          </div>
        </div>
      );
    }

    return (
      <MessageThread
        activeConversation={activeConversation}
        onSendMessage={handleSendMessage}
        messages={state.messages}
        onLoadMore={loadMoreMessages}
        hasMore={state.hasMoreMessages}
        loading={state.loadingMessages}
        selectedNumber={state.selectedNumber}
        phoneNumbers={user?.phoneNumbers || []}
        onNumberSelect={handleNumberSelect}
      />
    );
  }, [
    state.activeConversationId,
    activeConversation,
    handleSendMessage,
    state.messages,
    loadMoreMessages,
    state.hasMoreMessages,
    state.loadingMessages,
    state.pendingNewContactId,
    state.selectedNumber,
    user?.phoneNumbers,
    handleNumberSelect
  ]);

  const fetchConversations = useCallback(async (tab: 'unread' | 'recents' | 'all', sortOrder: 'asc' | 'desc') => {
    setState((prev) => ({ ...prev, loadingConversations: true }));
    try {
      const tabMapping = {
        unread: 'unread',
        recents: 'recent',
        all: 'all',
      };

      const status = tabMapping[tab] || 'all';
      const response = await fetch(`/api/conversations?status=${status}&sort=${sortOrder}&sortBy=last_message_date`);
      const data = await response.json();

      if (Array.isArray(data?.conversations)) {
        const formattedConversations = data.conversations.map((conv: Conversation) => {
          const name = conv.fullName || conv.contactName || conv.email || conv.phone || 'Unknown Contact';
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          return {
            id: conv.id,
            name,
            avatar: initials,
            lastMessage: conv.lastMessageBody || 'No messages yet',
            timestamp: 'Recent',
            unread: conv.unreadCount > 0,
            contactId: conv.contactId,
            email: conv.email,
            phone: conv.phone,
            originalData: conv,
            type: conv.type,
            lastMessageType: conv.lastMessageType,
          };
        }).sort((a: any, b: any) => (a.unread && !b.unread ? -1 : !a.unread && b.unread ? 1 : 0));

        setState((prev) => {
          const isEqual = prev.conversations.length === formattedConversations.length &&
            prev.conversations.every((prevConv, index) =>
              prevConv.id === formattedConversations[index].id &&
              prevConv.lastMessage === formattedConversations[index].lastMessage &&
              prevConv.unread === formattedConversations[index].unread
            );
          return isEqual ? { ...prev, loadingConversations: false } : {
            ...prev,
            conversations: formattedConversations,
            loadingConversations: false,
          };
        });
      } else {
        setState((prev) => ({ ...prev, conversations: [], loadingConversations: false }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, loadingConversations: false }));
    }
  }, []);

  const ConversationFilters = () => (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div className="flex space-x-1">
        {['All', 'Unread', 'Recents'].map((tab) => {
          const tabValue = tab.toLowerCase() as 'unread' | 'recents' | 'all';
          return (
            <button
              key={tab}
              onClick={() => {
                setState((prev) => ({ ...prev, activeTab: tabValue }));
                fetchConversations(tabValue, state.sortOrder);
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${state.activeTab === tabValue
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <button
          onClick={() => setState((prev) => ({ ...prev, showSortDropdown: !prev.showSortDropdown }))}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          Sort
          <ChevronDown className="w-5 h-5 ml-1" />
        </button>

        {state.showSortDropdown && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setState((prev) => ({ ...prev, showSortDropdown: false }))}
            />
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-100">
              {['Newest First', 'Oldest First'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    const newSortOrder = option === 'Newest First' ? 'desc' : 'asc';
                    setState((prev) => ({
                      ...prev,
                      sortOrder: newSortOrder,
                      showSortDropdown: false,
                    }));
                    fetchConversations(state.activeTab, newSortOrder);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    const checkForNewMessages = async () => {
      if (state.loading || state.loadingConversations) return;

      try {
        const response = await fetch('/api/conversations?status=all&sort=desc&sortBy=last_message_date');
        const data = await response.json();

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
              originalData: conv,
            };
          });

          const hasNewUnreadMessages = newConversations.some((newConv: ConversationDisplay) => {
            const existingConv = state.conversations.find((conv) => conv.id === newConv.id);
            return (
              newConv.unread &&
              (!existingConv || newConv.unreadCount > (existingConv?.unreadCount || 0))
            );
          });

          if (hasNewUnreadMessages) {
            toast.info('You have new unread messages', {
              description: 'Check your conversations for new messages',
              duration: 4000,
            });
            setState((prev) => ({ ...prev, hasPendingNewMessage: true }));
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch((e) => log('Could not play notification sound', e));
            } catch (e) {
              log('Audio not supported');
            }
          }

          setState((prev) => {
            const updatedConversations = newConversations.map((newConv: ConversationDisplay) => {
              if (newConv.id === state.activeConversationId) {
                return { ...newConv, unread: false, unreadCount: 0 };
              }
              return newConv;
            });
            const isEqual = prev.conversations.length === updatedConversations.length &&
              prev.conversations.every((prevConv, index) =>
                prevConv.id === updatedConversations[index].id &&
                prevConv.lastMessage === updatedConversations[index].lastMessage &&
                prevConv.unread === updatedConversations[index].unread
              );
            return isEqual ? prev : {
              ...prev,
              conversations: updatedConversations.sort((a: any, b: any) => (a.unread && !b.unread ? -1 : !a.unread && b.unread ? 1 : 0)),
            };
          });
        }
      } catch (error) {
        log('Error checking for new messages:', error);
      }
    };

    const interval = setInterval(checkForNewMessages, 120000);
    return () => clearInterval(interval);
  }, [state.loading, state.loadingConversations, state.activeConversationId, state.conversations]);

  useEffect(() => {
    if (state.hasPendingNewMessage) {
      setState((prev) => ({ ...prev, hasPendingNewMessage: false }));
    }
  }, [state.activeConversationId, state.hasPendingNewMessage]);

  const LoadingState = () => (
    <div className="h-[calc(100vh-96px)] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2 text-gray-900">
          {state.creatingConversation ? 'Creating conversation...' : 'Loading messages...'}
        </h3>
        <p className="text-gray-500 max-w-md">
          {state.creatingConversation
            ? 'We\'re setting up your conversation. This will just take a moment.'
            : 'Loading your conversation history. Please wait.'}
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Messaging">
      {state.loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-96px)] bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="md:col-span-4 border-r border-gray-200 overflow-y-auto">
            <ConversationFilters />
            <div className="overflow-y-auto">
              {state.conversations.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  {state.activeTab === 'unread' && (
                    <p>No unread messages</p>
                  )}
                  {state.activeTab === 'recents' && (
                    <p>No recent messages</p>
                  )}
                  {state.activeTab === 'all' && (
                    <p>No messages</p>
                  )}
                </div>
              ) : (
                <ConversationList
                  conversations={state.conversations}
                  activeId={state.activeConversationId}
                  onSelect={handleConversationSelect}
                  contacts={state.contacts}
                />
              )}
            </div>
          </div>
          <div className="md:col-span-8 flex flex-col overflow-hidden">
            {renderMessageThread}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function MessagingEmbedPage() {
  return (
    <Suspense fallback={<MessagingSkeleton />}>
      <MessagingContent />
    </Suspense>
  );
}