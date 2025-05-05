'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { MessagingSkeleton } from '@/components/SkeletonLoaders';
import MessageThread from '@/components/conversation/MessageThread';
import ContactSidebar from '@/components/conversation/ContactSidebar';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationDisplay } from '@/types/messageThread';
import { ArrowLeft } from 'lucide-react';

export default function ContactConversationPage() {
  const { contactId } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({
    activeConversationId: null as string | null,
    activeConversation: null as ConversationDisplay | null,
    activeContactId: null as string | null,
    messages: [] as any[],
    loading: true,
    loadingMessages: false,
    lastMessageDate: null as number | null,
    messagesPerPage: 2,
    totalMessages: 0,
    hasMore: false,
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

  useEffect(() => {
    const searchContactAndLoadConversation = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        // Search for the contact by phone
        const response = await axios.get(`/api/contacts/search-by-phone?phone=${contactId}`);
        const contacts = response.data.contacts;

        if (!contacts || contacts.length === 0) {
          toast.error('Contact not found');
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get the first contact (since we know it's the only one)
        const contact = contacts[0];
        const conversationId = contact.lastConversationId;

        if (!conversationId) {
          toast.error('No conversation found for this contact');
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get conversation details
        const conversationDetails = await axios.get(`/api/conversations/${conversationId}/messages`);
        const conversation = conversationDetails.data;

        // Set the active conversation and load messages
        setState(prev => ({
          ...prev,
          activeConversationId: conversationId,
          activeContactId: contact.id,
          activeConversation: {
            id: conversationId,
            name: contact.contactName || contact.firstName || contact.email || contact.phone || 'Unknown Contact',
            avatar: (contact.contactName || contact.firstName || '').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            lastMessage: conversation.lastMessageBody || 'No messages yet',
            lastMessageBody: conversation.lastMessageBody || 'No messages yet',
            timestamp: conversation.lastMessageDate?.toString() || '',
            unread: conversation.unreadCount > 0,
            unreadCount: conversation.unreadCount || 0,
            contactId: contact.id,
            email: contact.email,
            phone: contact.phone,
            originalData: conversation,
            type: conversation.type,
            lastMessageType: conversation.lastMessageType,
            lastMessageDate: conversation.lastMessageDate,
            locationId: contact.locationId || '',
            fullName: contact.contactName || contact.firstName || '',
            contactName: contact.contactName || contact.firstName || '',
          },
          loading: false
        }));

        // Load messages for the conversation
        await fetchMessages(conversationId);
      } catch (error) {
        console.error('Error loading contact conversation:', error);
        toast.error('Failed to load conversation');
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    if (contactId) {
      searchContactAndLoadConversation();
    }
  }, [contactId]);

  const fetchMessages = async (conversationId: string, startAfterDate?: number, append = false) => {
    if (!conversationId) return;

    setState((prev) => ({ ...prev, loadingMessages: !append }));

    try {
      let url = `/api/conversations/${conversationId}/messages?limit=${state.messagesPerPage}`;
      if (startAfterDate) {
        url += `&startAfterDate=${startAfterDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data?.messages)) {
        const formattedMessages = data.messages.map((msg: any) => ({
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
        }));

        const reversedMessages = [...formattedMessages].reverse();

        const newLastDate = formattedMessages.length > 0
          ? Number(formattedMessages[formattedMessages.length - 1].dateAdded)
          : state.lastMessageDate;

        setState((prev) => {
          const newMessages = append
            ? [...reversedMessages, ...prev.messages]
            : reversedMessages;

          return {
            ...prev,
            messages: newMessages,
            lastMessageDate: newLastDate,
            totalMessages: data.total || newMessages.length,
            hasMore: formattedMessages.length > 0 && newMessages.length < (data.total || newMessages.length),
            loadingMessages: false,
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          messages: append ? prev.messages : [],
          loadingMessages: false,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setState(prev => ({
        ...prev,
        messages: append ? prev.messages : [],
        loadingMessages: false,
      }));
    }
  };

  const handleSendMessage = async (text: string, fromNumber?: string) => {
    if (!state.activeConversationId || !text) return;

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

    const getAppropriateType = (type: string) => {
      switch (type) {
        case 'TYPE_PHONE': return 'SMS';
        case 'TYPE_EMAIL':
        case 'TYPE_CUSTOM_EMAIL': return 'Email';
        default: return 'SMS';
      }
    };

    try {
      const currentContact = state.activeConversation;
      const messageType = getAppropriateType(currentContact?.lastMessageType ?? currentContact?.type ?? 'TYPE_PHONE');

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
            msg.id === tempId ? { ...msg, id: data.id || msg.id, status: 'sent' } : msg
          ),
        }));
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ),
      }));
      toast.error('Error sending message');
    }
  }

  if (state.loading) {
    return <MessagingSkeleton />;
  }

  if (!state.activeConversationId || !state.activeConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No conversation found</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Messaging">
      <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-96px)] bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Message Thread Section */}
        <div className="md:col-span-9 flex flex-col overflow-hidden">
          <div className="flex-1 flex justify-center overflow-y-auto">
            <div className="w-full h-full">
              <MessageThread
                activeConversation={state.activeConversation}
                messages={state.messages}
                onSendMessage={handleSendMessage}
                onLoadMore={(isRefresh) => {
                  if (isRefresh) {
                    // Refresh current messages
                    fetchMessages(state.activeConversationId!);
                  } else if (state.hasMore && state.lastMessageDate) {
                    // Load more messages
                    fetchMessages(state.activeConversationId!, state.lastMessageDate, true);
                  }
                }}
                hasMore={state.hasMore}
                loading={state.loadingMessages}
                selectedNumber={state.selectedNumber}
                phoneNumbers={user?.phoneNumbers || []}
              />
            </div>
          </div>
        </div>

        {/* Contact Details Column */}
        <div className="md:col-span-3 border-l border-gray-200 overflow-y-auto">
          <ContactSidebar contactId={state.activeContactId || ''} />
        </div>
      </div>
    </DashboardLayout>
  );
} 