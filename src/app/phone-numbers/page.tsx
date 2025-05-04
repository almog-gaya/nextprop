"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { UserIcon, GlobeAltIcon, MapPinIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function PhoneNumbersPage() {
  const [currentStep, setCurrentStep] = useState(1); // Start with FAQ step
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              <label className="block text-sm mb-1">Campaign Description (explain what the campaign will be used for)</label>
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
              <label className="block text-sm mb-1">Sample Message 1 (give an example of messages that will be sent)</label>
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
              <label className="block text-sm mb-1">Sample Message 2 (give an example of messages that will be sent)</label>
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
            onClick={() => {
              // Handle form submission
              console.log(formData);
            }}
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
            {/* Progress Steps */}
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

            {/* Content */}
            {currentStep === 1 ? (
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
              renderFormStep()
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 