"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { UserIcon, GlobeAltIcon, MapPinIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createA2PRegistration, updateA2PRegistration, getUserA2PRegistrations, A2PRegistration } from '@/lib/a2p';
import { useAuth } from '@/contexts/AuthContext'; 

const campaignDescription = [
  'This campaign sends appointment information - confirmation & reminder messages to customers once they have booked an appointment with company_name on website and opted-in to receive promotional and notification SMS from company_name.',
  'The campaign will be used to reach out to customers who signed up for the updates via SMS.',
  'This campaign will be used by company_name to reach out to clients who have opted in to receive messages.',
];
const sampleMessage1 = [
  'Hi John! This is Jane from company_name. Our appointment for July 20 11:00 AM is confirmed. Please reach out to +1(213) 725-2867 in case you need to reschedule. Reply STOP to unsubscribe.',
  'Hello, this is Adam from LC Phone. I am following up with you about our meeting yesterday, would you have time to discuss this today? Reply STOP to cancel.',
];
const sampleMessage2 = [
  `Hey Brian! This is Jane from company_name. I see that you weren't able to make it for our appointment. Would you like to reschedule? - https://www.mycompany.com/book. Reply STOP to unsubscribe.`,
  `Hello, this is Dr. Lea. We are confirming your appointment tomorrow at 9 am. Reply STOP to cancel.`,
 ];

const LoadingState = () => (
  <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
    <div className="max-w-[800px] mx-auto text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A855C]"></div>
        <h2 className="text-lg font-semibold text-gray-900">Loading A2P Registration Status</h2>
        <p className="text-sm text-gray-500">Please wait while we fetch your registration details...</p>
      </div>
    </div>
  </div>
);

