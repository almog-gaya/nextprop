'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { EnvelopeIcon, ArrowPathIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Prevent excessive API calls with throttling
function useThrottledEffect(callback: () => void, delay: number) {
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        callback();
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);
}

// Helper function to format campaign name by removing email tag
function formatCampaignName(name: string): string {
  // Check if the name has the email tag format [user@example.com]
  const emailTagRegex = /\[([^\]]+)\]\s*/;
  return name.replace(emailTagRegex, '');
}

export default function EmailsPage() {
  const { campaigns, loading, error, fetchCampaigns } = useInstantly();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const router = useRouter();
  
  // Ensure campaigns is always an array
  const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
  
  // Throttle the fetch calls to prevent excessive API requests
  // This will ensure we don't make more than 1 call per 5 seconds
  useEffect(() => {
    const now = Date.now();
    // Only fetch if it's been at least 5 seconds since the last fetch
    if (now - lastFetchTime > 5000) {
      fetchCampaigns();
      setLastFetchTime(now);
    }
  }, [fetchCampaigns, lastFetchTime]);

  useEffect(() => {
    if (campaignsArray.length > 0) {
      setFilteredCampaigns(
        campaignsArray.filter((campaign) =>
          campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredCampaigns([]);
    }
  }, [campaignsArray, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRefresh = () => {
    const now = Date.now();
    // Only allow manual refresh if it's been at least 2 seconds since the last fetch
    if (now - lastFetchTime > 2000) {
      fetchCampaigns();
      setLastFetchTime(now);
    }
  };

  const getCampaignStatusClass = (status: string | number) => {
    // Convert to string to handle both numeric and string statuses
    const statusStr = typeof status === 'number' 
      ? mapNumericStatus(status) 
      : status.toString().toLowerCase();
      
    switch (statusStr) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to map numeric status to string status
  const mapNumericStatus = (statusCode: number): string => {
    switch (statusCode) {
      case 1:
        return 'active';
      case 2:
        return 'paused';
      case 3:
        return 'completed';
      case 0:
        return 'draft';
      default:
        return 'unknown';
    }
  };
  
  // Function to display the campaign status in a user-friendly way
  const getCampaignStatusText = (status: string | number): string => {
    if (typeof status === 'number') {
      return mapNumericStatus(status);
    }
    
    // If already a string, just return it capitalized for display
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Show loading state if needed
  if (loading.campaigns && filteredCampaigns.length === 0) {
    return (
      <DashboardLayout title="Email Campaigns">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7c3aed] mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <DashboardLayout title="Email Campaigns">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="nextprop-card border-red-300 bg-red-50 border-b-red-500">
            <p className="text-red-800">{error}</p>
            <p className="mt-4">
              Please check your Instantly API key configuration and try again.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Email Campaigns">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1e1b4b]">Email Campaigns</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh} 
              disabled={loading.campaigns || (Date.now() - lastFetchTime < 2000)}
              className="nextprop-outline-button flex items-center"
            >
              {loading.campaigns ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7c3aed] mr-2"></div>
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
            
            <button 
              onClick={() => router.push('/emails/create-campaign')} 
              className="nextprop-button flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Campaign
            </button>
          </div>
        </div>
        
        <div className="nextprop-card mb-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-purple-100 text-[#7c3aed] mr-4">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1e1b4b] text-lg">Manage Campaigns</h3>
              <p className="text-gray-600 text-sm">View and manage your email campaigns</p>
            </div>
          </div>

          <div className="mb-4 mt-6">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={handleSearch}
              className="nextprop-input w-full md:w-1/3"
            />
          </div>
          
          {filteredCampaigns.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">No campaigns found</p>
              <p className="text-sm mt-1">Create a new campaign to get started</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg">
                {filteredCampaigns.map((campaign, index) => (
                  <div 
                    key={campaign.id}
                    className={`block p-4 ${
                      index !== filteredCampaigns.length - 1 ? 'border-b border-gray-200' : ''
                    } hover:bg-gray-100 transition-colors rounded-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => router.push(`/emails/campaigns/${campaign.id}`)}
                      >
                        <div className="flex-shrink-0">
                          <EnvelopeIcon className="h-6 w-6 text-[#7c3aed]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#1e1b4b]">{formatCampaignName(campaign.name)}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getCampaignStatusClass(campaign.status)}`}>
                              {getCampaignStatusText(campaign.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Created: {formatDate(campaign.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Link 
                          href={`/emails/campaigns/analytics`} 
                          className="text-[#7c3aed] hover:underline text-sm font-medium mr-4"
                        >
                          <ChartBarIcon className="h-5 w-5 inline-block mr-1" />
                          Analytics
                        </Link>
                        <button
                          onClick={() => handleRefresh()}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <span className="sr-only">Refresh campaign</span>
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="nextprop-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-600 text-sm uppercase">Total Campaigns</h3>
              <EnvelopeIcon className="h-5 w-5 text-[#7c3aed]" />
            </div>
            <p className="text-3xl font-bold text-[#1e1b4b] mt-2">{campaignsArray.length}</p>
          </div>
          
          <div className="nextprop-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-600 text-sm uppercase">Active Campaigns</h3>
              <EnvelopeIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-[#1e1b4b] mt-2">
              {campaignsArray.filter(campaign => 
                typeof campaign.status === 'string' 
                  ? campaign.status.toLowerCase() === 'active' 
                  : campaign.status === 1
              ).length}
            </p>
          </div>
          
          <div className="nextprop-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-600 text-sm uppercase">Paused Campaigns</h3>
              <EnvelopeIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-[#1e1b4b] mt-2">
              {campaignsArray.filter(campaign => 
                typeof campaign.status === 'string' 
                  ? campaign.status.toLowerCase() === 'paused' 
                  : campaign.status === 2
              ).length}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 