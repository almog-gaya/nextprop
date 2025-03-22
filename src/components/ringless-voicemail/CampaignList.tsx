import React from 'react';
import CampaignCard from './CampaignCard';

interface CampaignListProps {
  campaigns: any[];
  loading: boolean;
  error: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CampaignList({ campaigns, loading, error, onPause, onResume, onDelete }: CampaignListProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Current Campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">Manage your existing voicemail campaigns</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="spinner-border text-purple-500" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Loading campaigns...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No campaigns found. Create your first campaign above.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            const campaignStats = {
              totalContacts: campaign.total_contacts || 0,
              delivered: campaign.processed_contacts || 0,
              pending: (campaign.total_contacts || 0) - (campaign.processed_contacts || 0),
              failed: campaign.failed_contacts || 0,
            };
            return (
              <CampaignCard
                key={campaign.id || campaign._id}
                campaign={campaign}
                stats={campaignStats}
                onPause={() => onPause(campaign.id || campaign._id)}
                onResume={() => onResume(campaign.id || campaign._id)}
                onDelete={() => onDelete(campaign.id || campaign._id)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}