import React from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  PhoneIcon, 
  PhoneXIcon,
  PhoneIncomingIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon
} from 'lucide-react';

// Types for campaign progress tracking
interface CampaignProgress {
  total: number;
  sent: number;
  delivered?: number;
  pending: number;
  failed: number;
  callbacks?: number;
}

// Types for campaign data
interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  progress: CampaignProgress;
  script: string;
  contacts: any[];
  fromPhone?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onPause, onResume, onCancel, onDelete }) => {
  const { id, name, status, createdAt, progress, script, contacts } = campaign;
  
  // Calculate derived stats
  const deliveredCount = progress.delivered || progress.sent || 0;
  const callbackCount = progress.callbacks || 
    contacts.filter(c => c.status === 'callback_received').length || 0;
  const failedCount = progress.failed || 0;
  const pendingCount = progress.pending || 0;
  
  const isCompleted = status === 'completed';
  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';
  const isActive = status === 'active';
  
  const progressPercentage = progress.total > 0 
    ? Math.floor((deliveredCount + failedCount) / progress.total * 100) 
    : 0;
  
  return (
    <li className="bg-white overflow-hidden border-b border-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Created on {formatDate(createdAt)}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {!isCompleted && !isCancelled && (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <PlayIcon className="-ml-1 mr-2 h-5 w-5" /> Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPause}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <PauseIcon className="-ml-1 mr-2 h-5 w-5" /> Pause
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCancel}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircleIcon className="-ml-1 mr-2 h-5 w-5" /> Cancel
                </button>
              </>
            )}
            {(isCompleted || isCancelled) && (
              <button
                type="button"
                onClick={onDelete}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="-ml-1 mr-2 h-5 w-5" /> Delete
              </button>
            )}
          </div>
        </div>
        
        {/* Campaign Status */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Progress</h4>
            <span className="text-sm text-gray-500">
              {deliveredCount + failedCount} of {progress.total} Sent ({progressPercentage}%)
            </span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${(deliveredCount / progress.total) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
              <div
                style={{ width: `${(failedCount / progress.total) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
              ></div>
            </div>
          </div>
        </div>
        
        {/* Campaign Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-gray-50 rounded-md p-3 flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500">Scheduled</p>
              <p className="text-sm font-semibold">{progress.total}</p>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-md p-3 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500">Delivered</p>
              <p className="text-sm font-semibold">{deliveredCount}</p>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-md p-3 flex items-center">
            <PhoneXIcon className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500">Failed</p>
              <p className="text-sm font-semibold">{failedCount}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-md p-3 flex items-center">
            <PhoneIncomingIcon className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500">Callbacks</p>
              <p className="text-sm font-semibold">{callbackCount}</p>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${isActive ? 'bg-green-100 text-green-800' : ''}
              ${isPaused ? 'bg-yellow-100 text-yellow-800' : ''}
              ${isCompleted ? 'bg-blue-100 text-blue-800' : ''}
              ${isCancelled ? 'bg-red-100 text-red-800' : ''}
            `}
          >
            {isActive && 'Active'}
            {isPaused && 'Paused'}
            {isCompleted && 'Completed'}
            {isCancelled && 'Cancelled'}
          </span>
          
          {campaign.fromPhone && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <PhoneIcon className="h-3 w-3 mr-1" /> {campaign.fromPhone}
            </span>
          )}
        </div>
        
        {/* Script Preview (collapsed by default) */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <details className="text-sm">
            <summary className="text-sm font-medium text-purple-600 cursor-pointer">
              View Script
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-gray-600 text-sm">
              {script}
            </p>
          </details>
        </div>
      </div>
    </li>
  );
};

export default CampaignCard; 