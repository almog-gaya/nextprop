'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Contact } from '@/types';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { timezones } from '@/utils/timezones';
import { ContactListSkeleton } from '@/components/SkeletonLoaders';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  AdjustmentsHorizontalIcon, 
  PlusCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

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

// Define column interface
interface TableColumn {
  id: string;
  label: string;
  key: string;
  visible: boolean;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<TableColumn[]>([]);

  // Define available columns
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: 'name', label: 'Name', key: 'firstName', visible: true },
    { id: 'email', label: 'Email', key: 'email', visible: true },
    { id: 'phone', label: 'Phone', key: 'phone', visible: true },
    { id: 'tags', label: 'Tags', key: 'tags', visible: true },
    { id: 'timezone', label: 'Timezone', key: 'timezone', visible: false },
    { id: 'dnd', label: 'DND Status', key: 'dnd', visible: false },
  ]);

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

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

  useEffect(() => {
    fetchContacts();
  }, [currentPage, contactsPerPage, activeTagFilter]);

  const fetchContacts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: contactsPerPage.toString(),
        ...(forceRefresh && { forceRefresh: 'true' }),
        ...(activeTagFilter && { tag: activeTagFilter }),
      });

      const response = await axios.get(`/api/contacts?${params.toString()}`);

      if (!response.data || !Array.isArray(response.data.contacts)) {
        throw new Error('Invalid contacts data received');
      }

      const processedContacts = response.data.contacts.map((contact: Contact) => ({
        ...contact,
        name: contact?.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
      }));

      setContacts(processedContacts);
      setTotalContacts(response.data.total || processedContacts.length);
      setTotalPages(Math.ceil(response.data.total / contactsPerPage) || 1);
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
    let customFieldsArray: CustomField[] = [];
    
    if (contact.customFields) {
      if (Array.isArray(contact.customFields)) {
        customFieldsArray = contact.customFields as CustomField[];
      } else {
        customFieldsArray = Object.entries(contact.customFields).map(([key, value]) => ({
          id: key,
          key: key,
          value: value as string | string[] | boolean
        }));
      }
    }
    
    setEditContact({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      locationId: contact.locationId || '',
      phone: contact.phone || '',
      timezone: contact.timezone || '',
      dnd: contact.dnd || false,
      tags: contact.tags || [],
      customFields: customFieldsArray,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/contacts/${selectedContact.id}`, formData);

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
      await axios.delete(`/api/contacts/${selectedContact.id}`);

      setContacts(prevContacts => prevContacts.filter(c => c.id !== selectedContact.id));
      setTotalContacts(prev => prev - 1);
      setTotalPages(Math.ceil((totalContacts - 1) / contactsPerPage));
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
      const response = await axios.post('/api/contacts', formData);
      const contactData = response.data.contact;

      if (contactData && contactData.id) {
        const processedContact = {
          ...contactData,
          name: contactData.firstName || (contactData.phone ? `Contact ${contactData.phone.slice(-4)}` : 'Unknown Contact'),
        };

        setContacts(prev => [processedContact, ...prev]);
        setTotalContacts(prev => prev + 1);
        setTotalPages(Math.ceil((totalContacts + 1) / contactsPerPage));
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
      } else {
        toast.error('Invalid response from server');
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
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 z-50"
        onClick={() => {
          if (isEdit) {
            setIsEditModalOpen(false);
          } else {
            setIsAddModalOpen(false);
          }
        }}
      >
        <div 
          className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
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

  const filterContactsByTag = (tag: string | null) => {
    setActiveTagFilter(tag);
    setCurrentPage(1);
  };

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleContactsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setContactsPerPage(newValue);
    setCurrentPage(1);
  };

  const TagFilters = () => {
    const allTags = new Set<string>();
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => allTags.add(tag));
      }
    });

    const uniqueTags = Array.from(allTags).sort();
    const scrapedLeadIndex = uniqueTags.indexOf("scraped-lead");
    if (scrapedLeadIndex > -1) {
      uniqueTags.splice(scrapedLeadIndex, 1);
      uniqueTags.unshift("scraped-lead");
    }

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Tag</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => filterContactsByTag(null)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeTagFilter === null 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All Contacts ({totalContacts})
          </button>
          
          {uniqueTags.map(tag => {
            const count = contacts.filter(c => c.tags && c.tags.includes(tag)).length;
            let tagLabel = tag;
            let tagClass = '';
            
            if (tag === 'scraped-lead') {
              tagLabel = 'Scraped Leads';
              tagClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
            }
            
            return (
              <button
                key={tag}
                onClick={() => filterContactsByTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeTagFilter === tag 
                    ? 'bg-purple-600 text-white' 
                    : tagClass || 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {tagLabel} ({count})
              </button>
            );
          })}
        </div>
        
        {activeTagFilter === 'scraped-lead' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              These scraped contacts have been automatically added to your Leads Pipeline in the "Review New Lead" stage.
              <a href="/opportunities" className="ml-1 font-medium underline">View your Pipeline</a>
            </p>
          </div>
        )}
      </div>
    );
  };

  const PaginationControls = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium 
              ${currentPage === 1 
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Previous
          </button>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium 
              ${currentPage === totalPages 
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{contacts.length > 0 ? (currentPage - 1) * contactsPerPage + 1 : 0}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * contactsPerPage, totalContacts)}
              </span> of{' '}
              <span className="font-medium">{totalContacts}</span> results
            </p>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <label htmlFor="perPage" className="mr-2 text-sm text-gray-700">Show</label>
              <select
                id="perPage"
                value={contactsPerPage}
                onChange={handleContactsPerPageChange}
                className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 
                  ${currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => changePage(1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                      ${currentPage === 1 
                        ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600' 
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  )}
                </>
              )}
              
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => changePage(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                    ${currentPage === number 
                      ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600' 
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                >
                  {number}
                </button>
              ))}
              
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => changePage(totalPages)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                      ${currentPage === totalPages 
                        ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600' 
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 
                  ${currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Toggle column visibility
  const hideColumn = (columnId: string) => {
    setColumns(prevColumns => {
      const updatedColumns = prevColumns.map(column => 
        column.id === columnId ? { ...column, visible: false } : column
      );
      
      const hiddenColumn = prevColumns.find(col => col.id === columnId);
      if (hiddenColumn) {
        setHiddenColumns(prev => [...prev, { ...hiddenColumn, visible: false }]);
      }
      
      return updatedColumns;
    });
  };
  
  // Show a hidden column
  const showColumn = (columnId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(column => 
        column.id === columnId ? { ...column, visible: true } : column
      )
    );
    
    setHiddenColumns(prev => prev.filter(col => col.id !== columnId));
  };

  // Toggle select all contacts
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map(contact => contact.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Toggle select single contact
  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds(prevSelected => {
      if (prevSelected.includes(contactId)) {
        return prevSelected.filter(id => id !== contactId);
      } else {
        return [...prevSelected, contactId];
      }
    });
  };

  // Check if all contacts are selected
  useEffect(() => {
    if (contacts.length > 0 && selectedContactIds.length === contacts.length) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedContactIds, contacts]);

  // Handle bulk delete
  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, you might want to perform a batch delete operation
      await Promise.all(
        selectedContactIds.map(id => axios.delete(`/api/contacts/${id}`))
      );

      setContacts(prevContacts => 
        prevContacts.filter(contact => !selectedContactIds.includes(contact.id))
      );
      setTotalContacts(prev => prev - selectedContactIds.length);
      setTotalPages(Math.ceil((totalContacts - selectedContactIds.length) / contactsPerPage) || 1);
      setIsBulkDeleteModalOpen(false);
      setSelectedContactIds([]);
      toast.success(`${selectedContactIds.length} contacts deleted successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render column manager
  const ColumnManager = () => {
    return (
      <div className="relative">
        <button
          onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
          Manage Columns
        </button>
        
        {isColumnSelectorOpen && (
          <div 
            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 uppercase">Hidden Columns</h3>
            </div>
            <div className="py-1" role="menu" aria-orientation="vertical">
              {hiddenColumns.length > 0 ? (
                hiddenColumns.map(column => (
                  <button
                    key={column.id}
                    onClick={() => showColumn(column.id)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                    {column.label}
                  </button>
                ))
              ) : (
                <p className="px-4 py-2 text-sm text-gray-500 italic">No hidden columns</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isColumnSelectorOpen) {
        setIsColumnSelectorOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isColumnSelectorOpen]);

  // Initialize hidden columns on component mount
  useEffect(() => {
    setHiddenColumns(columns.filter(col => !col.visible));
  }, []);

  // Navigate to messaging page with the specified contact
  const navigateToMessaging = (contactId: string) => {
    router.push(`/messaging?contactId=${contactId}`);
  };

  return (
    <DashboardLayout title="Contacts">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Contacts</h2>
          <div className="flex space-x-3">
            <ColumnManager />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
            >
              Add Contact
            </button>
          </div>
        </div>

        {contacts.length > 0 && <TagFilters />}
        
        {activeTagFilter === 'scraped-lead' && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              These scraped contacts have been automatically added to your Leads Pipeline in the "Review New Lead" stage.
              <a href="/opportunities" className="ml-1 font-medium underline">View your Pipeline</a>
            </p>
          </div>
        )}

        {isAddModalOpen && <ModalContent />}
        {isEditModalOpen && <ModalContent isEdit />}

        {isDeleteModalOpen && selectedContact && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <div 
              className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
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

        {/* Bulk Delete Modal */}
        {isBulkDeleteModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
            onClick={() => setIsBulkDeleteModalOpen(false)}
          >
            <div 
              className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Delete Selected Contacts</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete {selectedContactIds.length} selected contacts? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
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
                    'Delete Selected'
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
          <div>
            {selectedContactIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-purple-50 p-3 rounded-md border border-purple-100">
                <span className="text-sm text-purple-800">
                  <span className="font-medium">{selectedContactIds.length}</span> contacts selected
                </span>
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            )}
            <div className="relative max-w-full overflow-x-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="pl-4 pr-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </th>
                      {columns.filter(column => column.visible).map(column => (
                        <th 
                          key={column.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative"
                        >
                          <div className="flex items-center">
                            <span>{column.label}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                hideColumn(column.id);
                              }}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                              title={`Hide ${column.label} column`}
                            >
                              <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr 
                        key={contact.id} 
                        className="transition-colors"
                      >
                        <td className="pl-4 pr-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={() => toggleSelectContact(contact.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </td>
                        {columns.filter(col => col.visible).map(column => (
                          <td key={column.id} className="px-4 py-4 truncate max-w-[200px]">
                            {column.id === 'name' ? (
                              <button
                                onClick={() => navigateToMessaging(contact.id)}
                                className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:underline"
                              >
                                {contact[column.key as keyof Contact]?.toString() || 'N/A'}
                              </button>
                            ) : column.id === 'tags' ? (
                              <div className="flex flex-wrap gap-1 overflow-hidden">
                                {contact.tags && contact.tags.map((tag, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`px-2 py-1 text-xs rounded-full truncate ${
                                      tag === 'scraped-lead' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : tag === 'review-new-lead' 
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : column.id === 'dnd' ? (
                              contact.dnd ? 'Do Not Disturb' : 'Available'
                            ) : (
                              typeof contact[column.key as keyof Contact] === 'object' 
                                ? 'Complex data' 
                                : (contact[column.key as keyof Contact]?.toString() || 'N/A')
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToMessaging(contact.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            title="Message this contact"
                          >
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(contact);
                            }}
                            className="text-purple-600 hover:text-blue-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(contact);
                            }}
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
            </div>
            <PaginationControls />
          </div>
        ) : (
          <p className="text-gray-500">No contacts found{activeTagFilter ? ` with the tag '${activeTagFilter}'` : ''}.</p>
        )}
      </div>
    </DashboardLayout>
  );
}