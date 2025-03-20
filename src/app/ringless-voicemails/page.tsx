'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { 
  XIcon,  
  FileTextIcon
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CampaignCard from '@/components/ringless-voicemail/CampaignCard';
import CampaignSettingsForm from '@/components/ringless-voicemail/CampaignSettingsForm';
import BulkUploadForm from '@/components/BulkUploadForm';
import { collection, query, onSnapshot, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

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
  
  // Campaign creation state
  const [campaignName, setCampaignName] = useState('');
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
  const stats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        totalContacts: 0,
        delivered: 0,
        pending: 0,
        failed: 0,
        activeCampaigns: 0
      };
    }

    return {
      totalContacts: campaigns.reduce((acc, campaign) => acc + (campaign.total_contacts || 0), 0),
      delivered: campaigns.reduce((acc, campaign) => acc + (campaign.processed_contacts || 0), 0),
      pending: campaigns.reduce((acc, campaign) => {
        const total = campaign.total_contacts || 0;
        const processed = campaign.processed_contacts || 0;
        return acc + (total - processed > 0 ? total - processed : 0);
      }, 0),
      failed: campaigns.reduce((acc, campaign) => acc + (campaign.failed_contacts || 0), 0),
      activeCampaigns: campaigns.filter(c => 
        (c.status === 'active' || c.status === 'running') && !c.paused
      ).length
    };
  }, [campaigns]);

  useEffect(() => {
    let unsubscribe: any;
    
    const fetchData = async () => {
      unsubscribe = await fetchCampaigns();
      fetchPhoneNumbers();
      fetchVoiceClones();
    };
  
    fetchData();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("Current campaigns state:", campaigns);
  }, [campaigns]);
  
  useEffect(() => {
    console.log('Initial fetch triggered');
    fetchContacts(true);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      console.log('Search query changed, resetting:', searchQuery);
      setContacts([]);
      setCurrentPage(1);
      setTotalContacts(0);
      fetchContacts(true);
    } else {
      setContacts([]);
      setCurrentPage(1);
      setTotalContacts(0);
      fetchContacts(true);
    }
  }, [searchQuery]);

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

  const fetchContacts = async (reset = false) => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      const pageToFetch = reset ? 1 : currentPage;
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: CONTACTS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }),
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
      const campaignsCollection = collection(db, 'campaigns');
      const campaignsQuery = query(campaignsCollection, where("customer_id", "==", "bahadur"));
      
      const unsubscribe = onSnapshot(campaignsQuery, (querySnapshot) => {
        const campaignsData: any[] = [];
        querySnapshot.forEach((doc) => {
          campaignsData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Fetched campaigns:', campaignsData);
        setCampaigns(campaignsData);
        setError(null);
      });
  
      return unsubscribe;
      
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
      setVoiceClones(response.data);
    } catch (error) {
      console.error('Error fetching voice clones:', error);
      toast.error('Failed to load voice clones');
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
      const actionMessages = {
        start: 'Campaign started',
        pause: 'Campaign paused',
        resume: 'Campaign resumed',
        stop: 'Campaign stopped',
      };
      const campaignDoc = doc(db, "campaigns", id);
      setDoc(campaignDoc, { paused: action === "pause", status: "pending" }, { merge: true });
      
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
      const campaignDoc = doc(db, "campaigns", id);
      await deleteDoc(campaignDoc);
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

  async function createCampaign() {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
  
    if (!selectedPhoneNumber) {
      toast.error('Please select a phone number');
      return;
    }
  
    if (!script) {
      toast.error('Please provide a campaign script');
      return;
    }

    if (!campaignName) {
      toast.error('Please provide a campaign name');
      return;
    }
  
    try {
      setLoading(true);
      
      const formattedContacts = selectedContacts.map(contact => ({
        phone_number: contact.phone,
        first_name: contact.firstName || contact.contactName || 'Unknown',
        street_name: contact.address1 || 'your area'
      }));
  
      const campaignData = {
        customer_id: "bahadur",
        voice_clone_id: selectedVoiceClone || "dodUUtwsqo09HrH2RO8w",
        name: campaignName,
        from_number: selectedPhoneNumber.number || selectedPhoneNumber,
        interval_seconds: settings.delayMinutes * 60,
        days: settings.daysOfWeek,
        time_window: {
          start: settings.startTime.split(' ')[0].replace(':', ':'),
          end: settings.endTime.split(' ')[0].replace(':', ':')
        },
        timezone: settings.timezone === "EST (New York)" ? "America/New_York" : settings.timezone,
        message: script,
        contacts: formattedContacts
      };
  
      const response = await axios.post('https://backend.iky.link/campaigns', campaignData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      toast.success('Campaign created successfully');
      setSelectedContacts([]);
      setCampaignName('');
      setScript('');
      setSelectedPhoneNumber(phoneNumbers[0] || null);
      setSelectedVoiceClone('');
      fetchCampaigns();
      
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      throw error;
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout title="Ringless Voicemails">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Ringless Voicemails
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create new voicemail campaigns to reach your contacts.
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
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Create New Campaign</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Contact Selection */}
              <div>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Step 1: Select Contacts</h4>
                  
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
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Available Contacts ({contacts.length})</h5>
                    <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
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
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              checked={selectedContacts.some(c => c.id === contact.id)}
                              onChange={() => {}}
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
                        <li ref={loaderRef} className="h-1" />
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Selected Contacts ({selectedContacts.length})</h5>
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
                    <div className="bg-white rounded border border-gray-200 p-2 min-h-[4rem]">
                      {selectedContacts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedContacts.map(contact => (
                            <span key={contact.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {contact.firstName || contact.contactName || contact.phone}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No contacts selected yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Campaign Configuration */}
              <div>
                <div className="space-y-5">
                  {/* Campaign Name */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 2: Campaign Name
                    </label>
                    <input
                      id="campaignName"
                      type="text"
                      className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  {/* Phone Number Selection */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 3: Select From Number
                    </label>
                    <select
                      id="phoneNumber"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
                      value={selectedPhoneNumber?.number || ''}
                      onChange={(e) => {
                        console.log(`Selected phone number: ${e.target.value}`)
                        const phone = phoneNumbers.find(p => p.number === e.target.value);
                        setSelectedPhoneNumber(phone);
                      }}
                    >
                      <option value="" className="text-gray-500">Select a number</option>
                      {phoneNumbers.map(phone => (
                        <option 
                          key={phone.number} 
                          value={phone.number}
                          className="text-gray-900"
                        >
                          {phone.number}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Voice Clone Selection */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="voiceClone" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 4: Select Voice Clone (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <select
                        id="voiceClone"
                        className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={selectedVoiceClone}
                        onChange={(e) => setSelectedVoiceClone(e.target.value)}
                      >
                        <option value="">Use default system voice</option>
                        {voiceClones.map(clone => (
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
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Script Input */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 5: Campaign Script
                    </label>
                    <textarea
                      id="script"
                      className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={4}
                      placeholder="Enter your voicemail script here. Use {{first_name}} and {{street_name}} as placeholders."
                    />
                    <button
                      onClick={generateDefaultScript}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-500"
                    >
                      Generate Default Script
                    </button>
                  </div>

                  {/* Campaign Settings */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Step 6: Campaign Settings
                    </h4>
                    <CampaignSettingsForm settings={settings} onSave={handleUpdateSettings} />
                  </div>

                  {/* Create Campaign Button */}
                  <div className="border border-gray-200 rounded-md p-4 bg-green-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Step 7: Launch Campaign
                    </h4>
                    <button
                      onClick={async () => {
                        if (confirm(`Create "${campaignName}" with ${selectedContacts.length} contacts?`)) {
                          await createCampaign();
                        }
                      }}
                      disabled={selectedContacts.length === 0 || !selectedPhoneNumber || !script || !campaignName}
                      className={`w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${selectedContacts.length > 0 && selectedPhoneNumber && script && campaignName
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-gray-400 cursor-not-allowed'} 
                        focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      Create Campaign with {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                    </button>
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
                console.log('Processing campaign:', campaign);
                
                const campaignStats = {
                  totalContacts: campaign.total_contacts || 0,
                  delivered: campaign.processed_contacts || 0,
                  pending: (campaign.total_contacts || 0) - (campaign.processed_contacts || 0),
                  failed: campaign.failed_contacts || 0
                };
                
                console.log('Calculated stats:', campaignStats);
                
                return (
                  <CampaignCard
                    key={campaign.id || campaign._id}
                    campaign={campaign}
                    stats={campaignStats}
                    onPause={() => handleCampaignAction(campaign.id || campaign._id, 'pause')}
                    onResume={() => handleCampaignAction(campaign.id || campaign._id, 'resume')}
                    onCancel={() => handleCampaignAction(campaign.id || campaign._id, 'cancel')}
                    onDelete={() => handleDeleteCampaign(campaign.id || campaign._id)}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}