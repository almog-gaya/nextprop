'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationThread from '@/components/messaging/ConversationThread';

// Define types to match component expectations
type MessageSender = 'user' | 'contact' | 'system' | 'ai';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
type ConversationStatus = 'active' | 'archived' | 'scheduled';

// Mock data for development
const mockConversations = [
  {
    id: '1',
    contactId: '101',
    contactName: 'Michael Thompson',
    phoneNumber: '+1 (555) 123-4567',
    unreadCount: 3,
    lastMessage: {
      content: 'I\'m interested in selling my property on Oak Street. Is your offer still available?',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      sender: 'contact' as MessageSender,
    },
    lastActivity: new Date(Date.now() - 15 * 60000),
    status: 'active' as ConversationStatus,
    tags: ['pre-foreclosure', 'motivated'],
  },
  {
    id: '2',
    contactId: '102',
    contactName: 'Jessica Martinez',
    phoneNumber: '+1 (555) 987-6543',
    unreadCount: 0,
    lastMessage: {
      content: 'Great, I\'ll follow up with you next week to discuss the offer details.',
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      sender: 'user' as MessageSender,
    },
    lastActivity: new Date(Date.now() - 2 * 3600000),
    status: 'active' as ConversationStatus,
    tags: ['realtor', 'following-up'],
  },
  {
    id: '3',
    contactId: '103',
    contactName: 'David Wilson',
    phoneNumber: '+1 (555) 333-4444',
    unreadCount: 1,
    lastMessage: {
      content: 'Do you work with properties in the Westside area? I have a client looking to sell.',
      timestamp: new Date(Date.now() - 1 * 86400000), // 1 day ago
      sender: 'contact' as MessageSender,
    },
    lastActivity: new Date(Date.now() - 1 * 86400000),
    status: 'active' as ConversationStatus,
    tags: ['realtor', 'new-lead'],
  },
  {
    id: '4',
    contactId: '104',
    contactName: 'Sarah Johnson',
    phoneNumber: '+1 (555) 222-1111',
    unreadCount: 0,
    lastMessage: {
      content: 'Thanks for your interest. I\'ll review your situation and get back to you with options.',
      timestamp: new Date(Date.now() - 3 * 86400000), // 3 days ago
      sender: 'user' as MessageSender,
    },
    lastActivity: new Date(Date.now() - 3 * 86400000),
    status: 'archived' as ConversationStatus,
    tags: ['tax-lien', 'follow-up'],
  },
  {
    id: '5',
    contactId: '105',
    contactName: 'Robert Garcia',
    phoneNumber: '+1 (555) 777-8888',
    unreadCount: 0,
    lastMessage: {
      content: 'I received your voicemail. Can you tell me more about how your service works?',
      timestamp: new Date(Date.now() - 5 * 86400000), // 5 days ago
      sender: 'contact' as MessageSender,
    },
    lastActivity: new Date(Date.now() - 5 * 86400000),
    status: 'active' as ConversationStatus,
    tags: ['cold-lead', 'voicemail-response'],
  },
];

// Mock messages for a conversation
const mockMessages = [
  {
    id: 'm1',
    conversationId: '1',
    content: 'Hello! I saw your property on 123 Oak Street and I\'m interested in discussing a potential offer.',
    timestamp: new Date(Date.now() - 2 * 86400000), // 2 days ago
    sender: 'user' as MessageSender,
    status: 'read' as MessageStatus,
  },
  {
    id: 'm2',
    conversationId: '1',
    content: 'Who is this? How did you get my number?',
    timestamp: new Date(Date.now() - 2 * 86400000 + 30 * 60000), // 30 minutes after first message
    sender: 'contact' as MessageSender,
    status: 'read' as MessageStatus,
  },
  {
    id: 'm3',
    conversationId: '1',
    content: 'I\'m John from NextProp Real Estate. We specialize in helping homeowners in your area. I found your information through public property records.',
    timestamp: new Date(Date.now() - 2 * 86400000 + 45 * 60000), // 15 minutes after previous message
    sender: 'user' as MessageSender,
    status: 'read' as MessageStatus,
  },
  {
    id: 'm4',
    conversationId: '1',
    content: 'OK. I\'ve been thinking about selling. What kind of offer are you talking about?',
    timestamp: new Date(Date.now() - 1 * 86400000), // 1 day ago
    sender: 'contact' as MessageSender,
    status: 'read' as MessageStatus,
  },
  {
    id: 'm5',
    conversationId: '1',
    content: 'I\'d be happy to discuss that. Based on our initial assessment, we might be able to make a cash offer with a flexible closing timeline. Would you be available for a quick call tomorrow to discuss the details?',
    timestamp: new Date(Date.now() - 1 * 86400000 + 15 * 60000), // 15 minutes after previous message
    sender: 'user' as MessageSender,
    status: 'read' as MessageStatus,
  },
  {
    id: 'm6',
    conversationId: '1',
    content: 'I\'m interested in selling my property on Oak Street. Is your offer still available?',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    sender: 'contact' as MessageSender,
    status: 'read' as MessageStatus,
  },
];

export default function MessagingPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  // Handle sending a new message
  const handleSendMessage = (content: string) => {
    // In a real implementation, this would send the message to the API
    console.log('Sending message:', content);
  };
  
  // Handle creating a new conversation
  const handleNewConversation = () => {
    // In a real implementation, this would open a new conversation form
    console.log('Creating new conversation');
  };
  
  // Handle making a call
  const handleCallContact = () => {
    // In a real implementation, this would initiate a call
    console.log('Calling contact');
  };
  
  // Handle opening templates
  const handleOpenTemplates = () => {
    // In a real implementation, this would open the template selector
    console.log('Opening templates');
  };
  
  // Get selected contact info
  const selectedContact = selectedConversationId 
    ? {
        id: mockConversations.find(c => c.id === selectedConversationId)?.contactId || '',
        name: mockConversations.find(c => c.id === selectedConversationId)?.contactName || 'Unknown',
        phoneNumber: mockConversations.find(c => c.id === selectedConversationId)?.phoneNumber || '',
      }
    : null;

  return (
    <DashboardLayout title="Messaging">
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Conversation List - Left Side */}
        <div className={`w-full md:w-1/3 ${selectedConversationId ? 'hidden md:block' : 'block'}`}>
          <ConversationList
            conversations={mockConversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
        
        {/* Conversation Thread - Right Side */}
        <div className={`w-full md:w-2/3 bg-gray-50 ${!selectedConversationId ? 'hidden md:block' : 'block'}`}>
          {!selectedConversationId || !selectedContact ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                className="h-16 w-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-2">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          ) : (
            <ConversationThread
              contact={selectedContact}
              messages={mockMessages}
              onBack={() => setSelectedConversationId(null)}
              onSendMessage={handleSendMessage}
              onCallContact={handleCallContact}
              onOpenTemplates={handleOpenTemplates}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 