const ApplicationDetailsModal = ({ isOpen, onClose, data }: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: A2PRegistration['formData'] | null;
}) => {
  if (!data || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm p-6 text-left shadow-xl transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Submitted Application Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-2 space-y-6">
              {/* Business Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Business Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Legal Company Name</p>
                    <p className="text-sm font-medium">{data.legalCompanyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DBA Name</p>
                    <p className="text-sm font-medium">{data.dbaName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">EIN</p>
                    <p className="text-sm font-medium">{data.ein}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="text-sm font-medium">{data.businessType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Industry</p>
                    <p className="text-sm font-medium">{data.businessIndustry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="text-sm font-medium">{data.website}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="text-sm font-medium">{`${data.firstName} ${data.lastName}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium">{data.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{data.phone}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Address Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium">{data.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-sm font-medium">{data.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-sm font-medium">{data.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ZIP</p>
                    <p className="text-sm font-medium">{data.zip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-sm font-medium">{data.isoCountry}</p>
                  </div>
                </div>
              </div>

              {/* Campaign Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Campaign Information</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Campaign Description</p>
                    <p className="text-sm font-medium">{data.campaignDescription}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sample Message 1</p>
                    <p className="text-sm font-medium">{data.sampleMessage1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sample Message 2</p>
                    <p className="text-sm font-medium">{data.sampleMessage2}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Use Case</p>
                    <p className="text-sm font-medium">{data.useCase}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Message Flow</p>
                    <p className="text-sm font-medium">{data.messageFlow}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PhoneNumbersPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationStatus, setRegistrationStatus] = useState<A2PRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    legalCompanyName: '',
    dbaName: '',
    firstName: '',
    lastName: '',
    ein: '',
    einCountry: '',
    email: '',
    phone: '',
    website: '',
    termsPage: '',
    privacyPage: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    campaignDescription: '',
    sampleMessage1: '',
    sampleMessage2: '',
  });
  const [showExamples, setShowExamples] = useState<{ [key: string]: boolean }>({
    campaignDescription: false,
    sampleMessage1: false,
    sampleMessage2: false
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user?.locationId) {
      console.log('Fetching A2P registrations for location:', user.locationId);
      setIsLoading(true);
      unsubscribe = getUserA2PRegistrations(user.locationId, (registrations:any) => {
        console.log('Received registrations:', registrations);
        if (registrations.length > 0) {
          const mostRecent = registrations[0];
          console.log('Setting most recent registration:', mostRecent);
          setRegistrationStatus(mostRecent);
          setCurrentStep(2);
        } else {
          console.log('No registrations found');
          setRegistrationStatus(null);
        }
        setIsLoading(false);
      });
    } else {
      console.log('No locationId found for user');
      setIsLoading(false);
      setRegistrationStatus(null);
    }

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up A2P registrations listener');
        unsubscribe();
      }
    };
  }, [user?.locationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCopyMessage = (message: string, fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: message
    }));
    setShowExamples(prev => ({ ...prev, [fieldName]: false }));
  };

  const renderMessageExamples = (messages: string[], fieldName: string) => (
    <div className="relative">
      <button
        onClick={() => setShowExamples(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))}
        className="text-xs text-[#0A855C] hover:text-[#097a54] flex items-center gap-1"
      >
        See Example
        <svg
          className={`w-4 h-4 transition-transform ${showExamples[fieldName] ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showExamples[fieldName] && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Example messages:</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md">
                  <code className="text-xs text-gray-700 flex-1">{msg}</code>
                  <button
                    onClick={() => handleCopyMessage(msg, fieldName)}
                    className="px-2 py-1 text-xs bg-[#0A855C] hover:bg-[#097a54] rounded text-white"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleSubmit = async () => {
    if (!user?.locationId) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Create initial registration in Firestore
      const registration = await createA2PRegistration(user?.locationId, {
        legalCompanyName: formData.legalCompanyName,
        dbaName: formData.dbaName,
        ein: formData.ein,
        einCountry: formData.einCountry,
        businessType: 'PRIVATE_COMPANY',
        businessIndustry: 'REAL_ESTATE',
        website: formData.website,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        isoCountry: formData.country,
        campaignDescription: formData.campaignDescription,
        sampleMessage1: formData.sampleMessage1,
        sampleMessage2: formData.sampleMessage2,
        useCase: 'MARKETING',
        hasEmbeddedLinks: true,
        hasEmbeddedPhone: true,
        region: 'US',
        messageFlow: 'End users opt in by visiting our website and providing their phone number. They can opt out by replying STOP.',
      });

      setRegistrationStatus(registration);
      pollRegistrationStatus(registration.id);
    } catch (error) {
      console.error('Error submitting A2P registration:', error);
      // Don't set registration status on error since it wasn't created
    }
  };

  const pollRegistrationStatus = async (registrationId: string) => {
    try {
      const response = await fetch('/api/twilio/mock/status');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to check registration status');
      }

      // Update Firestore with new status
      await updateA2PRegistration(registrationId, {
        status: result.data.status,
        steps: result.data.steps
      });
      
      if (result.data.status === 'pending') {
        setTimeout(() => pollRegistrationStatus(registrationId), 5000);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const renderStatusStep = (title: string, step: { status: string; message: string }) => (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 last:border-b-0">
      <div className="mt-1">{getStatusIcon(step.status)}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{step.message}</p>
      </div>
    </div>
  );

  const renderRegistrationStatus = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Registration Status</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm bg-[#0A855C] text-white rounded hover:bg-[#097a54]"
          >
            View Submitted Application
          </button>
        </div>
        <div className="space-y-2">
          {registrationStatus && (
            <>
              {renderStatusStep('Customer Profile', registrationStatus.steps.customerProfile)}
              {renderStatusStep('Trust Product', registrationStatus.steps.trustProduct)}
              {renderStatusStep('Brand Registration', registrationStatus.steps.brandRegistration)}
              {renderStatusStep('Messaging Service', registrationStatus.steps.messagingService)}
              {renderStatusStep('Campaign', registrationStatus.steps.campaign)}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div className="flex gap-8">
      <div className="flex-1 space-y-6">
        {/* Personal Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <UserIcon className="w-6 h-6 text-gray-600 mb-10" />
            <div>
              <h2 className="font-medium">Personal Details</h2>
              <p className="text-sm text-gray-500">Primary contact details for submission</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Legal Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="legalCompanyName"
                  placeholder="Company Name"
                  value={formData.legalCompanyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">DBA Name</label>
                <input
                  type="text"
                  name="dbaName"
                  placeholder="DBA Name"
                  value={formData.dbaName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Best Contact Person at the Company? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div className="pt-11">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  EIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ein"
                  placeholder="EIN"
                  value={formData.ein}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  EIN issuing country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="einCountry"
                  placeholder="EIN issuing country"
                  value={formData.einCountry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Primary REsimpli Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="amvecayz@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  Personal/Business Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Website Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <GlobeAltIcon className="w-6 h-6 text-gray-600 mb-10" />
            <div>
              <h2 className="font-medium">Website - Terms/Privacy pages</h2>
              <p className="text-sm text-gray-500">Website url, privacy and terms - condition pages</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">
                Website <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="website"
                placeholder="http://resimpli.com/"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Terms & condition page</label>
                <input
                  type="url"
                  name="termsPage"
                  placeholder="http://resimpli.com/"
                  value={formData.termsPage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Privacy policy page</label>
                <input
                  type="url"
                  name="privacyPage"
                  placeholder="http://resimpli.com/"
                  value={formData.privacyPage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <MapPinIcon className="w-6 h-6 text-gray-600 mb-10" />
            <div>
              <h2 className="font-medium">Address Details</h2>
              <p className="text-sm text-gray-500">Your business address information</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                placeholder="Your address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  State Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Zip <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zip"
                  placeholder="Zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  Business Registered Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Campaign & Sample Messages Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-600 mb-10" />
            <div>
              <h2 className="font-medium">Campaign & Sample Messages</h2>
              <p className="text-sm text-gray-500">Write down the SMS campaign description and kind of messages you will send</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm">Campaign Description (explain what the campaign will be used for)</label>
                {renderMessageExamples(campaignDescription, 'campaignDescription')}
              </div>
              <textarea
                name="campaignDescription"
                placeholder='Example - "<Your Company Name> uses this campaign for follow up campaign to leads from incoming calls."'
                value={formData.campaignDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm">Sample Message 1 (give an example of messages that will be sent)</label>
                {renderMessageExamples(sampleMessage1, 'sampleMessage1')}
              </div>
              <textarea
                name="sampleMessage1"
                placeholder='Example - "Hi @First_Name, my name is <Your Name> from <Your Company Name> and I am following up regarding the call we received from you. Please let us know a good time for us to connect. You can call or text on this number. Thanks!"'
                value={formData.sampleMessage1}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm">Sample Message 2 (give an example of messages that will be sent)</label>
                {renderMessageExamples(sampleMessage2, 'sampleMessage2')}
              </div>
              <textarea
                name="sampleMessage2"
                placeholder='Example - "Hi @First_Name, this is <Company Name>. You filled out a form on our website about a property that you are interested in selling. Please let us know a good time for us to connect. You can call or text on this number. Thanks!"'
                value={formData.sampleMessage2}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#0A855C] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            onClick={() => setCurrentStep(1)}
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2 bg-[#0A855C] text-white rounded hover:bg-[#097a54] font-medium"
            onClick={handleSubmit}
          >
            Submit Form
          </button>
        </div>
      </div>

      {/* Right Side Content */}
      <div className="w-[400px] space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-orange-600 " />
            </div>
            <div>
              <h3 className="font-medium mb-1">Tip improving 10DLC registration success</h3>
              <p className="text-sm text-gray-600">Get user's consent on receiving SMS</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm mb-2">Add following opt in checkbox to lead capture form:</p>
            <div className="flex items-start gap-2 mt-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm text-gray-600">
                I agree to <span className="text-[#0A855C]">Terms & Conditions</span> and{' '}
                <span className="text-[#0A855C]">Privacy Policy</span>. By submitting this form, you consent to receive SMS messages and/or calls from COMPANY NAME. To unsubscribe, follow the instructions provided in our communications. Msg & data rates may apply for SMS. Your information is secure and will not be sold to third parties. Message frequency varies. Text HELP for Help. Text STOP to cancel.
              </p>
            </div>
          </div>
        </div>

        {/* Example Widget */}
        {/* <div className="bg-gray-900 rounded-lg p-6 mt-6">
          <h3 className="font-medium text-white mb-6">An Example</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-white/90 mb-2">Property address</label>
              <input
                type="text"
                placeholder="123 Main St, City, State"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/90 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm text-white/90 mb-2">Phone</label>
                <input
                  type="text"
                  placeholder="(123) 456-7890"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                  disabled
                />
              </div>
            </div>
            <div className="flex items-start gap-3 mt-4">
              <input type="checkbox" className="mt-1" disabled />
              <p className="text-sm text-white/80">
                I agree to <span className="text-[#0A855C] hover:underline cursor-pointer">Terms & Conditions</span> and{' '}
                <span className="text-[#0A855C] hover:underline cursor-pointer">Privacy Policy</span>. By submitting this form, you consent to receive SMS messages and/or calls from COMPANY NAME. To unsubscribe, follow the instructions provided in our communications. Msg & data rates may apply for SMS. Your information is secure and will not be sold to third parties. Message frequency varies. Text HELP for Help. Text STOP to cancel.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed top-0 left-0">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64 overflow-auto">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-[1200px] w-full mx-auto px-8 py-8">
            {/* Progress Steps - Only show when not loading */}
            {!isLoading && (
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-[#0A855C] text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">10DLC FAQ</span>
                  <div className="w-32 h-[2px] mx-4 bg-[#0A855C]"></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-[#0A855C] text-white' : 'bg-gray-200'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Form Submission</span>
                </div>
              </div>
            )}

            {/* Content */}
            {isLoading ? (
              <LoadingState />
            ) : currentStep === 1 && !registrationStatus ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="max-w-[800px] mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold mb-2">Register for US A2P 10DLC</h1>
                    <p className="text-gray-600">North American Telecom Operators made it mandatory.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">What is 10DLC</h2>
                      <p className="text-gray-700">
                        10 Digit Long Code (10DLC) is the new standard for Application-to-Person (A2P) text messaging utilizing a traditional 10 digit phone number. Although similar to the existing long code, 10DLC is a reliable messaging channel with throughput levels suitable for SMS campaigns which is sanctioned by the mobile operators for A2P messaging.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">Do I need to register?</h2>
                      <p className="text-gray-700">
                        Yes to ensure there is no interruption with your SMS deliverability to cell phone carriers.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">I have 10 team members in my account, does everyone need to fill this out?</h2>
                      <p className="text-gray-700">
                        No, only one registration per account.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">What happens if I don't register?</h2>
                      <p className="text-gray-700">
                        Cell phone carriers could begin imposing message filtering on messages sent from individuals or businesses who have not yet registered, which can impact your deliverability.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">Will there be additional cost?</h2>
                      <p className="text-gray-700 font-medium mb-1">For companies:</p>
                      <ul className="text-gray-700 space-y-1 list-disc pl-5">
                        <li>One Time Registration Fee $50 (required to send numbers to T-Mobile numbers)</li>
                        <li>One Time Registration Fee $4 (to register your company with cell phone carriers)</li>
                        <li>Monthly recurring charge ($10 for every 49 phone numbers you have)</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">Will there be a limitation to how many messages I can send?</h2>
                      <p className="text-gray-700">
                        For companies – 6,000 messages per day
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">I own a company but I send less than 6,000 messages per day, should I register as sole proprietor?</h2>
                      <p className="text-gray-700">
                        No, please register as a private company. Not registering properly could affect your SMS deliverability.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                    <button className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                      Cancel
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">Continue as</span>
                      <button 
                        className="px-4 py-2 bg-[#0A855C] text-white rounded hover:bg-[#097a54] font-medium"
                        onClick={() => setCurrentStep(2)}
                      >
                        Private Company
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-8">
                <div className="flex-1 space-y-6">
                  {registrationStatus ? (
                    renderRegistrationStatus()
                  ) : (
                    renderFormStep()
                  )}
                </div>
                {/* ... existing right side content ... */}
              </div>
            )}
          </div>
        </div>
      </div>
      <ApplicationDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={registrationStatus?.formData || null}
      />
    </div>
  );
} 