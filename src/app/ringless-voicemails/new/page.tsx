'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import BulkUploadForm from '@/components/BulkUploadForm';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [script, setScript] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<any>(null);
  const [settings, setSettings] = useState({
    delayMinutes: 5,
    dailyLimit: 50,
  });
  const [totalContacts, setTotalContacts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const loaderRef = useRef(null);

  // Bulk Upload States
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CONTACTS_PER_PAGE = 10;

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

      console.log('API Response:', { contacts: newContacts.length, total, page: pageToFetch });

      const processedContacts = newContacts.map((contact: any) => ({
        ...contact,
        name: contact.contactName || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
      }));

      setContacts((prev) => (reset ? processedContacts : [...prev, ...processedContacts]));
      setTotalContacts(total);

      if (newContacts.length > 0 && newContacts.length === CONTACTS_PER_PAGE) {
        setCurrentPage(pageToFetch + 1);
        console.log('Page incremented to:', pageToFetch + 1);
      } else {
        console.log('No more contacts to fetch or partial page received');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch phone numbers on component mount
  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

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
      // Set default phone number
      setPhoneNumbers([{ 
        id: 'default',
        phoneNumber: '+1 929-415-9655',
        label: '+1 929-415-9655 (Default)' 
      }]);
      setSelectedPhoneNumber({ 
        id: 'default',
        phoneNumber: '+1 929-415-9655',
        label: '+1 929-415-9655 (Default)' 
      });
    }
  }

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

  // Filter contacts client-side (if API doesn't handle search)
  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName || contact.contactName || ''} ${contact.lastName || ''}`.toLowerCase();
    const phone = contact.phone || '';
    return fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
  });

  const toggleContact = (contact) => {
    setSelectedContacts((prev) =>
      prev.some((c) => c.id === contact.id) ? prev.filter((c) => c.id !== contact.id) : [...prev, contact]
    );
  };

  const estimatedMinutes = selectedContacts.length * settings.delayMinutes;

  const generateDefaultScript = () => {
    setScript(
      `Hi {{first_name}}, this is ${user?.firstName || user?.name || 'Adforce'} from NextProp. I noticed you might be interested in properties in your area. I've got some great listings on {{street_name}} that match your criteria. Call me back when you have a chance and we can discuss your needs. Thanks!`
    );
  };

  const createCampaign = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    if (!script.trim()) {
      toast.error('Please enter a voicemail script');
      return;
    }
    if (!selectedPhoneNumber) {
      toast.error('Please select a sender phone number');
      return;
    }
    try {
      setLoading(true);
      const campaignData = {
        name: `Campaign ${new Date().toLocaleString()}`,
        contacts: selectedContacts.map((contact) => ({
          id: contact.id,
          firstName: contact.firstName || contact.contactName || '',
          lastName: contact.lastName || '',
          phone: contact.phone,
          streetName: contact.address1 || 'your area',
        })),
        script,
        delayMinutes: settings.delayMinutes,
        dailyLimit: settings.dailyLimit,
        senderPhone: selectedPhoneNumber.phoneNumber
      };
      const response = await axios.post('/api/voicemail/campaigns', campaignData);
      toast.success('Campaign created successfully');
      router.push('/ringless-voicemails');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (contacts) => {
    setIsSubmitting(true);
    try {
      let selectedPipelineId = null;
      let selectedStageId = null;
      const uploadResults = await Promise.all(
        contacts.map(async (contact) => {
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
      addContactsToPipeline(selectedPipelineId!, selectedStageId!, processedContacts);

    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContactsToPipeline = async (pipelineId: string, stageId: string, contacts: any) => {
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
    <DashboardLayout title="New Voicemail Campaign">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create New Voicemail Campaign
          </h2>
          <p className="mt-1 text-sm text-gray-500">Send personalized voicemails to multiple contacts.</p>
        </div>
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="px-3 py-2 bg-purple-500 text-white rounded-md text-sm font-medium hover:bg-purple-600 flex items-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Contact Selection */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Contacts</h3>

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

                <div className="mb-4">
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-md">
                  {filteredContacts.length === 0 && !isFetching && contacts.length > 0 ? (
                    <div className="text-center py-12 text-gray-500">No contacts match your search</div>
                  ) : filteredContacts.length === 0 && !isFetching ? (
                    <div className="text-center py-12 text-gray-500">No contacts found</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredContacts.map((contact) => (
                        <li key={contact.id} className="px-4 py-4 hover:bg-gray-50">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                              checked={selectedContacts.some((c) => c.id === contact.id)}
                              onChange={() => toggleContact(contact)}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {contact.firstName || contact.contactName} {contact.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-500">{contact.phone || 'No phone number'}</p>
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {contacts.length < totalContacts && (
                    <div ref={loaderRef} className="flex justify-center p-4">
                      {isFetching ? (
                        <svg
                          className="animate-spin h-8 w-8 text-purple-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <span>Loading more...</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Showing {contacts.length} of {totalContacts} contacts (Page {currentPage - 1})
                </div>

                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Selected Contacts</h4>
                      <p className="text-sm text-gray-500">{selectedContacts.length} contacts will receive voicemails</p>
                    </div>
                    {selectedContacts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedContacts([])}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Campaign Settings */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Campaign Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="delayMinutes" className="block text-sm font-medium text-gray-700">
                      Delay Between Voicemails
                    </label>
                    <div className="mt-1 relative rounded-md">
                      <input
                        type="number"
                        id="delayMinutes"
                        min="1"
                        max="60"
                        className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={settings.delayMinutes}
                        onChange={(e) => setSettings({ ...settings, delayMinutes: parseInt(e.target.value, 10) })}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">minutes</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Estimated completion time: {estimatedMinutes} minutes</p>
                  </div>

                  <div>
                    <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700">
                      Daily Sending Limit
                    </label>
                    <div className="mt-1 relative rounded-md">
                      <input
                        type="number"
                        id="dailyLimit"
                        min="1"
                        max="500"
                        className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={settings.dailyLimit}
                        onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value, 10) })}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">voicemails</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Maximum voicemails to send per day
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Sender Phone Number
                    </label>
                    <div className="mt-1">
                      <select
                        id="phoneNumber"
                        className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={selectedPhoneNumber?.id || ''}
                        onChange={(e) => {
                          const selected = phoneNumbers.find(p => p.id === e.target.value);
                          setSelectedPhoneNumber(selected || null);
                        }}
                      >
                        {phoneNumbers.map(phone => (
                          <option key={phone.id} value={phone.id}>
                            {phone.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Phone number that will appear as the sender
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                        Voicemail Script
                      </label>
                      <button
                        type="button"
                        onClick={generateDefaultScript}
                        className="text-sm text-purple-600 hover:text-purple-500"
                      >
                        Generate Default
                      </button>
                    </div>
                    <div className="mt-1">
                      <textarea
                        id="script"
                        rows={6}
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter your script. Use {{first_name}} and {{street_name}} as placeholders."
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Use {'{{'}'first_name'{'}}'}' and {'{{'}'street_name'{'}}'}' as placeholders for personalization
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
              <Link
                href="/ringless-voicemails"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={createCampaign}
                disabled={loading || selectedContacts.length === 0 || !script.trim()}
                className={`${loading || selectedContacts.length === 0 || !script.trim()
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
                  } inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  `Start Campaign (${selectedContacts.length} Contacts)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}