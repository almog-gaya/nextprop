'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { 
  XIcon, 
  PlayIcon, 
  PauseIcon, 
  PhoneIcon,
  FileTextIcon
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CampaignCard from '@/components/ringless-voicemail/CampaignCard';
import CampaignSettingsForm from '@/components/ringless-voicemail/CampaignSettingsForm';
import BulkUploadForm from '@/components/BulkUploadForm';

export default function RinglessVoicemailPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    delayMinutes: 5,
    dailyLimit: 50,
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    timezone: "EST (New York)",
    maxPerHour: 100,
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  });
  
  // Contact management state
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalContacts, setTotalContacts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const loaderRef = useRef(null);
  
  // Script and voice clone state
  const [script, setScript] = useState('');
  const [voiceClones, setVoiceClones] = useState<any[]>([]);
  const [selectedVoiceClone, setSelectedVoiceClone] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<any>(null);
  
  // Modal state
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Constants
  const CONTACTS_PER_PAGE = 10;
  
  // Stats derived from campaigns
  const stats = {
    totalContacts: campaigns.reduce((acc, campaign) => acc + (campaign.progress?.total || 0), 0),
    delivered: campaigns.reduce((acc, campaign) => acc + (campaign.progress?.sent || 0), 0),
    pending: campaigns.reduce((acc, campaign) => acc + (campaign.progress?.pending || 0), 0),
    failed: campaigns.reduce((acc, campaign) => acc + (campaign.progress?.failed || 0), 0),
    activeCampaigns: campaigns.filter(c => c.status === 'active' || c["Campaign Status"] === 'Active').length
  };

  useEffect(() => {
    fetchCampaigns();
    fetchPhoneNumbers();
    fetchVoiceClones();
    
    // Set up polling to refresh campaign data every 30 seconds
    const interval = setInterval(fetchCampaigns, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Debug log to see if campaigns are being loaded
    console.log("Current campaigns state:", campaigns);
  }, [campaigns]);
  
  // Initial fetch
  useEffect(() => {
    console.log('Initial fetch triggered');
    fetchContacts(true);
  }, []);

  // Handle search reset
  useEffect(() => {
    if (searchQuery) {
      console.log('Search query changed, resetting:', searchQuery);
      setContacts([]);
      setCurrentPage(1);
      setTotalContacts(0);
      fetchContacts(true);
    } else {
      // Reset to full list if search is cleared
      setContacts([]);
      setCurrentPage(1);
      setTotalContacts(0);
      fetchContacts(true);
    }
  }, [searchQuery]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && contacts.length < totalContacts) {
          console.log('Fetching page:', currentPage);
          fetchContacts();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [contacts.length, totalContacts, isFetching, currentPage]);

  // Fetch contacts with pagination and optional search
  const fetchContacts = async (reset = false) => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      const pageToFetch = reset ? 1 : currentPage;
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: CONTACTS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }), // Add search param if supported by API
      });

      console.log('Fetching contacts with params:', params.toString());
      const response = await axios.get(`/api/contacts?${params.toString()}`);
      const newContacts = response.data.contacts || [];
      const total = response.data.total || 0;

      const processedContacts = newContacts.map((contact: any) => ({
        ...contact,
        name: contact.contactName || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
      }));

      setContacts((prev) => (reset ? processedContacts : [...prev, ...processedContacts]));
      setTotalContacts(total);

      if (newContacts.length > 0 && newContacts.length === CONTACTS_PER_PAGE) {
        setCurrentPage(pageToFetch + 1);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsFetching(false);
    }
  };

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const response = await axios.get('/api/voicemail/campaigns');
      
      // Use the API response data directly
      setCampaigns(response.data);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaign data');
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPhoneNumbers() {
    try {
      const response = await axios.get('/api/voicemail/phone-numbers');
      setPhoneNumbers(response.data.numbers || []);
      if (response.data.numbers && response.data.numbers.length > 0) {
        setSelectedPhoneNumber(response.data.numbers[0]);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
      setPhoneNumbers([]);
      setSelectedPhoneNumber(null);
    }
  }
  
  async function fetchVoiceClones() {
    try {
      const response = await axios.get('/api/voicemail/voice-clones');
      
      // Use the API response data
      setVoiceClones(response.data);
    } catch (error) {
      console.error('Error fetching voice clones:', error);
      toast.error('Failed to load voice clones');
      
      // Use default voice clones
      const defaultVoiceClones = [
        { id: "61EQ2khjAy41AXCqUSSS", name: "Cecilia" },
        { id: "Es45QkMNPudcZKVRZWPs", name: "Rey" },
        { id: "dodUUtwsqo09HrH2RO8w", name: "Default Voice" }
      ];
      
      setVoiceClones(defaultVoiceClones);
    }
  }

  async function handleCampaignAction(id: string, action: string) {
    try {
      const response = await axios.patch('/api/voicemail/campaigns', { id, action });
      
      // Update the campaign in our state
      setCampaigns(prev => 
        prev.map(campaign => 
          (campaign.id === id || campaign._id === id) ? response.data : campaign
        )
      );
      
      // Show success message
      const actionMessages: {[key: string]: string} = {
        pause: 'Campaign paused',
        resume: 'Campaign resumed',
        cancel: 'Campaign cancelled'
      };
      
      toast.success(actionMessages[action] || 'Campaign updated');
    } catch (error) {
      console.error(`Error ${action} campaign:`, error);
      toast.error(`Failed to ${action} campaign`);
    }
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/voicemail/campaigns?id=${id}`);
      
      // Remove the campaign from our state
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id && campaign._id !== id));
      
      toast.success('Campaign deleted');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  }

  async function handleUpdateSettings(newSettings: any) {
    setSettings(newSettings);
    toast.success('Settings saved');
  }
  
  const toggleContact = (contact: any) => {
    setSelectedContacts((prev) =>
      prev.some((c) => c.id === contact.id) ? prev.filter((c) => c.id !== contact.id) : [...prev, contact]
    );
  };
  
  const generateDefaultScript = () => {
    setScript(
      `Hi {{first_name}}, this is ${user?.firstName || user?.name || 'Adforce'} from NextProp. I noticed you might be interested in properties in your area. I've got some great listings on {{street_name}} that match your criteria. Call me back when you have a chance and we can discuss your needs. Thanks!`
    );
  };
  
  const handleBulkUpload = async (contacts: any) => {
    setIsSubmitting(true);
    try {
      let selectedPipelineId = null;
      let selectedStageId = null;
      const uploadResults = await Promise.all(
        contacts.map(async (contact: any) => {
          try {
            selectedPipelineId = contact.pipelineId;
            selectedStageId = contact.stageId;
            const response = await axios.post('/api/contacts', {
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone,
              address1: contact.street,
              city: contact.city,
              state: contact.state,
              email: contact.email,
              source: 'bulk_upload',
              postalCode: contact.zipCode,
            });
            return { success: true, contact: response.data.contact };
          } catch (error) {
            console.warn(`Failed to upload contact "${contact.firstName || contact.phone}":`, error);
            return { success: false, contact: null };
          }
        })
      );

      const successfulUploads = uploadResults.filter((result) => result.success);
      const processedContacts = successfulUploads.map((result) => result.contact);
      setContacts((prev) => [...processedContacts, ...prev]);
      setTotalContacts((prev) => prev + successfulUploads.length);
      setSelectedContacts(processedContacts);

      toast.success(`${successfulUploads.length} contacts added successfully`);
      setIsBulkUploadModalOpen(false);
      if (selectedPipelineId && selectedStageId) {
        addContactsToPipeline(selectedPipelineId, selectedStageId, processedContacts);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContactsToPipeline = async (pipelineId: string, stageId: string, contacts: any[]) => {
    try {
      const results = await Promise.allSettled(
        contacts.map(async (contact: any) => {
          try {
            const response = await fetch('/api/opportunities', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pipelineId: pipelineId,
                pipelineStageId: stageId,
                contactId: contact.id,
                status: "open",
                name: `${contact.firstName} ${contact.zipCode || contact.street || contact.city || contact.state || ' - bulk'}`.trim()
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { contact, success: true };
          } catch (error) {
            console.error(`Failed to add contact ${contact.id} to pipeline:`, error);
            return { contact, success: false, error };
          }
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      if (failed.length > 0) {
        toast.error(`${failed.length} contacts failed to add to pipeline`);
      }

      if (successful.length > 0) {
        toast.success(`${successful.length} contacts added to pipeline successfully`);
      }

      return { successful, failed };
    } catch (error) {
      console.error('Unexpected error in addContactsToPipeline:', error);
      toast.error('An unexpected error occurred while adding contacts to pipeline');
      return { successful: [], failed: contacts.map(contact => ({ contact, success: false, error })) };
    }
  };

  // Add contacts to an existing campaign
  const addContactsToCampaign = async (campaignId: string) => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    
    // Find the campaign to get its details
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) {
      toast.error('Campaign not found. Please refresh and try again.');
      return;
    }
    
    console.log(`Adding ${selectedContacts.length} contacts to campaign:`, campaign);
    
    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedContacts.map(async (contact: any) => {
          try {
            console.log(`CON-TACK`, JSON.stringify(contact))
            // Format contact data for the API
            const contactData = {
              campaignId: campaignId, // Use the campaign ID
              id: contact.id,
              firstName: contact.firstName || contact.contactName || '',
              lastName: contact.lastName || '',
              phone: contact.phone,
              streetName: contact.address1 || 'your area',
              ...(contact.city && { city: contact.city }),
              ...(contact.state && { state: contact.state }),
              ...(contact.postalCode && { zip: contact.postalCode }),
              ...(contact.email && { email: contact.email })
            };
            
            console.log(`Adding contact to campaign:`, contactData);
            
            // Add contact to campaign using the /api/voicemail endpoint
            const result = await axios.post('/api/voicemail', contactData);
            
            return { contact, success: true, result: result.data };
          } catch (error) {
            console.error(`Failed to add contact ${contact.id} to campaign:`, error);
            return { contact, success: false, error };
          }
        })
      );
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);
      
      if (successful.length > 0) {
        toast.success(`Added ${successful.length} contacts to campaign "${campaign.Name}"`);
        // Clear selection after successful addition
        setSelectedContacts([]);
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to add ${failed.length} contacts to campaign`);
      }
      
      // Refresh campaigns to show updated stats
      fetchCampaigns();
      
    } catch (error) {
      console.error('Error adding contacts to campaign:', error);
      toast.error('Failed to add contacts to campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Ringless Voicemails">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Ringless Voicemails
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Send personalized voicemails to multiple contacts with controlled delivery schedules.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href="/ringless-voicemails/manual"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Manual Voicemail
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalContacts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Delivered</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.delivered}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.pending}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.activeCampaigns}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Contact Selection */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Contacts for Campaign</h3>
                
                {/* Bulk Upload Modal */}
                {isBulkUploadModalOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setIsBulkUploadModalOpen(false)}
                  >
                    <div
                      className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BulkUploadForm onContactsSelect={handleBulkUpload} isLoading={isSubmitting} />
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Step 1: Find Contacts</h4>
                  
                  <div className="flex space-x-2 mb-3">
                    <div className="flex-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search contacts by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <XIcon
                          className={`h-5 w-5 text-gray-400 hover:text-gray-500 cursor-pointer ${!searchQuery && 'hidden'}`}
                          onClick={() => setSearchQuery('')}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsBulkUploadModalOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Search for existing contacts or upload new ones in bulk
                  </p>
                </div>

                <div className="border border-gray-200 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-gray-700 px-4 py-2 bg-gray-50 border-b">
                    Step 2: Select Contacts ({contacts.length} available)
                  </h4>
                
                  {/* Contact List */}
                  <div className="overflow-hidden">
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {contacts.length > 0 ? contacts.map((contact) => (
                        <li
                          key={contact.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                            selectedContacts.some(c => c.id === contact.id) ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => toggleContact(contact)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.firstName || contact.contactName || 'Unnamed'} {contact.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{contact.phone || 'No phone'}</p>
                            {contact.address1 && (
                              <p className="text-xs text-gray-500 truncate">{contact.address1}</p>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked={selectedContacts.some(c => c.id === contact.id)}
                            onChange={() => {}} // Handle change through the parent click handler
                          />
                        </li>
                      )) : (
                        <li className="px-4 py-3 text-center text-sm text-gray-500">
                          {searchQuery ? 'No contacts matching your search' : 'No contacts available'}
                        </li>
                      )}
                      
                      {isFetching && (
                        <li className="px-4 py-3 text-center text-sm text-gray-500">
                          Loading more contacts...
                        </li>
                      )}
                      
                      {/* Observer element for infinite scroll */}
                      <li ref={loaderRef} className="h-1" />
                    </ul>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Step 3: Review Selection</h4>
                    {selectedContacts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedContacts([])}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded border border-gray-200 p-2">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">{selectedContacts.length}</span> contacts selected
                    </p>
                    {selectedContacts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedContacts.slice(0, 5).map(contact => (
                          <span key={contact.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {contact.firstName || contact.contactName || contact.phone}
                          </span>
                        ))}
                        {selectedContacts.length > 5 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{selectedContacts.length - 5} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Click on contacts above to select them</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Campaign Selection */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add to Existing Campaign</h3>
                
                <div className="space-y-5">
                  {/* Step 1: Campaign Dropdown */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 1: Select Campaign to Add Contacts
                    </label>
                    <div className="flex space-x-2">
                      <select
                        id="campaignId"
                        className="flex-1 focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        onChange={(e) => {
                          const campaignId = e.target.value;
                          if (campaignId) {
                            const selectedCampaign = campaigns.find(c => c._id === campaignId);
                            if (selectedCampaign) {
                              setScript(selectedCampaign.Script || '');
                              
                              if (selectedCampaign["Voice Clone IDs"] && selectedCampaign["Voice Clone IDs"].length > 0) {
                                setSelectedVoiceClone(selectedCampaign["Voice Clone IDs"][0]);
                              }
                            }
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select a campaign</option>
                        {campaigns && campaigns.length > 0 ? (
                          campaigns.map((campaign: any) => (
                            <option key={campaign._id} value={campaign._id}>
                              {campaign.Name || 'Unnamed'} ({campaign["Campaign Status"] || 'Unknown'})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No campaigns available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          fetchCampaigns();
                          toast.success("Loading campaigns...");
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Load Campaigns
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {campaigns.length > 0 
                        ? "First select an active campaign from the list" 
                        : "No campaigns available. Refresh to try again."}
                    </p>
                    
                    {/* Script Preview */}
                    {script && (
                      <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Campaign Script:</p>
                        <p className="text-sm text-gray-600">{script}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Step 2: Voice Clone Selection */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="voiceClone" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 2: Select Voice Clone (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <select
                        id="voiceClone"
                        className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={selectedVoiceClone}
                        onChange={(e) => {
                          console.log("Selected voice clone:", e.target.value);
                          setSelectedVoiceClone(e.target.value);
                        }}
                      >
                        <option value="">Use default system voice</option>
                        {voiceClones && voiceClones.length > 0 && voiceClones.map(clone => (
                          <option key={clone.id} value={clone.id}>
                            {clone.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          fetchVoiceClones();
                          toast.success("Loading voice clones...");
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Load Voices
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {voiceClones && voiceClones.length > 0 
                        ? "Voice clones make your messages sound more natural and personalized"
                        : "Using default system voice - no voice clones available"}
                    </p>
                  </div>
                  
                  {/* Step 3: Add contacts to campaign */}
                  <div className="border border-gray-200 rounded-md p-4 bg-green-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Step 3: Add Selected Contacts to Campaign
                    </h4>
                    
                    <button
                      onClick={() => {
                        const campaignSelect = document.getElementById('campaignId') as HTMLSelectElement;
                        const campaignId = campaignSelect?.value;
                        
                        if (!campaignId) {
                          toast.error("Please select a campaign first");
                          return;
                        }
                        
                        if (selectedContacts.length === 0) {
                          toast.error("Please select at least one contact");
                          return;
                        }
                        
                        // Find the selected campaign
                        const selectedCampaign = campaigns.find(c => c._id === campaignId);
                        if (!selectedCampaign) {
                          toast.error("Selected campaign not found. Please refresh and try again.");
                          return;
                        }
                        
                        // Confirm with user
                        if (confirm(`Add ${selectedContacts.length} contacts to "${selectedCampaign.Name}" campaign?`)) {
                          // VoiceDrop API uses the _id directly
                          addContactsToCampaign(campaignId);
                        }
                      }}
                      disabled={selectedContacts.length === 0}
                      className={`w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${selectedContacts.length > 0 
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-gray-400 cursor-not-allowed'} 
                        focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''} to Campaign
                    </button>
                    
                    <p className="mt-2 text-xs text-gray-600">
                      {selectedContacts.length === 0 
                        ? "Select contacts from the left panel first" 
                        : "Click to add the selected contacts to your campaign"}
                    </p>
                  </div>
                  
                  {/* Campaign Settings */}
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 border-b pb-2">
                      Campaign Settings
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      These settings will be used for new campaigns or when updating existing ones
                    </p>
                    <CampaignSettingsForm settings={settings} onSave={handleUpdateSettings} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Campaigns List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Current Campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your existing voicemail campaigns
              </p>
            </div>
            <button 
              onClick={fetchCampaigns}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Refresh Campaigns
            </button>
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
              <p className="text-gray-500">No campaigns found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {campaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id || campaign._id}
                  campaign={campaign}
                  onPause={() => handleCampaignAction(campaign.id || campaign._id || '', 'pause')}
                  onResume={() => handleCampaignAction(campaign.id || campaign._id || '', 'resume')}
                  onCancel={() => handleCampaignAction(campaign.id || campaign._id || '', 'cancel')}
                  onDelete={() => handleDeleteCampaign(campaign.id || campaign._id || '')}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 