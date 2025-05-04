'use client';

import React, { useEffect } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeftIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CampaignAnalyticsPage() {
  const { campaigns, campaignAnalytics, loading, error, fetchCampaigns, fetchCampaignAnalytics } = useInstantly();

  useEffect(() => {
    fetchCampaigns();
    fetchCampaignAnalytics();
  }, [fetchCampaigns, fetchCampaignAnalytics]);

  const handleRefresh = () => {
    fetchCampaigns();
    fetchCampaignAnalytics();
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  // For simplicity, we'll just show overall stats
  const totalStats = {
    campaigns: campaigns.length,
    leads: campaigns.reduce((sum, campaign) => {
      const analytics = Array.isArray(campaignAnalytics) 
        ? campaignAnalytics.find(a => a.campaign_id === campaign.id) 
        : campaignAnalytics?.campaign_id === campaign.id ? campaignAnalytics : null;
      
      return sum + (analytics?.leads_count || 0);
    }, 0),
    emails: campaigns.reduce((sum, campaign) => {
      const analytics = Array.isArray(campaignAnalytics) 
        ? campaignAnalytics.find(a => a.campaign_id === campaign.id) 
        : campaignAnalytics?.campaign_id === campaign.id ? campaignAnalytics : null;
      
      return sum + (analytics?.emails_sent_count || 0);
    }, 0),
    opens: campaigns.reduce((sum, campaign) => {
      const analytics = Array.isArray(campaignAnalytics) 
        ? campaignAnalytics.find(a => a.campaign_id === campaign.id) 
        : campaignAnalytics?.campaign_id === campaign.id ? campaignAnalytics : null;
      
      return sum + (analytics?.opens_count || 0);
    }, 0),
    replies: campaigns.reduce((sum, campaign) => {
      const analytics = Array.isArray(campaignAnalytics) 
        ? campaignAnalytics.find(a => a.campaign_id === campaign.id) 
        : campaignAnalytics?.campaign_id === campaign.id ? campaignAnalytics : null;
      
      return sum + (analytics?.replies_count || 0);
    }, 0),
  };

  return (
    <DashboardLayout title="Campaign Analytics">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1e1b4b]">Campaign Analytics</h1>
            <p className="text-gray-600">
              Overview of your email campaign performance
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh} 
              disabled={loading.campaigns || loading.analytics}
              className="nextprop-outline-button flex items-center"
            >
              {(loading.campaigns || loading.analytics) ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#7c3aed] mr-2"></span>
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
              Back to Campaigns
            </Link>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="nextprop-card">
            <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">
              Total Campaigns
            </h3>
            <div className="text-3xl font-bold text-[#1e1b4b]">{totalStats.campaigns}</div>
          </div>
          
          <div className="nextprop-card">
            <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">
              Total Leads
            </h3>
            <div className="text-3xl font-bold text-[#1e1b4b]">{totalStats.leads}</div>
          </div>
          
          <div className="nextprop-card">
            <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">
              Total Emails Sent
            </h3>
            <div className="text-3xl font-bold text-[#1e1b4b]">{totalStats.emails}</div>
          </div>
          
          <div className="nextprop-card">
            <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">
              Total Opens
            </h3>
            <div className="text-3xl font-bold text-[#1e1b4b]">{totalStats.opens}</div>
          </div>
        </div>

        <div className="nextprop-card">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-full bg-purple-100 text-[#7c3aed] mr-4">
              <ChartBarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1e1b4b] text-lg">Performance Metrics</h3>
              <p className="text-gray-600 text-sm">Key metrics across all your campaigns</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Open Rate</p>
              <p className="text-2xl font-bold text-[#1e1b4b]">{calculateRate(totalStats.opens, totalStats.emails)}</p>
              <p className="text-xs text-gray-500">Percentage of emails that were opened</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Reply Rate</p>
              <p className="text-2xl font-bold text-[#1e1b4b]">{calculateRate(totalStats.replies, totalStats.emails)}</p>
              <p className="text-xs text-gray-500">Percentage of emails that received replies</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Emails per Lead</p>
              <p className="text-2xl font-bold text-[#1e1b4b]">
                {totalStats.leads > 0 ? (totalStats.emails / totalStats.leads).toFixed(1) : '0'}
              </p>
              <p className="text-xs text-gray-500">Average number of emails sent per lead</p>
            </div>
          </div>
        </div>
        
        {/* Link back to campaigns */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <Link href="/emails" className="text-[#7c3aed] hover:underline">
            ← Back to Email Campaigns
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 