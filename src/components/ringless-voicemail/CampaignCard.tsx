import React, { useEffect, useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  PhoneIcon,
  PhoneOffIcon,
  PhoneIncomingIcon,
  TrashIcon,
  XIcon,
  MessageCircleIcon,
  MessageCircleDashedIcon,
  MessageCircleOffIcon
} from 'lucide-react';
import StatsCard from '../StatsCard';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Types for campaign progress tracking
interface CampaignProgress {
  total: number;
  sent: number;
  delivered?: number;
  pending: number;
  failed: number;
  callbacks?: number;
}

// Contact interface
interface Contact {
  id?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  eta?: string;
  [key: string]: any; // For any additional fields
}

// Updated type to match API response
interface Campaign {
  id?: string;
  _id?: string; // API might return _id instead of id
  Name?: string;
  name?: string;
  status?: string;
  "Campaign Status"?: string;
  created_at?: string;
  progress?: CampaignProgress;
  Script?: string;
  script?: string;
  contacts?: any[];
  from_number?: string;
  "From Phone Numbers"?: string[];
  "Voice Clone IDs"?: string[];
  "Type of Campaign"?: string;
  "Sending Until"?: string;
  "Sending From"?: string;
  "Schedule Timezone"?: string;
  "Hourly Max Sending Rate"?: number;
  "Scheduled Days"?: string[];
  paused?: boolean;
  total?: number;
  processed_contacts?: number;
  failed_contacts?: number;
  total_contacts?: number;
}

// Update the CampaignCardProps interface
interface CampaignCardProps {
  campaign: Campaign;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  stats?: {
    totalContacts: number;
    delivered: number;
    pending: number;
    failed: number;
  };
  isVoiceMailModule: boolean;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};
