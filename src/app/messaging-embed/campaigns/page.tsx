'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PhoneNumber, useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StatsCard from '@/components/StatsCard';
import BulkUploadForm from '@/components/BulkUploadForm';
import { collection, query, onSnapshot, where, setDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import ContactSelector from '@/components/ringless-voicemail/ContactSelector';
import CampaignForm from '@/components/ringless-voicemail/CampaignForm';
import CampaignList from '@/components/ringless-voicemail/CampaignList';
import {
    MessageCircleIcon,
    MessageCircleDashedIcon,
    MessageCircleOffIcon
} from 'lucide-react';
import PipelineSelector from '@/components/dashboard/PipelineSelector';
import ViewToggle from '@/components/dashboard/ViewToggel';
import EnhancedBulkUploadForm from '@/components/EnhancedBulkUploadForm';

export default function RinglessVoicemailPage() {
    const { user, loadUser } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
    const [totalLeadsByPipeline, setTotalLeadsByPipeline] = useState<Record<string, number>>({});
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [apiConfigured, setApiConfigured] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [notificationActive, setNotificationActive] = useState(false);
    const [settings, setSettings] = useState({
        delayMinutes: 5,
        dailyLimit: 50,
        startTime: "10:00 AM",
        endTime: "5:00 PM",
        timezone: "America/New_York",
        maxPerHour: 100,
        daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    });

    useEffect(() => {
        if (!user && !loading) {
            loadUser();
        }
    }, [user, loading, loadUser]);

    useEffect(() => {
        if (user && !loading) {
            fetchPhoneNumbers();
        }
    }, [user, loading]);

    const dayMapping: { [key: string]: string } = {
        Mon: "Monday",
        Tue: "Tuesday",
        Wed: "Wednesday",
        Thu: "Thursday",
        Fri: "Friday",
        Sat: "Saturday",
        Sun: "Sunday",
    };

    const convertTo24Hour = (time: string) => {
        if (/^\d{2}:\d{2}$/.test(time)) {
            // Already in 24-hour format, return as-is
            return time;
        }

        const [hourStr, minuteStr, period] = time.split(/:| /);
        let hour = parseInt(hourStr, 10);

        if (period?.toUpperCase() === "PM" && hour !== 12) {
            hour += 12;
        } else if (period?.toUpperCase() === "AM" && hour === 12) {
            hour = 0;
        }

        return `${String(hour).padStart(2, "0")}:${minuteStr}`;
    };

    // Contact management state
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalContacts, setTotalContacts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFetching, setIsFetching] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
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
        };

        fetchData();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

 

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
 

    const fetchContacts = async (reset = false) => {
        if (isFetching) return;
      
        try {
          if (!selectedPipeline) {
            console.log('No pipeline selected, skipping fetch');
            return;
          }
      
          setIsFetching(true);
      
          // Start from page 1 if reset, otherwise continue from currentPage (though we'll fetch all)
          const initialPage = reset ? 1 : currentPage;
      
          // Recursive helper function to fetch all pages
          const fetchAllContacts = async (page: number, accumulatedContacts: any[] = []): Promise<any[]> => {
            const params = new URLSearchParams({
              page: page.toString(),
              type: 'pipeline',
              pipelineName: pipelines.find((p) => p.id === selectedPipeline)?.name || '',
              pipelineId: selectedPipeline,
              limit: CONTACTS_PER_PAGE.toString(),
              ...(searchQuery && { search: searchQuery }),
            });
      
            console.log('Fetching contacts with params:', params.toString());
            const response = await axios.get(`/api/contacts/search?${params.toString()}`);
            const newContacts = response.data.contacts || [];
       
            const processedContacts = newContacts.map((contact: any) => ({
              ...contact,
              name: contact.contactName || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
            }));
      
            const updatedContacts = [...accumulatedContacts, ...processedContacts];
      
            // If we got fewer contacts than the limit, we've reached the end
            if (newContacts.length < CONTACTS_PER_PAGE) {
              return updatedContacts; // Return all accumulated contacts
            }
      
            // Otherwise, fetch the next page recursively
            return fetchAllContacts(page + 1, updatedContacts);
          };
      
          // Fetch all contacts starting from the initial page
          const allContacts = await fetchAllContacts(initialPage);
      
          // Update state with all contacts at once
          setContacts(allContacts);
          setTotalContacts(allContacts.length); // Use the length of fetched contacts, or use API's total if accurate
          setCurrentPage(1); // Reset to 1 since we fetched everything
          setSelectedContacts(allContacts);
        } catch (error) {
          console.error('Error fetching contacts:', error);
          toast.error('Failed to load contacts');
        } finally {
          setIsFetching(false);
        }
      };
    
    // Add effect to refetch contacts when pipeline changes
    useEffect(() => {
        setContacts([]);
        setCurrentPage(1);
        setTotalContacts(0);
        fetchContacts(true);
    }, [selectedPipeline]);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const searchContactsByName = useCallback(async (name: string) => {
        try {
            setIsSearching(true);
            setError(null);

            if (!name.trim()) {
                setContacts([]);
                setCurrentPage(1);
                setTotalContacts(0);
                await fetchContacts();
                return;
            }

            const response = await fetch(`/api/contacts/search?name=${encodeURIComponent(name)}`);
            if (!response.ok) {
                throw new Error(`Search failed with status: ${response.status}`);
            }

            const data = await response.json();
            const searchedContacts = data.contacts || [];

            const processedContacts = searchedContacts.map((contact: any) => ({
                ...contact,
                name: contact.contactName || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
            }));

            setContacts(processedContacts);
            setTotalContacts(searchedContacts.length);
            setCurrentPage(1);
            console.log('Search results:', processedContacts);

            if (searchedContacts.length === 0) {
                toast.caller('No contacts found matching your search');
            }
        } catch (error) {
            console.error('Error searching contacts:', error);
        } finally {
            setIsSearching(false);
        }
    }, [fetchContacts]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    async function fetchCampaigns() {
        setLoading(true);
        let unsubscribe: (() => void) | undefined;

        try {
            const locationId = user?.locationId ?? await getLocationId();
            const campaignsCollection = collection(db, 'campaigns');
            const campaignsQuery = query(campaignsCollection,
                where("customer_id", "==", locationId),
                where("channels.sms.enabled", "==", true),
                orderBy("created_at", "desc")
            );

            unsubscribe = onSnapshot(campaignsQuery, (querySnapshot) => {
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
            throw error;
        } finally {
            setLoading(false);
        }
    }

    async function getLocationId(): Promise<string> {
        try {
            const response = await fetch('/api/auth/ghl/location-id');
            if (!response.ok) {
                throw new Error(`Failed to fetch location ID: ${response.status}`);
            }
            const data = await response.json();
            if (!data.locationId) {
                throw new Error('Location ID not found in response');
            }
            return data.locationId;
        } catch (error) {
            console.error('Error fetching location ID:', error);
            throw error;
        }
    }

    async function fetchPhoneNumbers() {
        try {
            const userNumbers = user?.phoneNumbers || [];
            const numbersArray = userNumbers.map((number: PhoneNumber) => number.phoneNumber);
            setPhoneNumbers(numbersArray);
        } catch (error) {
            console.error('Error fetching phone numbers:', error);
            toast.error('Failed to load phone numbers');
            setPhoneNumbers([]);
            setSelectedPhoneNumber(null);
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
            console.log(`Handling ${action} action for campaign with ID:`, id);
            // return;

            await fetch(`/api/voicemail/action?campaignId=${id}&action=${action}`, {})

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
        console.log('Updating settings:', newSettings);
        setSettings(newSettings);
        toast.success('Settings saved');
    }

    async function createCampaign() {
        if (!selectedPipeline) {
            toast.error('Please select a pipeline first');
            return;
        }

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

            let formattedContacts = selectedContacts.map(contact => ({
                phone_number: contact.phone,
                first_name: contact.firstName || contact.contactName || 'Unknown',
                street_name: contact.address1 || contact.street || 'your area',
                city: contact.city,
                state: contact.state,
                country: contact.country,
                postalCode: contact.postalCode,
                contact_id: contact.id,
            }));
            /// delete null.undefined values
            for (let i = 0; i < formattedContacts.length; i++) {
                for (let key in formattedContacts[i]) {
                    if (formattedContacts[i][key] === null || formattedContacts[i][key] === undefined) {
                        delete formattedContacts[i][key];
                    }
                }
            } 

            const campaignPayload = {
                'customer_id': user?.locationId,
                'name': campaignName,
                'days': settings.daysOfWeek.map(day => dayMapping[day] || day),
                'timezone': settings.timezone === "EST (New York)" ? "America/New_York" : settings.timezone,
                'time_window': {
                    start: convertTo24Hour(settings.startTime),
                    end: convertTo24Hour(settings.endTime)
                },
                'channels': {
                    "sms": {
                        "enabled": true,
                        "message": script,
                        "time_interval": settings.delayMinutes,
                        "from_number": selectedPhoneNumber.number || selectedPhoneNumber,
                    }
                },
                'contacts': formattedContacts,
            } 
            const response = await fetch("/api/voicemail", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(campaignPayload)
            });
            const data = await response.json();
            toast.success('Campaign created successfully');
            setSelectedContacts([]);
            setCampaignName('');
            setScript('');
            setSelectedPhoneNumber(phoneNumbers[0] || null);
            setSelectedVoiceClone('');
            fetchCampaigns();

            return data;
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast.error(error?.message || error?.response?.data?.message || 'Failed to create campaign');
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
        /// show popup that bulk upload is in progress and add button that will route 
        // to the bulk operations page
    };
 

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => searchContactsByName(value), 300);
    }, [searchContactsByName]);

    const handlePipelineChange = (pipelineId: string) => {
        setSelectedPipeline(pipelineId);
    };
 

    useEffect(() => {
        const fetchPipelines = async () => {
            try {
                const response = await fetch('/api/pipelines');
                if (!response.ok) {
                    throw new Error('Failed to fetch pipelines');
                }
                const data = await response.json();
                const pipelinesArray = Array.isArray(data) ? data : Array.isArray(data.pipelines) ? data.pipelines : [];
                setPipelines(pipelinesArray);

                // Flatten all pipeline-stage pairs into an array of fetch promises
                const stageFetchPromises = pipelinesArray.flatMap((pipeline: any) =>
                    pipeline.stages.map((stage: any) =>
                        fetch(`/api/pipelines/search?pipelineId=${pipeline.id}&stageId=${stage.id}`)
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch stage ${stage.id} for pipeline ${pipeline.id}`);
                                }
                                return response.json();
                            })
                            .then((dataResponse) => ({
                                pipelineId: pipeline.id,
                                total: dataResponse.total,
                            }))
                    )
                );

                // Execute all stage fetches concurrently
                const stageResults = await Promise.all(stageFetchPromises);

                // Aggregate totals into a single object
                const updatedTotalLeads = stageResults.reduce((acc, { pipelineId, total }) => {
                    acc[pipelineId] = (acc[pipelineId] || 0) + total;
                    return acc;
                }, { ...totalLeadsByPipeline }); // Spread existing state to preserve other pipeline totals

                // Update state once with all aggregated totals
                setTotalLeadsByPipeline(updatedTotalLeads);

            } catch (error) {
                console.error('Error fetching pipelines:', error);
                toast.error('Failed to load pipelines');
                setPipelines([]);
            }
        };
        fetchPipelines();
    }, []);

    return (
        <DashboardLayout title="SMS Campaign">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            SMS Campaign
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Create new SMS campaign to reach your contacts.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatsCard
                        title="Total Contacts"
                        value={stats.totalContacts}
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
                        value={stats.delivered}
                        icon={<MessageCircleIcon className="w-6 h-6" />}
                        iconBgColor="bg-green-100"
                        iconColor="text-green-600"
                    />
                    <StatsCard
                        title="Pending"
                        value={stats.pending}
                        icon={<MessageCircleDashedIcon className="w-6 h-6" />}
                        iconBgColor="bg-yellow-100"
                        iconColor="text-yellow-600"
                    />
                    <StatsCard
                        title="Failed"
                        value={stats.failed}
                        icon={<MessageCircleOffIcon className="w-6 h-6" />}
                        iconBgColor="bg-red-100"
                        iconColor="text-red-600"
                    />
                </div>

                {/* Pipeline Selector */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-8">
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <PipelineSelector
                                    pipelines={pipelines}
                                    selectedPipeline={selectedPipeline}
                                    handlePipelineChange={handlePipelineChange}
                                />
                                {selectedPipeline && <span className="ml-3 text-purple-600 font-medium">
                                    {totalLeadsByPipeline[selectedPipeline] || 0} leads
                                </span>}
                            </div>
                            <div className="flex items-center space-x-3">
                                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create New Campaign */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Campaign</h3>
                            <button
                                onClick={() => setIsBulkUploadModalOpen(true)}
                                className="inline-flex items-center px-3 py-2 border border-purple-300 text-sm leading-4 font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                Bulk Upload Contacts
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Contact Selection - 5 columns */}
                            <div className="lg:col-span-5 flex flex-col h-full">
                                <div className="flex-grow overflow-hidden border border-gray-200 rounded-lg">
                                    <ContactSelector
                                        contacts={contacts}
                                        selectedContacts={selectedContacts}
                                        searchQuery={searchQuery}
                                        isSearching={isSearching}
                                        isFetching={isFetching}
                                        totalContacts={totalContacts}
                                        onSearchChange={handleSearchChange}
                                        onToggleContact={toggleContact}
                                        onClearSelected={() => setSelectedContacts([])}
                                        onOpenBulkUpload={() => setIsBulkUploadModalOpen(true)}
                                        loaderRef={loaderRef}
                                    />
                                </div>
                            </div>

                            {/* Campaign Settings - 7 columns */}
                            <div className="lg:col-span-7">

                                <CampaignForm
                                    isVoiceMailModule={false}
                                    campaignName={campaignName}
                                    script={script}
                                    phoneNumbers={phoneNumbers}
                                    selectedPhoneNumber={selectedPhoneNumber}
                                    voiceClones={voiceClones}
                                    selectedVoiceClone={selectedVoiceClone}
                                    settings={settings}
                                    selectedContacts={selectedContacts}
                                    onNameChange={setCampaignName}
                                    onScriptChange={setScript}
                                    onPhoneNumberChange={(value) => setSelectedPhoneNumber(phoneNumbers.find((p) => p === value) || null)}
                                    onVoiceCloneChange={setSelectedVoiceClone}
                                    onSettingsSave={handleUpdateSettings}
                                    onGenerateScript={generateDefaultScript}
                                    onCreateCampaign={async () => {
                                        if (confirm(`Create "${campaignName}" with ${selectedContacts.length} contacts?`)) {
                                            await createCampaign();
                                        }
                                    }}
                                    onRefreshVoiceClones={() => {
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isBulkUploadModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setIsBulkUploadModalOpen(false)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EnhancedBulkUploadForm onContactsSelect={handleBulkUpload} isLoading={isSubmitting} />
                        </div>
                    </div>
                )}

                <CampaignList
                    isVoiceMailModule={false}
                    campaigns={campaigns}
                    loading={loading}
                    error={error}
                    onPause={(id) => handleCampaignAction(id, 'pause')}
                    onResume={(id) => handleCampaignAction(id, 'resume')}
                    onDelete={handleDeleteCampaign}
                />
            </div>
        </DashboardLayout>
    );
}