'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstantly } from '@/contexts/InstantlyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  EnvelopeIcon, 
  ArrowPathIcon, 
  PlayIcon, 
  PauseIcon,
  ChartBarIcon,
  UserGroupIcon,
  InboxIcon,
  CogIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Helper function to format campaign name by removing email tag
function formatCampaignName(name: string): string {
  // Check if the name has the email tag format [user@example.com]
  const emailTagRegex = /\[([^\]]+)\]\s*/;
  return name.replace(emailTagRegex, '');
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const { 
    selectedCampaign,
    campaignAnalytics,
    loading, 
    error, 
    fetchCampaign,
    fetchCampaignAnalytics,
    updateCampaign
  } = useInstantly();
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  useEffect(() => {
    if (campaignId) {
      fetchCampaign(campaignId);
      fetchCampaignAnalytics(campaignId);
    }
  }, [campaignId, fetchCampaign, fetchCampaignAnalytics]);
  
  const handleRefresh = () => {
    if (campaignId) {
      fetchCampaign(campaignId);
      fetchCampaignAnalytics(campaignId);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCampaign) return;
    
    setUpdatingStatus(true);
    try {
      await updateCampaign(selectedCampaign.id, { status: newStatus });
      // Refresh campaign data after status change
      await fetchCampaign(selectedCampaign.id);
    } catch (error) {
      console.error('Error updating campaign status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const getStatusButton = () => {
    if (!selectedCampaign) return null;
    
    const isPaused = selectedCampaign.status.toLowerCase() === 'paused';
    
    return isPaused ? (
      <button
        onClick={() => handleStatusChange('active')}
        disabled={updatingStatus}
        className="nextprop-outline-button flex items-center"
      >
        {updatingStatus ? (
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7c3aed] mr-2"></div>
        ) : (
          <PlayIcon className="h-4 w-4 mr-2" />
        )}
        Activate
      </button>
    ) : (
      <button
        onClick={() => handleStatusChange('paused')}
        disabled={updatingStatus}
        className="nextprop-outline-button flex items-center"
      >
        {updatingStatus ? (
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7c3aed] mr-2"></div>
        ) : (
          <PauseIcon className="h-4 w-4 mr-2" />
        )}
        Pause
      </button>
    );
  };
  
  // Tab content placeholders (to avoid UI component dependencies)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-[#1e1b4b] mb-4">Campaign Analytics</h3>
            <p className="text-gray-600 mb-4">
              View detailed performance metrics for this campaign.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-gray-500">Leads</p>
                <p className="text-2xl font-bold">{campaignAnalytics?.leads_count || 0}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold">{campaignAnalytics?.emails_sent_count || 0}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-gray-500">Open Rate</p>
                <p className="text-2xl font-bold">
                  {campaignAnalytics?.emails_sent_count 
                    ? `${((campaignAnalytics?.opens_count || 0) / campaignAnalytics.emails_sent_count * 100).toFixed(1)}%` 
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        );
      case 'leads':
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#1e1b4b]">Campaign Leads</h3>
              <button className="nextprop-outline-button">Add Lead</button>
            </div>
            <p className="text-gray-600 mb-4">
              View and manage leads for this campaign.
            </p>
            <div className="bg-white rounded border">
              <div className="p-4 text-center text-gray-500">
                <p>Lead management functionality is under development.</p>
              </div>
            </div>
          </div>
        );
      case 'emails':
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-[#1e1b4b] mb-4">Campaign Emails</h3>
            <p className="text-gray-600 mb-4">
              View emails sent from this campaign.
            </p>
            <div className="bg-white rounded border">
              <div className="p-4 text-center text-gray-500">
                <p>Email history functionality is under development.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-[#1e1b4b] mb-4">Campaign Settings</h3>
            <p className="text-gray-600 mb-4">
              Configure this campaign's settings.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input 
                  type="text" 
                  className="nextprop-input w-full"
                  value={formatCampaignName(selectedCampaign?.name || '')} 
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Limit
                </label>
                <input 
                  type="number" 
                  className="nextprop-input w-full"
                  value={selectedCampaign?.daily_limit} 
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum number of emails to send per day
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  if (loading.selectedCampaign && !selectedCampaign) {
    return (
      <DashboardLayout title="Campaign Details">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7c3aed] mb-4"></div>
              <p className="text-gray-600">Loading campaign details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout title="Campaign Details">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="nextprop-card border-red-300 bg-red-50 border-b-red-500">
            <p className="text-red-800">{error}</p>
            <Link 
              href="/emails" 
              className="nextprop-outline-button mt-4 inline-flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!selectedCampaign) {
    return (
      <DashboardLayout title="Campaign Details">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="nextprop-card bg-yellow-50 border-b-yellow-500">
            <p className="text-yellow-800">Campaign not found. The campaign may have been deleted or you may not have access to it.</p>
            <button 
              onClick={() => router.push('/emails')}
              className="nextprop-outline-button mt-4"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={`Campaign: ${formatCampaignName(selectedCampaign.name)}`}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-6 w-6 text-[#7c3aed]" />
              <h1 className="text-2xl font-bold text-[#1e1b4b]">{formatCampaignName(selectedCampaign.name)}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                selectedCampaign.status.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedCampaign.status}
              </span>
              <span className="text-sm text-gray-500">
                Created: {new Date(selectedCampaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {getStatusButton()}
            
            <button 
              onClick={handleRefresh} 
              disabled={loading.selectedCampaign}
              className="nextprop-outline-button flex items-center"
            >
              {loading.selectedCampaign ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7c3aed] mr-2"></div>
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
            
            <Link 
              href="/emails" 
              className="nextprop-outline-button flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Link>
          </div>
        </div>
        
        <div className="nextprop-card">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'analytics'
                    ? 'border-[#7c3aed] text-[#7c3aed]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics
              </button>
              
              <button
                className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'leads'
                    ? 'border-[#7c3aed] text-[#7c3aed]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('leads')}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Leads
              </button>
              
              <button
                className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'emails'
                    ? 'border-[#7c3aed] text-[#7c3aed]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('emails')}
              >
                <InboxIcon className="h-5 w-5 mr-2" />
                Emails
              </button>
              
              <button
                className={`mr-6 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'settings'
                    ? 'border-[#7c3aed] text-[#7c3aed]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                <CogIcon className="h-5 w-5 mr-2" />
                Settings
              </button>
            </nav>
          </div>
          
          <div className="py-6">
            {renderTabContent()}
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-8">
          <Link href="/emails" className="text-[#7c3aed] hover:underline">
            ← Back to Email Campaigns
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 