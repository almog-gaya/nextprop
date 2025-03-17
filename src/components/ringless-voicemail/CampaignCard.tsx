import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  PauseIcon, 
  PlayIcon, 
  XCircleIcon, 
  TrashIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from 'lucide-react';

interface CampaignCardProps {
  campaign: any;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function CampaignCard({ 
  campaign, 
  onPause, 
  onResume, 
  onCancel, 
  onDelete 
}: CampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    ((campaign.progress.sent + campaign.progress.failed) / campaign.progress.total) * 100
  );
  
  // Get time since creation
  const timeAgo = formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true });
  
  // Status badges
  const statusBadges = {
    active: <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>,
    paused: <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Paused</span>,
    completed: <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Completed</span>,
    cancelled: <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Cancelled</span>,
  };
  
  return (
    <li>
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-purple-700 font-medium">{campaign.name.substring(0, 2).toUpperCase()}</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
              <div className="text-sm text-gray-500">
                {timeAgo} • {campaign.progress.total} contacts
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {statusBadges[campaign.status as keyof typeof statusBadges]}
            
            <div className="flex items-center space-x-2">
              {campaign.status === 'active' && (
                <button
                  onClick={onPause}
                  className="p-1 rounded-full text-purple-600 hover:bg-purple-100"
                  title="Pause campaign"
                >
                  <PauseIcon className="h-5 w-5" />
                </button>
              )}
              
              {campaign.status === 'paused' && (
                <button
                  onClick={onResume}
                  className="p-1 rounded-full text-purple-600 hover:bg-purple-100"
                  title="Resume campaign"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              )}
              
              {(campaign.status === 'active' || campaign.status === 'paused') && (
                <button
                  onClick={onCancel}
                  className="p-1 rounded-full text-red-600 hover:bg-red-100"
                  title="Cancel campaign"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={onDelete}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                title="Delete campaign"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                title={isExpanded ? "Collapse details" : "Show details"}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-purple-600">
                  Progress: {completionPercentage}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-purple-600">
                  {campaign.progress.sent} sent • {campaign.progress.pending} pending • {campaign.progress.failed} failed
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-purple-200">
              <div
                style={{ width: `${completionPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
              ></div>
            </div>
          </div>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Settings */}
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Campaign Settings</h4>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Delay between voicemails: {campaign.delayMinutes} minutes</p>
                    <p>Daily limit: {campaign.dailyLimit} voicemails</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Script Preview</h4>
                  <div className="mt-2 text-sm text-gray-500 max-w-md truncate">
                    {campaign.script}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact list */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Status ({campaign.contacts.length})</h4>
              <div className="bg-white shadow overflow-hidden border border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaign.contacts.slice(0, 5).map((contact: any, index: number) => (
                      <tr key={contact.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {contact.status === 'delivered' && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1.5" />
                            )}
                            <span className={`text-sm ${
                              contact.status === 'delivered' ? 'text-green-600' :
                              contact.status === 'failed' ? 'text-red-600' :
                              contact.status === 'sending' ? 'text-blue-600' :
                              'text-gray-500'
                            }`}>
                              {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contact.scheduledTime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {campaign.contacts.length > 5 && (
                  <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
                    Showing 5 of {campaign.contacts.length} contacts
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
} 