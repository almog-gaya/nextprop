'use client';

import React, { useState } from 'react';
import { UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Types for the component
interface Message {
  content: string;
  timestamp: Date;
  sender: 'user' | 'contact' | 'system' | 'ai';
}

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessage?: Message;
  lastActivity: Date;
  status: 'active' | 'archived' | 'scheduled';
  tags?: string[];
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
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

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  loading = false
}: ConversationListProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter conversations based on status and search term
  const filteredConversations = conversations.filter(conversation => {
    // Filter by status
    if (filterStatus === 'unread' && conversation.unreadCount === 0) return false;
    if (filterStatus === 'archived' && conversation.status !== 'archived') return false;
    if (filterStatus === 'all' && conversation.status === 'archived') return false;
    
    // Filter by search term
    if (searchTerm && !conversation.contactName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !conversation.phoneNumber.includes(searchTerm)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button 
            className="text-blue-600 text-sm font-medium"
            onClick={onNewConversation}
          >
            + New Message
          </button>
        </div>
        
        {/* Search and filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-4 mt-4">
          <button
            className={`text-sm font-medium ${filterStatus === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`text-sm font-medium ${filterStatus === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilterStatus('unread')}
          >
            Unread
          </button>
          <button
            className={`text-sm font-medium ${filterStatus === 'archived' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setFilterStatus('archived')}
          >
            Archived
          </button>
        </div>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {searchTerm ? 'No conversations match your search' : 'No conversations found'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedConversationId === conversation.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className={`font-medium ${conversation.unreadCount > 0 ? 'text-black font-semibold' : 'text-gray-900'}`}>
                        {conversation.contactName}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {conversation.phoneNumber}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(conversation.lastActivity)}
                </span>
              </div>
              
              <p className={`mt-2 text-sm ${conversation.unreadCount > 0 ? 'text-black font-medium' : 'text-gray-600'} truncate`}>
                {conversation.lastMessage?.sender === 'user' ? 'You: ' : ''}
                {conversation.lastMessage?.content}
              </p>
              
              {/* Tags */}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex mt-2 space-x-2">
                  {conversation.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 