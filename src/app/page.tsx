'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import {
  HomeIcon,
  UserGroupIcon,
  PhoneIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { DashboardStats, Contact, Opportunity } from '@/types';
import AutomatedCallForm, { CallData } from '@/components/AutomatedCallForm';
import CallLogsList, { CallLog } from '@/components/CallLogsList';
import { makeAutomatedCall, getRecentCallLogs } from '@/lib/callService';
import { StatsCardSkeleton, TableSkeleton, CallLogsSkeleton, CallFormSkeleton } from '@/components/SkeletonLoaders';

// Mock data for initial render
const initialStats: DashboardStats = {
  totalContacts: 0,
  totalOpportunities: 0,
  totalCalls: 0,
  totalPipelines: 0,
};

export default function Home() {
  // Data states
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);
  
  // Loading states for individual components
  const [statsLoading, setStatsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [callsLoading, setCallsLoading] = useState(true);
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch pipelines
        setStatsLoading(true);
        const pipelinesRes = await axios.get('/api/pipelines');
        const pipelinesData = pipelinesRes.data.pipelines || [];
        
        // Fetch contacts
        setContactsLoading(true);
        const contactsRes = await axios.get('/api/contacts');
        const contactsData = contactsRes.data.contacts || [];
        setRecentContacts(contactsData.slice(0, 5));
        setContactsLoading(false);
        
        // Fetch opportunities from first pipeline if available
        setOpportunitiesLoading(true);
        let opportunitiesData: any[] = [];
        if (pipelinesData.length > 0) {
          const opportunitiesRes = await axios.get(`/api/pipelines/${pipelinesData[0].id}/opportunities`);
          opportunitiesData = opportunitiesRes.data.opportunities || [];
          setRecentOpportunities(opportunitiesData.slice(0, 5));
        }
        setOpportunitiesLoading(false);
        
        // Fetch recent call logs
        setCallsLoading(true);
        const callLogsData = getRecentCallLogs();
        setRecentCalls(callLogsData);
        setCallsLoading(false);
        
        // Update stats
        setStats({
          totalContacts: contactsData.length,
          totalOpportunities: opportunitiesData.length,
          totalCalls: callLogsData.length,
          totalPipelines: pipelinesData.length,
        });
        setStatsLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to fetch dashboard data');
        setStatsLoading(false);
        setContactsLoading(false);
        setOpportunitiesLoading(false);
        setCallsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Handle automated call submission
  const handleCallSubmit = async (callData: CallData) => {
    setIsSubmittingCall(true);
    try {
      const newCall = await makeAutomatedCall(callData);
      setRecentCalls(prev => [newCall, ...prev].slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalCalls: prev.totalCalls + 1
      }));
    } catch (error) {
      console.error('Error submitting call:', error);
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // Render error notification if there's an error
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 mb-6">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout title="Dashboard">
      {renderError()}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Contacts"
              value={stats.totalContacts}
              icon={<UserGroupIcon className="h-6 w-6" />}
              href="/contacts"
            />
            <StatsCard
              title="Total Opportunities"
              value={stats.totalOpportunities}
              icon={<ChartBarIcon className="h-6 w-6" />}
              href="/opportunities"
            />
            <StatsCard
              title="Ringless Voicemails"
              value={stats.totalCalls}
              icon={<PhoneIcon className="h-6 w-6" />}
              href="/calls"
            />
            <StatsCard
              title="Total Pipelines"
              value={stats.totalPipelines}
              icon={<HomeIcon className="h-6 w-6" />}
              href="/pipelines"
            />
          </>
        )}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Recent data */}
        <div className="lg:col-span-2">
          {/* Recent Contacts */}
          <div className="dashboard-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="dashboard-card-title">Recent Contacts</h2>
              <a href="/contacts" className="text-sm text-[#7c3aed] hover:underline">View All</a>
            </div>
            
            {contactsLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : recentContacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{contact.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{contact.email || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{contact.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags && contact.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No contacts found.</p>
            )}
          </div>
          
          {/* Recent Opportunities */}
          <div className="dashboard-card mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="dashboard-card-title">Recent Opportunities</h2>
              <a href="/opportunities" className="text-sm text-[#7c3aed] hover:underline">View All</a>
            </div>
            
            {opportunitiesLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : recentOpportunities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOpportunities.map((opportunity) => (
                      <tr key={opportunity.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{opportunity.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${opportunity.monetaryValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            opportunity.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {opportunity.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {opportunity.contact?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No opportunities found.</p>
            )}
          </div>
        </div>
        
        {/* Right Column - Automated Calls */}
        <div className="lg:col-span-1">
          {/* Call Form - always show form, no skeleton needed */}
          <AutomatedCallForm 
            onCallSubmit={handleCallSubmit} 
            isLoading={isSubmittingCall} 
          />
          
          <div className="mt-6">
            {callsLoading ? (
              <CallLogsSkeleton />
            ) : (
              <CallLogsList
                calls={recentCalls}
                isLoading={false}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
