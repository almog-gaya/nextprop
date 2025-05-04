'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Contact } from '@/types';
import { ChatBubbleLeftRightIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, TagIcon, ClockIcon, PencilIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import NoteSidebar from '@/components/conversation/NoteSidebar';

export default function ContactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNoteSidebarOpen, setIsNoteSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await axios.get(`/api/contacts/${params.id}`);
        if (response.data.error) {
          setError(response.data.error);
          return;
        }
        setContact(response.data);
      } catch (err) {
        setError('Failed to load contact details');
        console.error('Error fetching contact:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContact();
    }
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout title="Contact Details">
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contact) {
    return (
      <DashboardLayout title="Contact Details">
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
            <p className="text-sm font-medium">{error || 'Contact not found'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contact Details">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-sm text-gray-500">Contact ID: {contact.id}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => router.push(`/messaging?contactId=${contact.id}`)}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Message
          </button>
          <button
            onClick={() => router.push(`/contacts?edit=${contact.id}`)}
            className="inline-flex items-center px-6 py-3 border-2 border-purple-600 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </button>
          <button
            onClick={() => setIsNoteSidebarOpen(true)}
            className="inline-flex items-center px-6 py-3 border-2 border-purple-600 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Notes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-purple-600 mt-1 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1 text-base text-gray-900">{contact.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-purple-600 mt-1 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-base text-gray-900">{contact.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-purple-600 mt-1 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1 text-base text-gray-900">
                    {contact.address1 ? (
                      <>
                        {contact.address1}
                        {contact.city && <>, {contact.city}</>}
                        {contact.state && <> {contact.state}</>}
                        {contact.postalCode && <> {contact.postalCode}</>}
                        {contact.country && <>, {contact.country}</>}
                      </>
                    ) : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <TagIcon className="h-5 w-5 text-purple-600 mt-1 mr-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-base text-gray-500">No tags</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-purple-600 mt-1 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Timezone</p>
                  <p className="mt-1 text-base text-gray-900">{contact.timezone || 'Not specified'}</p>
                </div>
              </div>
              {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500 mb-3">Custom Fields</p>
                  <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                    {Object.entries(contact.customFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{key}</span>
                        <span className="text-sm text-gray-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Sidebar */}
        <NoteSidebar
          contactId={contact.id}
          isOpen={isNoteSidebarOpen}
          onClose={() => setIsNoteSidebarOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
} 