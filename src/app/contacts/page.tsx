'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Contact } from '@/types';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { timezones } from '@/utils/timezones';
import { ContactListSkeleton } from '@/components/SkeletonLoaders';

interface CustomField {
  id: string;
  key: string;
  value: string | string[] | boolean;
}

interface PicklistOption {
  value: string;
  name: string;
}

interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldKey: string;
  dataType: 'TEXT' | 'MULTIPLE_OPTIONS' | 'CHECKBOX' | 'STANDARD_FIELD';
  picklistOptions?: PicklistOption[];
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    locationId: 've9EPM428h8vShlRW1KT',
    phone: '',
    timezone: '',
    dnd: false,
    customFields: [] as CustomField[],
    source: 'public api',
    country: 'US',
  });

  const [editContact, setEditContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    locationId: '',
    phone: '',
    timezone: '',
    dnd: false,
    tags: [] as string[],
    customFields: [] as CustomField[],
  });


  useEffect(() => {
    const validateAndFetch = async () => {
      try {
        await Promise.all([fetchContacts(), fetchCustomFields()]);
      } catch (error) {
        console.error('Initial fetch failed:', error);
        router.push('/auth/login?error=validation_failed');
      }
    };
    validateAndFetch();
  }, [router]);

  const fetchContacts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);

      const response = await axios.get(`/api/contacts${forceRefresh ? '?forceRefresh=true' : ''}`, {
      });

      if (!response.data || !Array.isArray(response.data.contacts)) {
        throw new Error('Invalid contacts data received');
      }

      const processedContacts = response.data.contacts.map((contact: Contact) => ({
        ...contact,
        name: contact?.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
      }));

      setContacts(processedContacts);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contacts');
      setIsLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const fields: CustomFieldDefinition[] = [
        {
          id: "ECqyHR21ZJnSMolxlHpU",
          dataType: "STANDARD_FIELD",
          fieldKey: "contact.type",
          name: "Contact Type",
          picklistOptions: [
            { value: "lead", name: "Lead" },
            { value: "customer", name: "Customer" }
          ]
        }
      ];
      setCustomFields(fields);
    } catch (err: any) {
      console.error('Failed to fetch custom fields:', err);
      toast.error('Failed to load custom fields');
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setEditContact({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      locationId: contact.locationId || '',
      phone: contact.phone || '',
      timezone: contact.timezone || '',
      dnd: contact.dnd || false,
      tags: contact.tags || [],
      customFields: contact.customFields || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/contacts/${selectedContact.id}`, formData, {
      });

      if (response.data) {
        setContacts(prevContacts =>
          prevContacts.map(c => c.id === selectedContact.id ? { ...c, ...response.data } : c)
        );
        toast.success('Contact updated successfully');
        setIsEditModalOpen(false);
        setSelectedContact(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`/api/contacts/${selectedContact.id}`, {
      });

      setContacts(prevContacts => prevContacts.filter(c => c.id !== selectedContact.id));
      setIsDeleteModalOpen(false);
      toast.success('Contact deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete contact');
    } finally {
      setIsSubmitting(false);
      setSelectedContact(null);
    }
  };

  const handleAdd = async (formData: any) => {
    setIsSubmitting(true);

    if (!formData.firstName) {
      toast.error('First Name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/contacts', formData, {
      });

      if (response.data && response.data.id) {
        setContacts(prevContacts => [response.data as Contact, ...prevContacts]);
        toast.success('Contact added successfully');
        setIsAddModalOpen(false);
        setNewContact({
          firstName: '',
          lastName: '',
          email: '',
          locationId: 've9EPM428h8vShlRW1KT',
          phone: '',
          timezone: '',
          dnd: false,
          customFields: [],
          source: 'public api',
          country: 'US',
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCustomFieldInput = (field: CustomFieldDefinition, value: any, onChange: (value: any) => void) => {
    const options = field.picklistOptions?.map(option => ({
      value: option.value,
      label: option.name
    })) || [];

    const fieldValue = Array.isArray(value)
      ? value.find((v: any) => v.id === field.id)?.value || ''
      : value || (field.dataType === 'CHECKBOX' ? [] : '');

    if (field.picklistOptions && field.picklistOptions.length > 0) {
      return (
        <select
          value={typeof fieldValue === 'string' ? fieldValue : ''}
          onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
          disabled={isSubmitting}
        >
          <option value="">Select {field.name}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    switch (field.dataType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
            placeholder={`Enter ${field.name}`}
            disabled={isSubmitting}
          />
        );
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {options.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(fieldValue) ? fieldValue.includes(option.value) : false}
                  onChange={(e) => {
                    const newValue = Array.isArray(fieldValue) ? [...fieldValue] : [];
                    if (e.target.checked) {
                      newValue.push(option.value);
                    } else {
                      const index = newValue.indexOf(option.value);
                      if (index > -1) newValue.splice(index, 1);
                    }
                    onChange({ id: field.id, key: field.fieldKey, value: newValue });
                  }}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
            placeholder={`Enter ${field.name}`}
            disabled={isSubmitting}
          />
        );
    }
  };

  const ModalContent = ({ isEdit = false }) => {
    const [formData, setFormData] = useState(isEdit ? editContact : newContact);

    // Sync formData when editContact or newContact changes (e.g., when modal opens)
    useEffect(() => {
      setFormData(isEdit ? editContact : newContact);
    }, [isEdit, editContact, newContact]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isEdit) {
        handleUpdate(formData);
      } else {
        handleAdd(formData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6">
        <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative">
          <button
            onClick={() => {
              if (isEdit) {
                setIsEditModalOpen(false);
              } else {
                setIsAddModalOpen(false);
                setNewContact({
                  firstName: '',
                  lastName: '',
                  email: '',
                  locationId: 've9EPM428h8vShlRW1KT',
                  phone: '',
                  timezone: '',
                  dnd: false,
                  customFields: [],
                  source: 'public api',
                  country: 'US',
                });
              }
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">{isEdit ? 'Edit Contact' : 'Add New Contact'}</h3>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6">{isEdit ? 'Update contact details below' : 'Create a new contact by filling in the details below'}</p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                  disabled={isSubmitting}
                >
                  {timezones.map(timezone => (
                    <option key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={formData.dnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, dnd: e.target.checked }))}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  Do Not Disturb
                </label>
              </div>

              {/* Dynamic Custom Fields */}
              {customFields.map(field => {
                const customFieldValue = formData.customFields.find(cf => cf.id === field.id)?.value ||
                  (field.dataType === 'CHECKBOX' ? [] : '');

                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                    {renderCustomFieldInput(field, customFieldValue, (value) => {
                      const updatedCustomFields = [...formData.customFields.filter(cf => cf.id !== field.id), value];
                      setFormData(prev => ({ ...prev, customFields: updatedCustomFields }));
                    })}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (isEdit) {
                    setIsEditModalOpen(false);
                  } else {
                    setIsAddModalOpen(false);
                    setNewContact({
                      firstName: '',
                      lastName: '',
                      email: '',
                      locationId: 've9EPM428h8vShlRW1KT',
                      phone: '',
                      timezone: '',
                      dnd: false,
                      customFields: [],
                      source: 'public api',
                      country: 'US',
                    });
                  }
                }}
                className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-2 text-white rounded-md text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                    {isEdit ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  isEdit ? 'Update Contact' : 'Add Contact'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Contacts">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Contacts</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            Add Contact
          </button>
        </div>

        {isAddModalOpen && <ModalContent />}
        {isEditModalOpen && <ModalContent isEdit />}

        {isDeleteModalOpen && selectedContact && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white/95 backdrop-blur-sm border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Delete Contact</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{selectedContact.firstName}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <ContactListSkeleton />
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <p>{error}</p>
          </div>
        ) : contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.firstName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags && contact.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No contacts found.</p>
        )}
      </div>
    </DashboardLayout>
  );
}