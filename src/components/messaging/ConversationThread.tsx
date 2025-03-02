'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Types for the component
interface Message {
  id: string;
  conversationId: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'contact' | 'system' | 'ai';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: any[];
  isTemplate?: boolean;
  templateId?: string;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
}

interface ConversationThreadProps {
  contact: Contact;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
  onCallContact?: () => void;
  onOpenTemplates?: () => void;
  loading?: boolean;
}

// Format relative time for messages
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
};

// Group messages by date
const groupMessagesByDate = (messages: Message[]) => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages
  }));
};

export default function ConversationThread({
  contact,
  messages,
  onBack,
  onSendMessage,
  onCallContact,
  onOpenTemplates,
  loading = false
}: ConversationThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const groupedMessages = groupMessagesByDate(messages);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center">
        <button 
          className="md:hidden mr-2 text-gray-500"
          onClick={onBack}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
        </div>
        <div className="ml-3">
          <h3 className="font-medium text-gray-900">
            {contact.name}
          </h3>
          <p className="text-sm text-gray-500">
            {contact.phoneNumber}
          </p>
        </div>
        <div className="ml-auto flex space-x-3">
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onCallContact}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <div className="flex justify-center">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {new Date(group.date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {group.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'} flex justify-end`}>
                      {formatRelativeTime(message.timestamp)}
                      {message.sender === 'user' && (
                        <span className="ml-2">
                          {message.status === 'sending' && '• Sending'}
                          {message.status === 'sent' && '• Sent'}
                          {message.status === 'delivered' && '• Delivered'}
                          {message.status === 'read' && '• Read'}
                          {message.status === 'failed' && '• Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      
      {/* Message input */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex items-center">
          <button className="text-gray-500 hover:text-gray-700 mr-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700 mr-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700 mr-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
              onClick={handleSendMessage}
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <button 
            className="text-sm text-blue-600 font-medium"
            onClick={onOpenTemplates}
          >
            Use Template
          </button>
          <div className="text-xs text-gray-500">
            {newMessage.length} / 160 characters
          </div>
        </div>
      </div>
    </div>
  );
} 