'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PhoneNumber, useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
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
  PlayIcon,
  PauseIcon,
  PhoneIcon,
  PhoneOffIcon,
  PhoneIncomingIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon
} from 'lucide-react';
import PipelineSelector from '@/components/dashboard/PipelineSelector';
import StageSelector from '@/components/dashboard/StageSelector';
import ViewToggle from '@/components/dashboard/ViewToggel';
import EnhancedBulkUploadForm from '@/components/EnhancedBulkUploadForm';

export default function RinglessVoicemailPage() {
  const { user, loadUser } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>('all');
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [totalLeadsByPipeline, setTotalLeadsByPipeline] = useState<Record<string, number>>({});
  const [totalLeadsByStage, setTotalLeadsByStage] = useState<Record<string, number>>({});
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

  // Add a state to track the filtered contact count for the selected stage
  const [stageContactCount, setStageContactCount] = useState<number | null>(null);

  // Add this with your other state declarations
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number} | null>(null);

  // Add a new state for tracking if filters have been applied
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Add back the search functionality
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const loaderRef = useRef<HTMLLIElement>(null);

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

  // Add useEffect to load initial pipeline stages
  useEffect(() => {
    if (selectedPipeline) {
      const selectedPipelineData = pipelines.find((p: any) => p.id === selectedPipeline);
      if (selectedPipelineData) {
        setPipelineStages(selectedPipelineData.stages || []);
      }
    }
  }, [selectedPipeline, pipelines]);

  // The fetchContacts function from the merge can be kept for reference but we won't use it
  
  // Fix the useEffect that runs fetchContactsByStage by removing the filtersApplied check
  useEffect(() => {
    // Only load contacts when a pipeline is selected
    if (!selectedPipeline) {
      return;
    }
    
    const loadContacts = async () => {
      // Reset the state
      setContacts([]);
      setSelectedContacts([]);
      setCurrentPage(1);
      setTotalContacts(0);
      
      try {
        // Display a loading toast
        const loadingToast = toast.loading(
          selectedStage && selectedStage !== 'all' 
            ? `Loading contacts for stage ${getSelectedStageName()}...` 
            : 'Loading all pipeline contacts...'
        );
        
        // Fetch the appropriate contacts based on pipeline/stage selection
        const fetchedContacts = await fetchContactsByStage(selectedPipeline, selectedStage);
        
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        // Instead of client-side filtering, trust that the API now filters correctly
        // Set the contacts directly from what the API returns
        setContacts(fetchedContacts);
        setTotalContacts(fetchedContacts.length);
        
        // If we didn't already set the stage count in fetchContactsByStage
        if (selectedStage && selectedStage !== 'all' && !stageContactCount) {
          setStageContactCount(fetchedContacts.length);
        } else if (selectedStage === 'all' || !selectedStage) {
          setStageContactCount(null);
        }
        
        if (fetchedContacts.length > 0) {
          // Pre-select all contacts by default
          setSelectedContacts(fetchedContacts);
          toast.success(`Loaded ${fetchedContacts.length} contacts successfully`);
        } else {
          toast.error('No contacts found for the selected criteria');
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
        toast.error('Failed to load contacts');
      }
    };
    
    loadContacts();
  }, [selectedPipeline, selectedStage]);

  // Update the handleApplyFilters function to force a refresh
  const handleApplyFilters = () => {
    console.log('Applying filters');
    setFiltersApplied(true);
    
    // Force a re-fetch by toggling the selectedPipeline state
    if (selectedPipeline) {
      const currentPipeline = selectedPipeline;
      setSelectedPipeline(null);
      setTimeout(() => {
        setSelectedPipeline(currentPipeline);
      }, 50);
    }
  };

  async function fetchCampaigns() {
    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    try {
      const locationId = user?.locationId ?? await getLocationId();
      const campaignsCollection = collection(db, 'campaigns');
      const campaignsQuery = query(campaignsCollection,
        where("customer_id", "==", locationId),
        where("channels.voicedrop.enabled", "==", true),
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

  async function fetchVoiceClones() {
    try {
      console.log('Fetching voice clones from API...');
      const response = await axios.get('/api/voicemail/voice-clones');
      console.log('Voice clones response:', response.status, Array.isArray(response.data) ? `${response.data.length} clones` : 'not an array');
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Invalid voice clones data received');
      }
      
      setVoiceClones(response.data);
    } catch (error) {
      console.error('Error fetching voice clones:', error);
      toast.error('Failed to load voice clones from API, using defaults');
      
      // Extended default voice clones for better fallback
      const defaultVoiceClones = [
        { id: "61EQ2khjAy41AXCqUSSS", name: "Cecilia" },
        { id: "Es45QkMNPudcZKVRZWPs", name: "Rey" },
        { id: "dodUUtwsqo09HrH2RO8w", name: "Default Voice" },
        { id: "K7XqnwwwTHI4FWb3hMcg", name: "American Male" },
        { id: "V2cH3WvRQzV5hpEkPfj8", name: "American Female" },
        { id: "xPALbbfCplcfXEJeWcN2", name: "British Male" },
        { id: "rT9Ym8OzjlQcAgRoWfDd", name: "British Female" },
        { id: "9nK41b6vClYnAqCaSSFL", name: "Australian Male" },
        { id: "E4Nt6X9aOzHg1Vev7KTL", name: "Australian Female" }
      ];
      setVoiceClones(defaultVoiceClones);
    }
  }

  async function handleCampaignAction(id: string, action: string) {
    try {
      const actionMessages: Record<string, string> = {
        start: 'Campaign started',
        pause: 'Campaign paused',
        resume: 'Campaign resumed',
        stop: 'Campaign stopped',
      };
      console.log(`Handling ${action} action for campaign with ID:`, id);
      // return;

      const result = await fetch(`/api/voicemail/action?campaignId=${id}&action=${action}`, {

      })

      toast.success(actionMessages[action as keyof typeof actionMessages] || 'Campaign updated');

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

      const formattedContacts = selectedContacts.map(function (contact) {
        const opportunities = contact.opportunities || [];
        const pipeline = opportunities.find((p: any) => p.pipelineId === selectedPipeline);
        const opportunityId = pipeline?.id;
        const currentStageId = pipeline?.pipelineStageId;
        const pipelineId = pipeline?.pipelineId;
        const nextPipelineId = getNextStageIdByPipelineId(pipelineId, currentStageId);
        
        let pipelineInfo = {};
        // add only if we have nextPipeline id otherwise dont include 
        if (nextPipelineId) {
          pipelineInfo = {
            pipeline_id: pipelineId,
            opportunity_id: opportunityId,
            next_pipeline_stage_id: nextPipelineId,
          };
        }
        
        return {
          phone_number: contact.phone,
          first_name: contact.firstName || contact.contactName || 'Unknown',
          street_name: contact.address1 || contact.street || 'your area',
          city: contact.city,
          state: contact.state,
          country: contact.country,
          postalCode: contact.postalCode,
          // add only if we have nextPipeline id otherwise dont include
          ...pipelineInfo,
        };
      });
      
      // delete null values
      for (let i = 0; i < formattedContacts.length; i++) {
        const contact = formattedContacts[i] as Record<string, any>;
        for (let key in contact) {
          if (contact[key] === null || contact[key] === undefined) {
            delete contact[key];
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
          'voicedrop': {
            'enabled': true,
            'message': script,
            'voice_clone_id': selectedVoiceClone || "dodUUtwsqo09HrH2RO8w",
            'from_number': selectedPhoneNumber.number || selectedPhoneNumber,
            'max_calls_per_hour': settings.maxPerHour,
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
      if (data.campaign_id) {
        toast.success(`Campaign created successfully with total ${data.total_contacts_added} contacts`);
      } else {
        const errorMessages = data.detail.map((err: any) => {
          // Extract the field name from the 'loc' array (last element is the field name)
          const fieldName = err.loc[err.loc.length - 1];
          return `'${fieldName}' must be a valid string`;
        }).join(', ');
        toast.error(errorMessages,
          {
            duration: 10000,
            position: "top-right",
          }
        );
      }

      setSelectedContacts([]);
      setCampaignName('');
      setScript('');
      setSelectedPhoneNumber(phoneNumbers[0] || null);
      setSelectedVoiceClone('');
      fetchCampaigns();

      return data;
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error?.message || error?.response?.data?.message || 'Failed to create campaign');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const getNextStageIdByPipelineId = (pipelineId: string, currentStageId: string): string | null => {
    // Input validation
    if (!pipelineId || !currentStageId) {
      console.warn('Invalid input: pipelineId and currentStageId are required');
      return null;
    }

    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline || !Array.isArray(pipeline.stages) || pipeline.stages.length === 0) {
      console.warn(`Pipeline not found or has no stages: ${pipelineId}`);
      return null;
    }

    // Ensure stages array is valid and has required properties
    const validStages = pipeline.stages.every((stage: {id: string}) => stage && typeof stage.id === 'string');
    if (!validStages) {
      console.warn(`Invalid stage structure in pipeline: ${pipelineId}`);
      return null;
    }

    const currentStageIndex = pipeline.stages.findIndex((stage: {id: string}) => stage.id === currentStageId);

    // Check if current stage exists and if next stage is available
    if (currentStageIndex === -1) {
      console.warn(`Current stage not found: ${currentStageId}`);
      return null;
    }

    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= pipeline.stages.length) {
      console.warn('Already at the last stage');
      return null;
    }

    return pipeline.stages[nextIndex].id;
  };

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
                name: `${contact.firstName} ${contact.lastName} - ${contact.address1 ?? `${contact.street}, ${contact.city}, ${contact.state} ${contact.zipCode}`}`.trim()
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

  // Update the handlePipelineChange function to load stage counts immediately
  const handlePipelineChange = (pipelineId: string) => {
    console.log('Pipeline changed to:', pipelineId);
    setSelectedPipeline(pipelineId);
  };

  // Add these two missing function declarations after the handlePipelineChange function
  const handleStageChange = (stageId: string) => {
    console.log('Stage changed to:', stageId);
    setSelectedStage(stageId);
  };

  // Add this function to get the stage name
  const getSelectedStageName = () => {
    if (!selectedStage || selectedStage === 'all') return null;
    
    const stage = pipelineStages.find((s: any) => s.id === selectedStage);
    return stage?.name || null;
  };

  // Enhanced fetchStageContacts function with better error handling
  const fetchStageContacts = async (pipelineId: string, stageId: string) => {
    console.log(`Fetching contact count for pipeline ${pipelineId}, stage ${stageId}`);
    try {
      const response = await fetch(`/api/pipelines/search?pipelineId=${pipelineId}&stageId=${stageId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stage ${stageId} for pipeline ${pipelineId}: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API error: ${data.message || 'Unknown error'}`);
      }
      
      console.log(`Stage ${stageId} count:`, data.total || 0);
      return data.total || 0;
    } catch (error) {
      console.error(`Error fetching stage ${stageId} contacts:`, error);
      return 0; // Return 0 on error
    }
  };

  // Replace the fetchContactsByStage function with a new implementation that uses the pipelines/search endpoint
  const fetchContactsByStage = async (pipelineId: string, stageId: string | null) => {
    if (!pipelineId) {
      console.error('No pipeline ID provided');
      return [];
    }
    
    setIsFetching(true);
    console.log('-------- NEW FETCH SESSION --------');
    console.log('Fetching contacts for pipeline:', pipelineId, 'stage:', stageId || 'all stages');
    
    try {
      // Calculate number of pages to fetch based on expected count
      const expectedCount = (stageId && stageId !== 'all' && totalLeadsByStage[stageId]) || 
                            (selectedPipeline && totalLeadsByPipeline[selectedPipeline]) || 
                            500;
      const pageSize = 100; // Use a smaller page size for better reliability
      const pagesToFetch = Math.ceil(expectedCount / pageSize);
      
      console.log(`Need to fetch ${pagesToFetch} pages to get all ${expectedCount} contacts`);
      setLoadingProgress({ current: 0, total: pagesToFetch });
      
      // Hold all contacts from all pages
      let allContacts: any[] = [];
      
      // Fetch each page of contacts
      for (let page = 1; page <= pagesToFetch; page++) {
        try {
          console.log(`Fetching page ${page} of ${pagesToFetch}`);
          
          // Use the pipelines/search endpoint which is known to work
          const url = `/api/pipelines/search?pipelineId=${pipelineId}${stageId && stageId !== 'all' ? `&stageId=${stageId}` : ''}&page=${page}&limit=${pageSize}`;
          console.log(`Request URL: ${url}`);
          
          const startTime = new Date().getTime();
          const response = await fetch(url);
          const endTime = new Date().getTime();
          console.log(`Request completed in ${endTime - startTime}ms`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`Response data:`, data);
          
          if (data.error) {
            throw new Error(`API error: ${data.message || 'Unknown error'}`);
          }
          
          // Get the opportunities from the response
          const opportunities = data.opportunities || [];
          console.log(`Received ${opportunities.length} opportunities from page ${page}`);
          
          // Extract contacts from opportunities - IMPROVED VERSION
          const pageContacts = opportunities
            .filter((opp: any) => opp.contact) // Only include opportunities with contact data
            .map((opp: any) => {
              // Convert the opportunity's contact to our contact format
              const contact = opp.contact;
              
              // Create a proper display name from the opportunity
              const displayName = opp.name && opp.name !== 'Unnamed' ? opp.name : null;
              
              // Get address components
              const address = [
                contact.address1, 
                contact.city ? contact.city + (contact.state ? ', ' + contact.state : '') : contact.state,
                contact.postalCode
              ].filter(Boolean).join(' ');
              
              // Create a formatted full name
              const firstName = contact.firstName || '';
              const lastName = contact.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const contactName = fullName || (contact.contactName || '');
              
              return {
                id: contact.id,
                firstName: firstName,
                lastName: lastName,
                contactName: contactName.length > 0 ? contactName : 'Unnamed',
                phone: contact.phone || '',
                email: contact.email || '',
                address1: contact.address1 || '',
                city: contact.city || '',
                state: contact.state || '',
                postalCode: contact.postalCode || '',
                stageId: opp.pipelineStageId, // Use the opportunity's stage ID
                opportunityId: opp.id, // Keep track of the opportunity ID
                // Use a better name hierarchy - opportunity name, then contact name, then phone
                name: displayName || fullName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unnamed'),
                // Add full address for display
                fullAddress: address || '',
                // Include opportunity data
                value: opp.monetaryValue ? `$${opp.monetaryValue}` : '',
                businessName: contact.company || '',
                source: opp.source || '',
                contact: contact, // Keep the original contact object for reference
              };
            });
          
          console.log(`Extracted ${pageContacts.length} contacts with stage info`);
          
          // Add these contacts to our collection
          allContacts = [...allContacts, ...pageContacts];
          
          // Update the UI
          setContacts(allContacts);
          setTotalContacts(data.total || allContacts.length);
          
          // Update progress
          setLoadingProgress({ current: page, total: pagesToFetch });
          
          // If we have all contacts or the API indicates no more pages, stop fetching
          if (!data.nextPage || opportunities.length < pageSize) {
            console.log(`No more pages to fetch (got ${opportunities.length}, expected ${pageSize})`);
            if (opportunities.length === 0) {
              break;
            }
          }
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          // Continue to next page despite errors
        }
      }
      
      console.log(`Successfully fetched ${allContacts.length} total contacts`);
      return allContacts;
    } catch (error) {
      console.error('Error fetching contacts by stage:', error);
      toast.error('Failed to load contacts: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return [];
    } finally {
      setIsFetching(false);
      setLoadingProgress(null);
    }
  };

  // Ensure type definition for stageInfo
  // Add this function to analyze and display stage distribution of contacts
  const analyzeContactStages = (contacts: any[]) => {
    if (!contacts || contacts.length === 0) return null;
    
    // Count contacts by stage
    const stageDistribution: Record<string, number> = {};
    let contactsWithNoStage = 0;
    
    contacts.forEach(contact => {
      if (contact.stageId) {
        stageDistribution[contact.stageId] = (stageDistribution[contact.stageId] || 0) + 1;
      } else {
        contactsWithNoStage++;
      }
    });
    
    // Get stage names for display
    const stageInfos = Object.entries(stageDistribution).map(([stageId, count]) => {
      let stageName = 'Unknown Stage';
      
      // Try to find the stage name by looking through all pipelines
      for (const pipeline of pipelines) {
        const stage = pipeline.stages?.find((s: any) => s.id === stageId);
        if (stage) {
          stageName = stage.name;
          break;
        }
      }
      
      return { 
        stageId, 
        stageName, 
        count,
        percentage: Math.round((count / contacts.length) * 100)
      };
    }).sort((a, b) => b.count - a.count); // Sort by count descending
    
    return {
      totalAnalyzed: contacts.length,
      contactsWithNoStage,
      stageInfos
    };
  };

  // Add back the search functionality
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      
      // Force a refresh with the search term
      if (selectedPipeline) {
        const currentPipeline = selectedPipeline;
        setSelectedPipeline(null);
        setTimeout(() => {
          setSelectedPipeline(currentPipeline);
        }, 50);
      }
    }, 300);
  }, [selectedPipeline]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Add back the useEffect that loads pipelines
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

        // Create a map to store stage counts
        const stageCountsMap: Record<string, number> = {};
        
        // For each pipeline, fetch counts for all stages
        for (const pipeline of pipelinesArray) {
          for (const stage of (pipeline.stages || []) as any[]) {
            try {
              const count = await fetchStageContacts(pipeline.id, stage.id);
              stageCountsMap[stage.id] = count;
            } catch (error) {
              console.error(`Error fetching count for stage ${stage.id}:`, error);
              stageCountsMap[stage.id] = 0;
            }
          }
        }
        
        // Update stage counts state
        setTotalLeadsByStage(stageCountsMap);
        
        // Calculate pipeline totals
        const pipelineTotals: Record<string, number> = {};
        for (const pipeline of pipelinesArray) {
          const pipelineTotal = (pipeline.stages || []).reduce((total: number, stage: { id: string }) => {
            return total + (stageCountsMap[stage.id] || 0);
          }, 0);
          pipelineTotals[pipeline.id] = pipelineTotal;
        }
        
        // Update pipeline totals state
        setTotalLeadsByPipeline(pipelineTotals);
      } catch (error) {
        console.error('Error fetching pipelines:', error);
        toast.error('Failed to load pipelines');
        setPipelines([]);
      }
    };
    
    fetchPipelines();
  }, []);

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
            icon={<PhoneIcon className="w-6 h-6" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={<PhoneIncomingIcon className="w-6 h-6" />}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Failed"
            value={stats.failed}
            icon={<PhoneOffIcon className="w-6 h-6" />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Pipeline Selector */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-8">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <div className="w-full sm:w-1/2">
                  <PipelineSelector
                    pipelines={pipelines}
                    selectedPipeline={selectedPipeline}
                    handlePipelineChange={handlePipelineChange}
                  />
                  {selectedPipeline && <span className="ml-3 text-purple-600 font-medium">
                    {totalLeadsByPipeline[selectedPipeline] || 0} leads
                  </span>}
                </div>
                <div className="w-full sm:w-1/2 mt-3 sm:mt-0 flex items-center">
                  <div className="flex-grow">
                    <StageSelector
                      stages={pipelineStages}
                      selectedStage={selectedStage}
                      handleStageChange={handleStageChange}
                      disabled={!selectedPipeline}
                    />
                    {selectedStage !== 'all' && <span className="ml-3 text-purple-600 font-medium">
                      {selectedStage ? totalLeadsByStage[selectedStage] || 0 : 0} leads
                    </span>}
                  </div>
                  <button
                    onClick={handleApplyFilters}
                    disabled={!selectedPipeline}
                    className={`ml-3 px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
                      ${!selectedPipeline 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
            {!filtersApplied && (
              <div className="mt-2 text-amber-600 text-sm">
                Please select a pipeline and stage, then click "Apply" to load contacts.
              </div>
            )}
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
                  {loadingProgress && (
                    <div className="bg-purple-100 text-purple-800 p-2 text-sm text-center">
                      Loading contacts: {loadingProgress.current} of {loadingProgress.total} pages 
                      ({Math.round((loadingProgress.current / loadingProgress.total) * 100)}%)
                    </div>
                  )}
                  
                  {selectedStage && selectedStage !== 'all' && contacts.length > 0 && (() => {
                    const analysis = analyzeContactStages(contacts);
                    if (!analysis) return null;
                    
                    // Check if we have contacts from other stages
                    const otherStagesCount = analysis.stageInfos
                      .filter(info => info.stageId !== selectedStage)
                      .reduce((sum, info) => sum + info.count, 0);
                    
                    if (otherStagesCount > 0) {
                      // We have contacts from other stages - there's a filtering issue
                      return (
                        <div className="bg-red-100 text-red-800 p-2 text-sm">
                          <p className="font-semibold">Warning: API filter issue detected</p>
                          <p>Of {analysis.totalAnalyzed} contacts loaded:</p>
                          <ul className="list-disc list-inside">
                            {analysis.stageInfos.map(info => (
                              <li key={info.stageId}>
                                {info.stageName}: {info.count} contacts ({info.percentage}%)
                                {info.stageId === selectedStage && " ✓"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                  
                  <ContactSelector
                    contacts={contacts}
                    selectedContacts={selectedContacts}
                    searchQuery={searchQuery}
                    isSearching={isSearching}
                    isFetching={isFetching}
                    totalContacts={stageContactCount !== null ? stageContactCount : totalContacts}
                    onSearchChange={handleSearchChange}
                    onToggleContact={toggleContact}
                    onClearSelected={() => setSelectedContacts([])}
                    onOpenBulkUpload={() => setIsBulkUploadModalOpen(true)}
                    loaderRef={loaderRef}
                    stageName={getSelectedStageName()}
                  />
                </div>
              </div>

              {/* Campaign Settings - 7 columns */}
              <div className="lg:col-span-7">

                <CampaignForm
                  isVoiceMailModule={true}
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
                    fetchVoiceClones();
                    toast.success("Loading voice clones...");
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
          isVoiceMailModule={true}
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