interface EditingContact {
  id: string;
  field: 'name' | 'phone';
}
// Update the CampaignCard component
const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onPause, onResume, onDelete, stats, isVoiceMailModule }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [editingContact, setEditingContact] = useState<EditingContact | null>(null);
  const [editValues, setEditValues] = useState<{ firstName: string; lastName: string; phone: string }>({
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Handle either API response format or our local format
  const voicedropCampagin = campaign?.channels?.voicedrop;
  const smsCampaign = campaign?.channels?.sms;
  const id = campaign.id || campaign._id || '';
  const name = campaign.name || campaign.Name || 'Unnamed Campaign';
  const status = campaign.status || campaign["Campaign Status"]?.toLowerCase() || 'unknown';
  const isCampaignPaused = campaign.paused;
  const script =voicedropCampagin?.message || smsCampaign?.message;
  const fromPhone = voicedropCampagin?.from_number || smsCampaign?.from_number;
  const maxCallsPerHour = voicedropCampagin?.max_calls_per_hour || smsCampaign?.max_calls_per_hour;
  const intervalBetweenCalls = smsCampaign?.time_interval || voicedropCampagin?.time_interval;
  const dailyLimit = smsCampaign?.daily_limit || voicedropCampagin?.daily_limit;

  const isSmsCampaign = smsCampaign ? true : false;



  const renderFirestoreTimeStamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      /// ddmmyyyy hh:mm a
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return timestamp;
  };

  // If we have the old progress format, use it directly, otherwise construct progress from API data
  const progress = {
    total: stats?.totalContacts || 0,
    sent: stats?.delivered || 0,
    delivered: stats?.delivered || 0,
    pending: (campaign.total || 0) - (campaign.processed_contacts || 0),
    failed: stats?.failed || 0,
    callbacks: 0
  };

  // Calculate derived stats
  const deliveredCount = progress.delivered || progress.sent || 0;
  const failedCount = progress.failed || 0;
  const pendingCount = progress.pending || 0;

  const isCompleted = status === 'completed';
  const isPaused = status === 'paused' || status === 'Paused';
  const isCancelled = status === 'cancelled' || status === 'archived' || status === 'Archived';
  const isActive = status === 'active' || status === 'Active' || status === 'upload completed' || status === 'Upload Completed';

  const progressPercentage = progress.total > 0
    ? Math.floor((deliveredCount + failedCount) / progress.total * 100)
    : 0;

    // Add this state for script editing
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState('');

  // Add this function to handle script updates
  const updateCampaignScript = async () => {
    if (!id) return;

    try {
      const db = getFirestore();
      const campaignRef = doc(db, 'campaigns', id);

      await updateDoc(campaignRef, {
        message: editedScript
      });

      // Update local state
      campaign.message = editedScript;
      setIsEditingScript(false);

      // Show success notification or feedback here if needed
    } catch (error) {
      console.error("Error updating campaign script:", error);
      // Show error notification or feedback here if needed
    }
  };
  // Function to load contacts from Firebase
  const loadContacts = async () => {
    if (!id) return;

    setIsLoadingContacts(true);
    try {
      const db = getFirestore();
      const contactsRef = collection(db, `campaigns/${id}/contacts`);
      const contactsSnapshot = await getDocs(contactsRef);

      const contactsList: Contact[] = [];
      contactsSnapshot.forEach((doc) => {
        contactsList.push({ id: doc.id, ...doc.data() as Contact });
      });

      setContacts(contactsList);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on buttons
    if ((e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('summary')) {
      return;
    }
    setShowDetails(true);
    loadContacts(); // Load contacts when modal is opened
  };

  // Function to start editing a contact
  const startEditing = (contact: Contact, field: 'name' | 'phone') => {
    setEditingContact({ id: contact.id || '', field });
    setEditValues({
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      phone: contact.phone_number || contact.phone || ''
    });
  };

  // Function to save edited contact
  const saveEdit = async (contactId: string) => {
    if (!contactId || !editingContact) return;

    try {
      const db = getFirestore();
      const contactRef = doc(db, `campaigns/${id}/contacts`, contactId);

      if (editingContact.field === 'name') {
        await updateDoc(contactRef, {
          first_name: editValues.firstName,
          last_name: editValues.lastName
        });
      } else {
        await updateDoc(contactRef, {
          phone_number: editValues.phone
        });
      }

      // Update local state
      setContacts(contacts.map(contact =>
        contact.id === contactId
          ? {
            ...contact,
            first_name: editValues.firstName,
            last_name: editValues.lastName,
            phone_number: editValues.phone
          }
          : contact
      ));
      setEditingContact(null);
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  // Function to cancel editing
  const cancelEdit = () => {
    setEditingContact(null);
    setEditValues({ firstName: '', lastName: '', phone: '' });
  };

  // Add this helper function at the top level of the file
  const calculateCallCapacity = (
    maxCallsPerHour: number,
    timeWindow: { start: string; end: string },
    dailyLimit?: number
  ) => {
    if (!maxCallsPerHour || !timeWindow?.start || !timeWindow?.end) return null;

    // Calculate hours in time window
    const startTime = new Date(`2000-01-01T${timeWindow.start}`);
    const endTime = new Date(`2000-01-01T${timeWindow.end}`);
    const hoursInWindow = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Calculate total calls possible in time window
    const totalCallsInWindow = Math.floor(maxCallsPerHour * hoursInWindow);

    // If daily limit exists, use the smaller of the two
    const maxCalls = dailyLimit ? Math.min(totalCallsInWindow, dailyLimit) : totalCallsInWindow;

    return {
      maxCallsInWindow: totalCallsInWindow,
      maxCalls,
      hoursInWindow
    };
  };

  // In the CampaignCard component, add this before the return statement:
  const callCapacity = calculateCallCapacity(
    maxCallsPerHour,
    campaign.time_window,
    campaign.daily_limit
  );

  // Add these new state variables at the top of the component
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editedSettings, setEditedSettings] = useState({
    maxCallsPerHour: maxCallsPerHour || 30,
    intervalBetweenCalls: intervalBetweenCalls || 60,
    dailyLimit: campaign.daily_limit || '',
    timeWindow: campaign.time_window || { start: '09:00', end: '17:00' }
  });

  // Add this function to handle schedule updates
  const updateScheduleSettings = async () => {
    if (!id) return;

    try {
      const db = getFirestore();
      const campaignRef = doc(db, 'campaigns', id);

      const updateData: any = {
        daily_limit: editedSettings.dailyLimit ? Number(editedSettings.dailyLimit) : null,
        time_window: editedSettings.timeWindow
      };

      // Update the appropriate channel settings
      if (isSmsCampaign) {
        updateData['channels.sms.time_interval'] = Number(editedSettings.intervalBetweenCalls);
        updateData['channels.sms.max_calls_per_hour'] = Number(editedSettings.maxCallsPerHour);
      } else {
        updateData['channels.voicedrop.max_calls_per_hour'] = Number(editedSettings.maxCallsPerHour);
      }

      await updateDoc(campaignRef, updateData);

      // Update local state
      campaign.daily_limit = editedSettings.dailyLimit ? Number(editedSettings.dailyLimit) : null;
      campaign.time_window = editedSettings.timeWindow;
      if (isSmsCampaign) {
        smsCampaign.time_interval = Number(editedSettings.intervalBetweenCalls);
        smsCampaign.max_calls_per_hour = Number(editedSettings.maxCallsPerHour);
      } else {
        voicedropCampagin.max_calls_per_hour = Number(editedSettings.maxCallsPerHour);
      }

      setIsEditingSchedule(false);
    } catch (error) {
      console.error("Error updating schedule settings:", error);
    }
  };

  // Add this function to calculate real-time capacity
  const calculateRealTimeCapacity = () => {
    const hoursInWindow = (new Date(`2000-01-01T${editedSettings.timeWindow.end}`).getTime() -
                          new Date(`2000-01-01T${editedSettings.timeWindow.start}`).getTime()) / (1000 * 60 * 60);

    const totalInWindow = Math.floor(editedSettings.maxCallsPerHour * hoursInWindow);
    const maxCalls = editedSettings.dailyLimit ? Math.min(totalInWindow, Number(editedSettings.dailyLimit)) : totalInWindow;

    return {
      maxCallsInWindow: totalInWindow,
      maxCalls,
      hoursInWindow
    };
  };

  return (
    <>
      <li
        className="bg-white overflow-hidden border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="px-4 py-5 sm:px-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{name}</h3>
              <p className="mt-1 text-sm text-gray-500">
              {campaign.created_at ?
                            (typeof campaign.created_at === 'object' && 'seconds' in campaign.created_at) ?
                              formatDate(new Date(campaign.created_at.seconds * 1000).toISOString()) :
                              formatDate(campaign.created_at)
                            : 'N/A'}
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              {(!isCompleted && !isCancelled) && (
                <>
                  {isPaused || isCampaignPaused ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onResume(); }}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--nextprop-primary)] hover:bg-[var(--nextprop-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--nextprop-primary)]"
                    >
                      <PlayIcon className="-ml-1 mr-2 h-5 w-5" /> Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPause(); }}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      <PauseIcon className="-ml-1 mr-2 h-5 w-5" /> Pause
                    </button>
                  )}
                </>
              )}
              {(
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="-ml-1 mr-2 h-5 w-5" /> Delete
                </button>
              )}
            </div>
          </div>

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
                  style={{ width: `${Math.max(1, progressPercentage)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatsCard
              title="Total Contacts"
              value={stats?.totalContacts ?? campaign.total_contacts ?? 0}
              icon={
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
            <StatsCard
              title="Delivered"
              value={stats?.delivered ?? campaign.processed_contacts ?? 0}
              icon={isVoiceMailModule ? <PhoneIcon className="w-6 h-6" /> : <MessageCircleIcon className="w-6 h-6" />}

              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatsCard
              title="Pending"
              value={stats?.pending ??
                ((stats?.totalContacts ?? campaign.total_contacts ?? 0) -
                  (stats?.delivered ?? campaign.processed_contacts ?? 0))}
              icon={isVoiceMailModule ? <PhoneIncomingIcon className="w-6 h-6" /> : <MessageCircleDashedIcon className="w-6 h-6" />}

              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />
            <StatsCard
              title="Failed"
              value={stats?.failed ?? campaign.failed_contacts ?? 0}
              icon={isVoiceMailModule ? <PhoneOffIcon className="w-6 h-6" /> : <MessageCircleOffIcon className="w-6 h-6" />}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

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

            {(fromPhone ) && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <PhoneIcon className="h-3 w-3 mr-1" /> {fromPhone}
              </span>
            )}


            {campaign["Voice Clone IDs"] && Array.isArray(campaign["Voice Clone IDs"]) && campaign["Voice Clone IDs"].length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Voice Clone
              </span>
            )}
          </div>
        </div>
      </li>

      {showDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Campaign Progress */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Campaign Progress</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Contacts:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats?.totalContacts ?? campaign.total_contacts ?? 0}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-right text-gray-500">
                      {progressPercentage}% complete
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">Delivered</div>
                      <div className="text-lg font-semibold text-green-700">
                        {stats?.delivered ?? campaign.processed_contacts ?? 0}
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">Pending</div>
                      <div className="text-lg font-semibold text-yellow-700">
                        {stats?.pending ??
                          ((stats?.totalContacts ?? campaign.total_contacts ?? 0) -
                            (stats?.delivered ?? campaign.processed_contacts ?? 0))}
                      </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">Failed</div>
                      <div className="text-lg font-semibold text-red-700">
                        {stats?.failed ?? campaign.failed_contacts ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta data like script, createdAt, days, max calls per hour */}
              <div className="mt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Campaign Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Campaign Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Created At:</span>
                        <span className="text-sm text-gray-900">
                          {campaign.created_at ?
                            (typeof campaign.created_at === 'object' && 'seconds' in campaign.created_at) ?
                              formatDate(new Date(campaign.created_at.seconds * 1000).toISOString()) :
                              formatDate(campaign.created_at)
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Status:</span>
                        <span className="text-sm text-gray-900">
                          {campaign.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">From Phone:</span>
                        <span className="text-sm text-gray-900">
                          {fromPhone || 'N/A'}
                        </span>
                      </div>

                      {/* Add Call Capacity Information */}
                      {callCapacity && !isEditingSchedule && (
                        <>
                          <div className="pt-3 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500 block">{isSmsCampaign ? 'Message' : 'Call'} Capacity:</span>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Time Window Capacity:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {callCapacity.maxCallsInWindow} {isSmsCampaign ? 'messages' : 'calls'}
                                </span>
                              </div>
                              {campaign.daily_limit && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Daily Limit:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {campaign.daily_limit} {isSmsCampaign ? 'messages' : 'calls'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Effective Maximum:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {callCapacity.maxCalls} {isSmsCampaign ? 'messages' : 'calls'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Based on {maxCallsPerHour} {isSmsCampaign ? 'messages' : 'calls'} per hour over {callCapacity.hoursInWindow.toFixed(1)} hours
                                {campaign.daily_limit && ` (limited by ${callCapacity.maxCalls === campaign.daily_limit ? 'daily limit' : 'time window'})`}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Schedule Settings</h4>
                      {!isEditingSchedule ? (
                        <button
                          onClick={()=>{
                            if(isCompleted) {
                              toast.error('Campaign is completed, you cannot edit the settings', {
                                position: 'top-right',
                                duration: 5000,
                              } );
                              return;
                            }
                            setIsEditingSchedule(true);
                          }}
                          className="text-xs text-[var(--nextprop-primary)] hover:text-[var(--nextprop-primary-dark)] flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Settings
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={updateScheduleSettings}
                            className="text-xs text-green-600 hover:text-green-800 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingSchedule(false);
                              setEditedSettings({
                                maxCallsPerHour: maxCallsPerHour || 30,
                                intervalBetweenCalls: intervalBetweenCalls || 60,
                                dailyLimit: campaign.daily_limit || '',
                                timeWindow: campaign.time_window || { start: '09:00', end: '17:00' }
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {campaign.timezone && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">Timezone:</span>
                          <span className="text-sm text-gray-900">
                            {campaign.timezone}
                          </span>
                        </div>
                      )}

                      {isEditingSchedule ? (
                        <>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block">Time Window:</label>
                            <div className="flex space-x-2 mt-1">
                              <input
                                type="time"
                                value={editedSettings.timeWindow.start}
                                onChange={(e) => setEditedSettings({
                                  ...editedSettings,
                                  timeWindow: { ...editedSettings.timeWindow, start: e.target.value }
                                })}
                                className="border rounded px-2 py-1 text-sm w-32"
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <input
                                type="time"
                                value={editedSettings.timeWindow.end}
                                onChange={(e) => setEditedSettings({
                                  ...editedSettings,
                                  timeWindow: { ...editedSettings.timeWindow, end: e.target.value }
                                })}
                                className="border rounded px-2 py-1 text-sm w-32"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-500 block">
                              Max {isSmsCampaign ? 'Messages' : 'Calls'} Per Hour:
                            </label>
                            <input
                              type="number"
                              value={editedSettings.maxCallsPerHour}
                              onChange={(e) => setEditedSettings({
                                ...editedSettings,
                                maxCallsPerHour: Number(e.target.value)
                              })}
                              className="border rounded px-2 py-1 text-sm w-full mt-1"
                              min="1"
                            />
                          </div>

                          {isSmsCampaign && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 block">Interval (in seconds):</label>
                              <input
                                type="number"
                                value={editedSettings.intervalBetweenCalls}
                                onChange={(e) => setEditedSettings({
                                  ...editedSettings,
                                  intervalBetweenCalls: Number(e.target.value)
                                })}
                                className="border rounded px-2 py-1 text-sm w-full mt-1"
                                min="1"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-medium text-gray-500 block">Daily Limit (optional):</label>
                            <input
                              type="number"
                              value={editedSettings.dailyLimit}
                              onChange={(e) => setEditedSettings({
                                ...editedSettings,
                                dailyLimit: e.target.value
                              })}
                              className="border rounded px-2 py-1 text-sm w-full mt-1"
                              min="1"
                              placeholder="No limit"
                            />
                          </div>

                          {/* Real-time capacity preview */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500 block">Preview Capacity:</span>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Time Window Capacity:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {calculateRealTimeCapacity().maxCallsInWindow} {isSmsCampaign ? 'messages' : 'calls'}
                                </span>
                              </div>
                              {editedSettings.dailyLimit && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Daily Limit:</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {editedSettings.dailyLimit} {isSmsCampaign ? 'messages' : 'calls'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Effective Maximum:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {calculateRealTimeCapacity().maxCalls} {isSmsCampaign ? 'messages' : 'calls'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Based on {editedSettings.maxCallsPerHour} {isSmsCampaign ? 'messages' : 'calls'} per hour over {calculateRealTimeCapacity().hoursInWindow.toFixed(1)} hours
                                {editedSettings.dailyLimit && ` (limited by ${calculateRealTimeCapacity().maxCalls === Number(editedSettings.dailyLimit) ? 'daily limit' : 'time window'})`}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {maxCallsPerHour && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 block">
                                Max {isSmsCampaign ? 'Messages' : 'Calls'} Per Hour:
                              </span>
                              <span className="text-sm text-gray-900">
                                {maxCallsPerHour}
                              </span>
                            </div>
                          )}

                          {intervalBetweenCalls && isSmsCampaign && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 block">Interval (in seconds):</span>
                              <span className="text-sm text-gray-900">
                                {intervalBetweenCalls}
                              </span>
                            </div>
                          )}

                          {campaign.daily_limit && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 block">Daily Limit:</span>
                              <span className="text-sm text-gray-900">
                                {campaign.daily_limit} {isSmsCampaign ? 'messages' : 'calls'}
                              </span>
                            </div>
                          )}

                          {campaign.time_window && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 block">Time Window:</span>
                              <span className="text-sm text-gray-900">
                                {campaign.time_window.start} - {campaign.time_window.end}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {script && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Campaign Script</h4>
                      {!isEditingScript ? (
                        <button
                          onClick={() => {
                            setEditedScript(script);
                            setIsEditingScript(true);
                          }}
                          className="text-xs text-[var(--nextprop-primary)] hover:text-[var(--nextprop-primary-dark)] flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Script
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={updateCampaignScript}
                            className="text-xs text-green-600 hover:text-green-800 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingScript(false)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingScript ? (
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        <textarea
                          value={editedScript}
                          onChange={(e) => setEditedScript(e.target.value)}
                          className="w-full h-40 text-sm text-gray-700 border-0 focus:ring-0 focus:outline-none resize-none"
                          placeholder="Enter campaign script..."
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700 max-h-40 overflow-y-auto">
                        {script}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contact List */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contacts</h3>
                {isLoadingContacts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                             {/* ETA */}
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ETA
                            </th>

                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>

                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contacts.map((contact) => (
                            <tr key={contact.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingContact?.id === contact.id && editingContact.field === 'name' ? (
                                  <div className="flex space-x-2">
                                    <input
                                      type="text"
                                      value={editValues.firstName}
                                      onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value })}
                                      className="border rounded px-2 py-1 text-sm w-24"
                                      placeholder="First Name"
                                    />
                                    <input
                                      type="text"
                                      value={editValues.lastName}
                                      onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value })}
                                      className="border rounded px-2 py-1 text-sm w-24"
                                      placeholder="Last Name"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-medium">{contact.first_name || ''} {contact.last_name || ''}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingContact?.id === contact.id && editingContact.field === 'phone' ? (
                                  <input
                                    type="text"
                                    value={editValues.phone}
                                    onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder="Phone Number"
                                  />
                                ) : (
                                  contact.phone_number || contact.phone || ''
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${contact.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    contact.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'}`}>
                                  {contact.status || 'pending'}
                                </span>
                              </td>
                              {/* ETA */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {renderFirestoreTimeStamp(contact.eta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingContact?.id === contact.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => saveEdit(contact.id || '')}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingContact(null)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => startEditing(contact, 'name')}
                                      className="text-[var(--nextprop-primary)] hover:text-[var(--nextprop-primary-dark)]"
                                    >
                                      Edit Name
                                    </button>
                                    <button
                                      onClick={() => startEditing(contact, 'phone')}
                                      className="text-[var(--nextprop-primary)] hover:text-[var(--nextprop-primary-dark)]"
                                    >
                                      Edit Phone
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-md p-4 text-center text-gray-500">
                    No contacts found for this campaign
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                {(!isCompleted && !isCancelled) && (
                  <>
                    {isPaused || isCampaignPaused ? (
                      <button
                        type="button"
                        onClick={onResume}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--nextprop-primary)] hover:bg-[var(--nextprop-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--nextprop-primary)]"
                      >
                        <PlayIcon className="-ml-1 mr-2 h-5 w-5" /> Resume Campaign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onPause}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <PauseIcon className="-ml-1 mr-2 h-5 w-5" /> Pause Campaign
                      </button>
                    )}
                  </>
                )}
                {(isCompleted || isCancelled) && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="-ml-1 mr-2 h-5 w-5" /> Delete Campaign
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignCard;