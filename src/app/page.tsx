'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserGroupIcon, 
  HomeModernIcon, 
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Quick Action modal component
interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const QuickActionModal = ({ isOpen, onClose, title, children }: QuickActionModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  // Pipeline data
  const pipelineData = [
    { stage: 'Cold Leads', count: 145, color: 'bg-slate-500' },
    { stage: 'Warm Leads', count: 82, color: 'bg-indigo-500' },
    { stage: 'Hot Leads', count: 38, color: 'bg-red-500' },
    { stage: 'Negotiation', count: 25, color: 'bg-amber-500' },
    { stage: 'Contract', count: 12, color: 'bg-emerald-500' }
  ];
  
  // State for modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };
  
  const closeModal = () => {
    setActiveModal(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-500">Here's what's happening with your leads today.</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold mt-1">302</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Properties</p>
                <p className="text-2xl font-bold mt-1">125</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <HomeModernIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">New Leads (This Week)</p>
                <p className="text-2xl font-bold mt-1">24</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <BoltIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* Pipeline Distribution - Text-based */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Lead Pipeline</h2>
              <div className="text-xs text-gray-500">302 total</div>
            </div>
            
            <div className="space-y-3">
              {pipelineData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                  <div className="flex-grow text-sm">{item.stage}</div>
                  <div className="font-semibold text-sm">{item.count}</div>
                  <div className="ml-2 text-xs text-gray-400">
                    {Math.round(item.count / 302 * 100)}%
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/pipeline" className="text-sm text-blue-600 hover:underline flex items-center">
                View detailed pipeline
                <ArrowRightIcon className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
          
          {/* Urgent Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Urgent Actions</h2>
              <Link href="/tasks" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            
            <div className="space-y-3">
              {/* Unread messages */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <div className="font-medium">Unread Messages</div>
                    <div className="text-xs text-gray-500">18 messages awaiting your response</div>
                  </div>
                </div>
                <Link href="/messaging" className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100">
                  View
                </Link>
              </div>
              
              {/* New leads */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <BoltIcon className="h-5 w-5 text-amber-500 mr-3" />
                  <div>
                    <div className="font-medium">New Leads</div>
                    <div className="text-xs text-gray-500">12 new leads to follow up</div>
                  </div>
                </div>
                <Link href="/contacts?filter=new" className="px-3 py-1 bg-amber-50 text-amber-600 rounded-md text-sm hover:bg-amber-100">
                  View
                </Link>
              </div>
              
              {/* Properties without offers */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <HomeModernIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <div className="font-medium">No-Offer Properties</div>
                    <div className="text-xs text-gray-500">23 properties need offers</div>
                  </div>
                </div>
                <Link href="/properties?filter=no_offers" className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100">
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Messages - Expanded */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Messages</h3>
            <button 
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 rounded-full"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { name: 'Sarah Johnson', type: 'SMS', time: '10m', content: 'I\'m interested in the property at 123 Oak St. Can we schedule a viewing this week? I have some questions about the neighborhood and recent renovations.' },
              { name: 'Michael Brown', type: 'Voicemail', time: '1h', content: 'Left a voicemail asking about financing options for the property on Pine Road. Looking for information about down payment requirements and mortgage terms.' },
              { name: 'Emma Davis', type: 'SMS', time: '3h', content: 'Just confirming our appointment for tomorrow at 2pm to see the lakefront property. Should I meet you at the office or directly at the location?' },
              { name: 'Robert Williams', type: 'SMS', time: '5h', content: 'I\'ve reviewed the documents you sent. Everything looks good but I\'d like to discuss the closing timeline in more detail when you have a moment.' },
              { name: 'Jennifer Miller', type: 'Voicemail', time: '1d', content: 'Called about the property listing on Maple Avenue. Very interested but would like to know if the seller is flexible on the asking price.' }
            ].map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{activity.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activity.type === 'SMS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 mb-3">{activity.content}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal('quickReply')}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded"
                  >
                    Reply
                  </button>
                  <Link 
                    href={`/messaging?contact=${activity.name.replace(' ', '-').toLowerCase()}`}
                    className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    View Conversation
                  </Link>
                  {activity.type === 'Voicemail' && (
                    <button className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded">
                      Listen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <Link 
              href="/messaging" 
              className="block w-full py-2 bg-white border border-gray-300 rounded text-blue-600 text-center text-sm font-medium hover:bg-blue-50"
            >
              View All Messages
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Action Modals */}
      <QuickActionModal isOpen={activeModal === 'quickReply'} onClose={closeModal} title="Quick Reply">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipient</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Sarah Johnson</option>
              <option>Michael Brown</option>
              <option>Emma Davis</option>
              <option>Robert Williams</option>
              <option>Jennifer Miller</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message here..."
            ></textarea>
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send Message
            </button>
          </div>
        </div>
      </QuickActionModal>
    </DashboardLayout>
  );
}
