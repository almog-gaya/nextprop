'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { timezones } from '@/utils/timezones';
import { ContactListSkeleton } from '@/components/SkeletonLoaders';
import {
  ChevronLeftIcon, ChevronRightIcon, AdjustmentsHorizontalIcon, ChatBubbleLeftRightIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, DocumentTextIcon, PencilIcon, TrashIcon, TagIcon, StarIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentDuplicateIcon, PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import BulkAddToPipelineStage from '@/components/contacts/BulkAddToPipelineStage';
import { Contact } from '@/types';
import BulkUploadForm from '@/components/BulkUploadForm';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationDisplay } from '@/types/messageThread';
import { IconButton } from '@/components/ui/iconButton';
import { Input } from '@/components/ui/input';
import { CrossIcon, Search } from 'lucide-react';
import {
  FaPlus,
  FaFilter,
  FaRobot,
  FaComment,
  FaEnvelope,
  FaPaperclip,
  FaEye,
  FaTrash,
  FaStar,
  FaUpload,
  FaDownload,
  FaTh,
  FaWhatsapp,
  FaCopy,
  FaIcons
} from 'react-icons/fa';
import PipelineChangeModal from '@/components/contacts/PipelineChangeModal';
import AddTagsModal from '@/components/contacts/AddTagsModal';
import RemoveTagsModal from '@/components/contacts/RemoveTagsModal';
import DeleteContactsModal from '@/components/contacts/DeleteContactsModal';
import ExportContactsModal from '@/components/contacts/ExportContactsModal';
import ContactTasksTab from '@/components/contacts/ContactTasksTab';
import { CloseButton } from '@headlessui/react';
import ManageSmartListsTab from '@/components/contacts/ManageSmartListsTab';
import ContactModal from '@/components/contacts/ContactModal';
import PhoneLookupModal from '@/components/contacts/PhoneLookupModal';
import BulkMessagingModal from '@/components/contacts/BulkMessagingModal';
import BulkDeleteModal from '@/components/contacts/BulkDeleteModal';
import { showInfo } from '@/lib/toast';

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
  const [isBulkAddOpportunities, setIsBulkAddOpportunities] = useState(false);
  const [isBulkMessagingModalOpen, setIsBulkMessagingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [phoneDetails, setPhoneDetails] = useState<any>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedMessageType, setSelectedMessageType] = useState<'sms' | 'email' | 'voicemail' | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isPipelineChangeModalOpen, setIsPipelineChangeModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);
  const [showAddTagTooltip, setShowAddTagTooltip] = useState(false);
  const [isRemoveTagsModalOpen, setIsRemoveTagsModalOpen] = useState(false);
  const [showRemoveTagTooltip, setShowRemoveTagTooltip] = useState(false);
  const [isDeleteContactsModalOpen, setIsDeleteContactsModalOpen] = useState(false);
  const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);
  const [isExportContactsModalOpen, setIsExportContactsModalOpen] = useState(false);
  // State for applied filters
  const [appliedFilters, setAppliedFilters] = useState<any[]>([]);
  const [showFilterSummary, setShowFilterSummary] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'smartlists' | 'tasks' | 'manage-smartlists'>('smartlists');

  const [columns, setColumns] = useState<TableColumn[]>([
    { id: 'name', label: 'Name', key: 'name', visible: true },
    { id: 'email', label: 'Email', key: 'email', visible: true },
    { id: 'phone', label: 'Phone', key: 'phone', visible: true },
    { id: 'tags', label: 'Tags', key: 'tags', visible: true },
    { id: 'type', label: 'Type', key: 'type', visible: false },
    { id: 'timezone', label: 'Timezone', key: 'timezone', visible: false },
    { id: 'dnd', label: 'DND Status', key: 'dnd', visible: false },
    { id: 'source', label: 'Source', key: 'source', visible: false },
    { id: 'address1', label: 'Address', key: 'address1', visible: false },
    { id: 'city', label: 'City', key: 'city', visible: false },
    { id: 'state', label: 'State', key: 'state', visible: false },
    { id: 'country', label: 'Country', key: 'country', visible: false },
    { id: 'postalCode', label: 'Postal Code', key: 'postalCode', visible: false },
  ]);

  const [newContact, setNewContact] = useState<Contact>({
    id: '',
    name: '',
    firstName: '',
    lastName: '',
    locationId: '',
    email: '',
    phone: '',
    tags: [],
    timezone: '',
    dnd: false,
    customFields: {},
    source: '',
    postalCode: '',
    city: '',
    state: '',
    country: 'US',
    address1: '',
  });

  const [editContact, setEditContact] = useState<Contact>({
    id: '',
    name: '',
    firstName: '',
    lastName: '',
    locationId: '',
    email: '',
    phone: '',
    tags: [],
    timezone: '',
    dnd: false,
    customFields: {},
    source: '',
    postalCode: '',
    city: '',
    state: '',
    country: '',
    address1: '',
    createdAt: '',
    updatedAt: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [lastContactId, setLastContactId] = useState<string | null>(null);

  const getAppropriateType = (type: string) => {
    switch (type) {
      case 'TYPE_PHONE':
        return 'SMS';
      case 'TYPE_EMAIL':
      case 'TYPE_CUSTOM_EMAIL':
        return 'Email';
      default:
        return 'SMS';
    }
  };

  const { user } = useAuth();
  const hasPhoneNumbers = (user?.phoneNumbers?.length ?? 0) > 0;
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isBulkInProcess, setIsBulkInProcess] = useState(false);
  useEffect(() => {
    if (hasPhoneNumbers) {
      setSelectedNumber(user!.phoneNumbers![0].phoneNumber);
    }
  }, [hasPhoneNumbers, user?.phoneNumbers]);

  const handleSend = async (contact: any) => {
    const conversationType = selectedMessageType == 'sms' ? 'TYPE_PHONE' : 'TYPE_EMAIL';

    if (!conversationType) return;

    if (conversationType === 'TYPE_PHONE' && !hasPhoneNumbers) {
      toast.error('No available phone number to send SMS');
      return;
    }
    try {
      const payload = {
        type: getAppropriateType(conversationType),
        body: smsText,
        text: smsText,
        message: smsText,
        contactId: contact.id,
        ...(conversationType === 'TYPE_PHONE' && {
          toNumber: contact!.phone,
          fromNumber: selectedNumber,
        }),
        ...(conversationType === 'TYPE_EMAIL' && {
          html: emailBody,
          emailTo: contact!.email,
          subject: emailSubject,
          emailFrom: 'no-reply@gmail.com',
          body: smsText,
          text: smsText,
          message: smsText,
        }),
      };

      console.log(`[payload]: ${JSON.stringify(payload)}`);
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return await response.json();

    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to start new conversation');
    }
  };

  const bulkSendEmailOrSMS = async () => {
    if (selectedMessageType === 'voicemail') {
      router.push('/ringless-voicemails');
      return;
    }
    if (!selectedContacts || selectedContacts.length === 0) {
      toast.error('No contacts selected for bulk action');
      return;
    }
    if (selectedMessageType === 'sms') {
      if (!hasPhoneNumbers) {
        toast.error('No available phone number to send SMS');
        return;
      }
      if (!selectedNumber) {
        toast.error('Please select a phone number to send SMS');
        return;
      }
    }

    let successCount = 0;
    const totalContacts = selectedContacts.length;

    try {
      setIsBulkInProcess(true);
      // Use Promise.all to wait for all sends to complete
      const results = await Promise.all(
        selectedContacts.map(async (contact) => {
          try {
            const response = await handleSend(contact);
            if (response && (response.msg || response.messageId)) {
              successCount++;
            }
            return response;
          } catch (error) {
            console.error('Failed to send to contact:', contact.id, error);
            return null;
          }
        })
      );

      // Show final result
      toast.success(
        `Bulk messaging completed! Successfully sent to ${successCount} out of ${totalContacts} contacts`
      );
      setIsBulkMessagingModalOpen(false)
    } catch (error) {
      console.error('Bulk messaging failed:', error);
      toast.error(
        `Bulk messaging completed with errors. Successfully sent to ${successCount} out of ${totalContacts} contacts`
      );
    } finally {
      setIsBulkInProcess(false);
    }
  };

  // Load columns from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem('contactColumns');
    if (savedColumns) {
      const parsedColumns = JSON.parse(savedColumns);
      setColumns(prev => {
        const mergedColumns = [...prev];
        parsedColumns.forEach((savedCol: TableColumn) => {
          const index = mergedColumns.findIndex(col => col.id === savedCol.id);
          if (index !== -1) {
            mergedColumns[index].visible = savedCol.visible; // Update visibility
          } else {
            mergedColumns.push(savedCol); // Add any new columns from localStorage
          }
        });
        console.log('Merged columns from localStorage:', mergedColumns); // Debug log
        return mergedColumns;
      });
    }
  }, []);

  // Save columns to localStorage
  useEffect(() => {
    localStorage.setItem('contactColumns', JSON.stringify(columns));
  }, [columns]);

  // Add custom fields to columns
  useEffect(() => {
    if (customFields.length > 0) {
      const customColumns = customFields.map(field => ({
        id: field.id,
        label: field.name,
        key: field.fieldKey,
        visible: false,
      }));
      setColumns(prev => {
        const existingIds = new Set(prev.map(col => col.id));
        const newColumns = customColumns.filter(col => !existingIds.has(col.id));
        const updatedColumns = [...prev, ...newColumns];
        console.log('Updated columns:', updatedColumns); // Debug log
        return updatedColumns;
      });
    }
  }, [customFields]);

  // Fetch data
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

  const fetchContacts = async () => {
    try {
      console.log(`Fetching contacts for page ${currentPage}... limit: ${contactsPerPage}`);
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: contactsPerPage.toString(),
        ...(activeTagFilter && { tag: activeTagFilter }),
        ...(currentPage > 1 && lastContactId && { startAfter: lastContactId }), // Pass last contact ID
      });
      const response = await axios.get(`/api/contacts?${params.toString()}`);
      const processedContacts = response.data.contacts.map((contact: Contact) => ({
        ...contact,
        name: contact.name || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
      }));
      setContacts(processedContacts);
      setLastContactId(processedContacts[processedContacts.length - 1]?.id || ''); // Update last contact ID
      const total = response.data.total;
      setTotalContacts(total);
      const newTotalPages = Math.ceil(total / contactsPerPage) || 1;
      setTotalPages(newTotalPages);
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages); // Adjust page if needed
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contacts');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage, contactsPerPage, activeTagFilter]);


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
            { value: "customer", name: "Customer" },
          ],
        },
      ];
      setCustomFields(fields);
    } catch (err: any) {
      toast.error('Failed to load custom fields');
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    // Convert customFields array to object
    const customFieldsObject: { [key: string]: string | number | boolean | null } = {};
    if (contact.customFields) {
      if (Array.isArray(contact.customFields)) {
        contact.customFields.forEach((field: CustomField) => {
          customFieldsObject[field.key] = field.value as string | number | boolean | null;
        });
      } else {
        Object.assign(customFieldsObject, contact.customFields);
      }
    }

    setEditContact({
      id: contact.id,
      name: contact.name || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      locationId: contact.locationId || '',
      email: contact.email || '',
      phone: contact.phone || '',
      tags: contact.tags || [],
      timezone: contact.timezone || '',
      dnd: contact.dnd || false,
      customFields: customFieldsObject,
      source: contact.source || '',
      postalCode: contact.postalCode || '',
      city: contact.city || '',
      state: contact.state || '',
      country: contact.country || '',
      address1: contact.address1 || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: Contact) => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/contacts/${selectedContact.id}`, formData);
      if (response.data) {
        setContacts(prev =>
          prev.map(c => (c.id === selectedContact.id ? { ...c, ...response.data } : c))
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
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
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

  const handleAdd = async (formData: Contact) => {
    setIsSubmitting(true);
    if (!formData.name && !formData.firstName) {
      toast.error('Name or First Name is required');
      setIsSubmitting(false);
      return;
    }
    try {
      // Transform customFields object to array if needed
      let customFieldsArray: { key: string; value: string | string[] | boolean }[] = [];
      if (formData.customFields && typeof formData.customFields === 'object' && !Array.isArray(formData.customFields)) {
        customFieldsArray = Object.entries(formData.customFields).map(([key, value]) => ({
          key,
          value: value === null ? '' : typeof value === 'number' ? String(value) : value
        }));
      }
      const payload = {
        ...formData,
        customFields: customFieldsArray
      };
      const response = await axios.post('/api/contacts', payload);
      const contactData = response.data.contact;
      if (contactData && contactData.id) {
        const processedContact = {
          ...contactData,
          name: contactData.name || contactData.firstName || (contactData.phone ? `Contact ${contactData.phone.slice(-4)}` : 'Unknown Contact'),
        };
        setContacts(prev => [processedContact, ...prev]);
        setTotalContacts(prev => prev + 1);
        setTotalPages(Math.ceil((totalContacts + 1) / contactsPerPage));
        toast.success('Contact added successfully');
        setIsAddModalOpen(false);
        setNewContact({
          id: '',
          name: '',
          firstName: '',
          lastName: '',
          locationId: user?.locationId || '',
          email: '',
          phone: '',
          tags: [],
          timezone: '',
          dnd: false,
          customFields: {},
          source: '',
          postalCode: '',
          city: '',
          state: '',
          country: 'US',
          address1: '',
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
      label: option.name,
    })) || [];
    const fieldValue = Array.isArray(value)
      ? value.find((v: any) => v.id === field.id)?.value || ''
      : value || (field.dataType === 'CHECKBOX' ? [] : '');

    if (field.picklistOptions && field.picklistOptions.length > 0) {
      return (
        <select
          value={typeof fieldValue === 'string' ? fieldValue : ''}
          onChange={e => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          className="mt-1 block w-full  text-sm"
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
            onChange={e => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
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
                  onChange={e => {
                    const newValue = Array.isArray(fieldValue) ? [...fieldValue] : [];
                    if (e.target.checked) newValue.push(option.value);
                    else newValue.splice(newValue.indexOf(option.value), 1);
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
            onChange={e => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            placeholder={`Enter ${field.name}`}
            disabled={isSubmitting}
          />
        );
    }
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
    contacts.forEach(contact => contact.tags?.forEach(tag => allTags.add(tag)));
    const uniqueTags = Array.from(allTags).sort();
    const scrapedLeadIndex = uniqueTags.indexOf('scraped-lead');
    if (scrapedLeadIndex > -1) {
      uniqueTags.splice(scrapedLeadIndex, 1);
      uniqueTags.unshift('scraped-lead');
    }

    return (
      <div className="mb-8 mt-4">
        <span className="text-[18px] font-bold text-gray-700 mb-2 ">Filter by Tag</span>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => filterContactsByTag(null)}
            className={`px-3 py-1 rounded-full text-sm ${activeTagFilter === null ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            All Contacts ({totalContacts})
          </button>
          {uniqueTags.map(tag => {
            const count = contacts.filter(c => c.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => filterContactsByTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${activeTagFilter === tag ? 'bg-purple-600 text-white' : tag === 'scraped-lead' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                {tag === 'scraped-lead' ? 'Scraped Leads' : tag} ({count})
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const PaginationControls = () => {
    const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
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
      <div className="flex items-center justify-end w-full text-[#2196f3] text-sm space-x-2 py-2 px-2 bg-[#f7fafd] border-t border-b border-[#e3eaf3]">
        <span className="text-[#333]">
          Total <strong>{totalContacts}</strong> records | <strong>{currentPage}</strong> of {totalPages} Pages
        </span>
        <button
          className="ml-2 hover:underline focus:outline-none"
          disabled={currentPage === 1}
          onClick={() => changePage(1)}
          style={{ color: currentPage === 1 ? '#b0b0b0' : '#2196f3' }}
        >
          Go To First
        </button>
        <button
          className="px-1"
          disabled={currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          style={{ color: currentPage === 1 ? '#b0b0b0' : '#2196f3' }}
        >
          &#60;
        </button>
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => changePage(number)}
            className={`px-2 py-1 rounded ${currentPage === number ? 'bg-[#2196f3] text-white' : 'hover:bg-[#e3eaf3]'} font-semibold`}
            style={{ minWidth: 28 }}
          >
            {number}
          </button>
        ))}
        <button
          className="px-1"
          disabled={currentPage === totalPages}
          onClick={() => changePage(currentPage + 1)}
          style={{ color: currentPage === totalPages ? '#b0b0b0' : '#2196f3' }}
        >
          &#62;
        </button>
        <div className="relative ml-2">
          <button
            className="hover:underline focus:outline-none flex items-center"
            onClick={() => setShowPageSizeDropdown((v) => !v)}
          >
            Page Size: {contactsPerPage}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showPageSizeDropdown && (
            <div className="fixed transform -translate-y-full mt-[-8px] w-24 bg-white border border-gray-200 rounded shadow-lg z-[9999]">
              {[10, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#e3eaf3] ${contactsPerPage === size ? 'text-[#2196f3] font-bold' : 'text-[#333]'}`}
                  onClick={() => {
                    setContactsPerPage(size);
                    setShowPageSizeDropdown(false);
                    setCurrentPage(1);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev =>
      prev.map(column => (column.id === columnId ? { ...column, visible: !column.visible } : column))
    );
  };

  const ColumnManager = () => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsColumnSelectorOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsColumnSelectorOpen(!isColumnSelectorOpen);
          }}
          className="px-4 py-2 bg-white border border-[#e3eaf3] rounded-lg text-base font-normal text-black flex items-center min-w-[110px] shadow-sm hover:bg-[#f7fafd] transition"
        >
          Columns
          <svg className="ml-2 w-4 h-4 text-[#2196f3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isColumnSelectorOpen && (
          <div className="absolute left-2 mt-2 w-50  shadow-lg bg-white border border-purple-200 ring-opacity-5 z-[9999]">
            {/* <div className="p-2 border-b border-gray-100">
              <h6 className="text-xs font-medium text-gray-500 uppercase">Columns</h6>
            </div> */}
            <div className="py-1 max-h-80 overflow-y-auto">
              {columns.map(column => (
                <label
                  key={column.id}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => toggleColumnVisibility(column.id)}
                    className="mr-2 h-4 w-4 appearance-none border-2 border-purple-200 rounded checked:bg-white checked:border-purple-600 focus:ring-purple-500 focus:ring-2 focus:ring-offset-0"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = () => setIsColumnSelectorOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isColumnSelectorOpen]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts);
    }
    setIsAllSelected(!isAllSelected);
  };

  const toggleSelectContact = (contact: Contact) => {
    setSelectedContacts(prev =>
      prev.includes(contact) ? prev.filter(c => c.id !== contact.id) : [...prev, contact]
    );
  };

  useEffect(() => {
    setIsAllSelected(contacts.length > 0 && selectedContacts.length === contacts.length);
  }, [selectedContacts, contacts]);

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      const shouldReloadAll = selectedContacts.length >= contactsPerPage;
      await Promise.all(selectedContacts.map(contact => axios.delete(`/api/contacts/${contact.id}`)));
      setContacts(prev => prev.filter(contact => !selectedContacts.includes(contact)));
      setTotalContacts(prev => prev - selectedContacts.length);
      setTotalPages(Math.ceil((totalContacts - selectedContacts.length) / contactsPerPage) || 1);
      setIsBulkDeleteModalOpen(false);
      setSelectedContacts([]);
      toast.success(`${selectedContacts.length} contacts deleted successfully`);
      //get all contacts
      //delay for 1 second
      if (shouldReloadAll) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setContacts([]);
        setCurrentPage(1);
        setTotalContacts(0);
        await fetchContacts();
      }

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCell = (column: TableColumn, contact: Contact) => {
    switch (column.key) {
      case 'name':
        return (
          <div
            onClick={() => router.push(`/contacts/${contact.id}`)}
            className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer hover:underline"
          >
            {contact.name || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact')}
          </div>
        );
      case 'email':
        return contact.email || '-';
      case 'phone':
        return contact.phone || '-';
      case 'tags':
        return contact.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : '-';
      case 'type':
        return contact.type || '-';
      case 'timezone':
        return contact.timezone || '-';
      case 'dnd':
        return contact.dnd ? 'Yes' : 'No';
      case 'source':
        return contact.source || '-';
      case 'address1':
        return contact.address1 || '-';
      case 'city':
        return contact.city || '-';
      case 'state':
        return contact.state || '-';
      case 'country':
        return contact.country || '-';
      case 'postalCode':
        return contact.postalCode || '-';
      default:
        return '-';
    }
  };

  const lookupPhoneNumber = async (phone: string) => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }
    setVerificationStatus('loading');
    setVerificationMessage('');
    setPhoneDetails(null);
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    try {
      const response = await axios.post('/api/twilio/verify', { phone: formattedPhone });
      if (response.data?.success) {
        setVerificationStatus('success');
        setVerificationMessage('Phone number validated successfully');
        setPhoneDetails(response.data.data);
        toast.success('Phone number validated');
      } else {
        throw new Error(response.data?.error || 'Failed to validate phone number');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.details?.message || err.response?.data?.error || err.message || 'Failed to validate phone number';
      setVerificationStatus('error');
      setVerificationMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const resetVerificationModal = () => {
    setVerifyPhoneNumber('');
    setVerificationStatus('idle');
    setVerificationMessage('');
    setPhoneDetails(null);
  };

  const handleBulkUpload = async (contacts: { firstName: string; lastName: string; phone: string; street: string; city: string; state: string; pipelineId: any; email?: string; notes?: string; zipCode?: string; stageId?: string }[]) => {
    let selectedPipelineId = null;
    let selectedStageId = null;
    setIsSubmitting(true);
    try {
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
      const failedUploads = uploadResults.length - successfulUploads.length;
      const processedContacts = successfulUploads.map((result) => {
        const contact = result.contact!;
        return {
          ...contact,
          name: contact.name || contact.firstName || (contact.phone ? `Contact ${contact.phone.slice(-4)}` : 'Unknown Contact'),
        };
      });

      setContacts((prev) => [...processedContacts, ...prev]);
      setTotalContacts((prev) => prev + processedContacts.length);
      setTotalPages(Math.ceil((totalContacts + processedContacts.length) / contactsPerPage));

      if (successfulUploads.length === contacts.length) {
        toast.success(`${successfulUploads.length} contacts added successfully`);
      } else if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} out of ${contacts.length} contacts have been uploaded successfully`);
      } else {
        if (failedUploads > 0) {
          toast.error(`${failedUploads} contact(s) failed to upload either due to invalid phone number or already exists.`);
        }
      }

      if (selectedPipelineId && selectedStageId) {
        await addContactsToPipeline(selectedPipelineId, selectedStageId, processedContacts);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add contacts');
      throw err; // Re-throw to be caught by the BulkUploadForm
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
      return { successful: [], failed: contacts.map((contact: any) => ({ contact, success: false, error })) };
    }
  };

  ///Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false); // New state for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Use ref to store timeout
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
      setError('Failed to search contacts');
      toast.error('Failed to search contacts');
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

  // Add this component before the main ContactsPage component
  const FilterModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    // All filter fields as shown in the image
    const filterFields = [
      { key: 'businessName', label: 'Business Name' },
      { key: 'companyName', label: 'Company Name' },
      { key: 'email', label: 'Email' },
      { key: 'firstName', label: 'First Name' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'tag', label: 'Tag' },
      { key: 'dnd', label: 'DND' },
      { key: 'created', label: 'Created' },
    ];

    const [selectedOperator, setSelectedOperator] = useState('is');
    const [filterValue, setFilterValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      setSelectedOperator('is');
      setFilterValue('');
    }, [activeFilter]);

    const renderFilterSummary = () => (
      <div className="flex flex-col h-full">
        {/* Clear all filters */}
        <button onClick={handleClearAll} className="text-blue-500 text-sm px-6 py-2 text-left hover:underline">Clear all filters</button>
        {/* Filter cards */}
        <div className="flex-1 px-6 pb-4">
          {appliedFilters.map((filter, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-blue-700 font-medium">{filter.label}:</span>
                <span className="ml-1 text-sm text-gray-700">{filter.operator === 'is_empty' ? 'Is empty' : filter.operator === 'is_not_empty' ? 'Is not empty' : `${filter.operator.replace('_', ' ')} ${filter.value}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditFilter(idx)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6H3v6z" /></svg>
                </button>
                <button onClick={() => handleDeleteFilter(idx)} className="p-1 hover:bg-gray-100 rounded" title="Delete">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          {/* AND/OR buttons */}
          <button className="flex items-center gap-1 px-3 py-1 border border-gray-200 rounded mb-2 text-sm text-gray-700 hover:bg-gray-50">
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg>
            AND
          </button>
          <button className="flex items-center gap-1 px-3 py-1 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50">
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg>
            OR
          </button>
        </div>
        {/* Save as smart list button */}
        <div className="px-6 pb-6">
          <button
            onClick={() => setIsImagePopupOpen(true)}
            className="w-full py-2 bg-gray-50 border border-gray-200 rounded text-gray-700 font-medium flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            Save as smart list
          </button>
        </div>
      </div>
    );

    const handleApply = () => {
      // Add the filter to appliedFilters and show summary UI
      if (activeFilter) {
        setAppliedFilters(prev => [
          ...prev,
          {
            key: activeFilter,
            label: filterFields.find(f => f.key === activeFilter)?.label || activeFilter,
            operator: selectedOperator,
            value: filterValue,
          },
        ]);
        setShowFilterSummary(true);
        setActiveFilter(null);
      }
    };

    const handleClearAll = () => {
      setAppliedFilters([]);
      setShowFilterSummary(false);
      setActiveFilter(null);
    };

    const handleEditFilter = (idx: number) => {
      const filter = appliedFilters[idx];
      setActiveFilter(filter.key);
      setShowFilterSummary(false);
      // Optionally prefill operator/value
    };

    const handleDeleteFilter = (idx: number) => {
      setAppliedFilters(prev => prev.filter((_, i) => i !== idx));
      if (appliedFilters.length === 1) setShowFilterSummary(false);
    };

    const renderFilterDetails = (filterKey: string) => (
      <div className="p-6">
        <button onClick={() => setActiveFilter(null)} className="mb-4 text-blue-500 flex items-center">
          <ChevronLeftIcon className="h-5 w-5 mr-1" /> Back
        </button>
        <h3 className="text-lg font-semibold mb-2">{filterFields.find(f => f.key === filterKey)?.label}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is'}
                onChange={() => setSelectedOperator('is')}
              />
              <span className='mb-0.5'>Is</span>
            </div>
            <div className="relative m-2">
              <input
                type="search"
                className="w-full pl-10 pr-3 py-2  border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                placeholder="Please Input"
                value={searchTerm}
                onChange={e => setFilterValue(e.target.value)}
                disabled={selectedOperator !== 'is'}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
            </div>

            <p className="text-xs text-gray-500 m-2">
              Matches entries based on the exact whole word or phrase specified. Example: If you want to search for 'Field Value', you can search by 'Field' or 'Value'
            </p>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_not'}
                onChange={() => setSelectedOperator('is_not')}
              />
              <span className='mb-0.5'>Is not</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_empty'}
                onChange={() => setSelectedOperator('is_empty')}
              />
              <span className='mb-0.5'>Is empty</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="filterOperator"
                checked={selectedOperator === 'is_not_empty'}
                onChange={() => setSelectedOperator('is_not_empty')}
              />
              <span className='mb-0.5'>Is not empty</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="px-4 py-2 bg-gray-100 rounded mr-2" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleApply}>Apply</button>
        </div>
      </div>
    );

    // Filter fields by search term
    const filteredFields = filterFields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
        {/* Drawer */}
        <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300" style={{ minWidth: 360 }}>
          {/* Always show the filter header at the top */}
          <div className="flex items-center px-6 pt-6 pb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full mr-3">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="20" fill="#9806FF" fill-opacity="0.14" />
                <path d="M18.5012 14.0046H28.2431M18.5012 14.0046C18.5012 14.4021 18.3433 14.7833 18.0622 15.0644C17.7812 15.3455 17.4 15.5034 17.0025 15.5034C16.605 15.5034 16.2238 15.3455 15.9427 15.0644C15.6616 14.7833 15.5037 14.4021 15.5037 14.0046M18.5012 14.0046C18.5012 13.6071 18.3433 13.2259 18.0622 12.9448C17.7812 12.6638 17.4 12.5059 17.0025 12.5059C16.605 12.5059 16.2238 12.6638 15.9427 12.9448C15.6616 13.2259 15.5037 13.6071 15.5037 14.0046M15.5037 14.0046H11.7568M18.5012 25.9946H28.2431M18.5012 25.9946C18.5012 26.3921 18.3433 26.7733 18.0622 27.0544C17.7812 27.3355 17.4 27.4934 17.0025 27.4934C16.605 27.4934 16.2238 27.3355 15.9427 27.0544C15.6616 26.7733 15.5037 26.3921 15.5037 25.9946M18.5012 25.9946C18.5012 25.5971 18.3433 25.2159 18.0622 24.9348C17.7812 24.6538 17.4 24.4959 17.0025 24.4959C16.605 24.4959 16.2238 24.6538 15.9427 24.9348C15.6616 25.2159 15.5037 25.5971 15.5037 25.9946M15.5037 25.9946H11.7568M24.4962 19.9996H28.2431M24.4962 19.9996C24.4962 20.3971 24.3383 20.7783 24.0572 21.0594C23.7762 21.3405 23.395 21.4984 22.9975 21.4984C22.6 21.4984 22.2188 21.3405 21.9377 21.0594C21.6566 20.7783 21.4987 20.3971 21.4987 19.9996M24.4962 19.9996C24.4962 19.6021 24.3383 19.2209 24.0572 18.9398C23.7762 18.6588 23.395 18.5009 22.9975 18.5009C22.6 18.5009 22.2188 18.6588 21.9377 18.9398C21.6566 19.2209 21.4987 19.6021 21.4987 19.9996M21.4987 19.9996H11.7568" stroke="#9C03FF" stroke-width="1.49902" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 leading-tight">Filters</p>
              <p className="text-xs text-gray-500">Showing {contacts.length} records</p>
            </div>
            <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-gray-100">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* The rest of your conditional rendering */}
          {showFilterSummary && appliedFilters.length > 0 ? (
            renderFilterSummary()
          ) : activeFilter ? (
            renderFilterDetails(activeFilter)
          ) : (
            <div className="px-6 pb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 mt-2">Most Used</h4>
              <div className="space-y-2">
                {filteredFields.map((field) => (
                  <button
                    key={field.key}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 border border-transparent transition"
                    onClick={() => setActiveFilter(field.key)}
                  >
                    <span>{field.label}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add the ImagePopup */}
        <ImagePopup isOpen={isImagePopupOpen} onClose={() => setIsImagePopupOpen(false)} />
      </div>
    );
  };

  // InfoModal component
  const InfoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-lg font-semibold text-gray-700">Info</span>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mb-8 text-gray-700">Select one or more contact to start this operation</div>
          <div className="flex justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              onClick={onClose}
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dummy delete handler (replace with real logic as needed)
  const handleDeleteContacts = () => {
    confirmBulkDelete();
    setIsDeleteContactsModalOpen(false);
  };

  const handleExportIconClick = () => {
    if (selectedContacts.length === 0) {
      setIsInfoModalOpen(true);
    } else {
      setIsExportContactsModalOpen(true);
    }
  };

  const handleExportContacts = () => {
    // Create CSV content
    const headers = [
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Street',
      'City',
      'State',
      'Zip Code',
      'Tags',
      'Source',
      'Timezone',
      'DND Status'
    ];

    const csvContent = [
      headers.join(','),
      ...selectedContacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.phone || '',
        contact.email || '',
        contact.address1 || '',
        contact.city || '',
        contact.state || '',
        contact.postalCode || '',
        (contact.tags || []).join(';'),
        contact.source || '',
        contact.timezone || '',
        contact.dnd ? 'Yes' : 'No'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportContactsModalOpen(false);
    toast.success('Contacts exported successfully!');
  };

  // Add the ImagePopup component
  const ImagePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
        {/* Popup */}
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Smart List</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="smartListName" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="smartListName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>

          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const onAddTags = (updatedContacts: Contact[]) => {
    setContacts(prevContacts => {
      const updatedContactsMap = new Map(updatedContacts.map(c => [c.id, c]));
      return prevContacts.map(contact => updatedContactsMap.get(contact.id) || contact);
    });
    setSelectedContacts([]);
  };

  const onRemoveTags = (updatedContacts: Contact[]) => {
    setContacts(prevContacts => {
      const updatedContactsMap = new Map(updatedContacts.map(c => [c.id, c]));
      return prevContacts.map(contact => updatedContactsMap.get(contact.id) || contact);
    });
    setSelectedContacts([]);
  };

  return (
    <>
      <DashboardLayout title="Contacts">
        {isBulkUploadModalOpen && <BulkUploadForm onContactsSelect={handleBulkUpload} isLoading={isSubmitting} onClose={() => setIsBulkUploadModalOpen(false)} />}

        {/* Tabs Navigation */}
        {!isBulkUploadModalOpen && <nav className="flex space-x-8 border-b border-gray-200 bg-white px-8 pt-4" aria-label="Tabs">
          <button
            className={`font-medium pb-2 border-b-2 focus:outline-none ${activeMainTab === 'smartlists' ? 'text-blue-600 border-blue-500' : 'text-gray-600 border-transparent'}`}
            onClick={() => setActiveMainTab('smartlists')}
          >
            Smart Lists
          </button>
          <button
            className={`font-medium pb-2 border-b-2 focus:outline-none ${activeMainTab === 'tasks' ? 'text-blue-600 border-blue-500' : 'text-gray-600 border-transparent'}`}
            onClick={() => setActiveMainTab('tasks')}
          >
            Tasks
          </button>
          <button
             className={`font-medium pb-2 border-b-2 focus:outline-none ${activeMainTab === 'manage-smartlists' ? 'text-blue-600 border-blue-500' : 'text-gray-600 border-transparent'}`}
             onClick={() => setActiveMainTab('manage-smartlists')}
          >
            Manage Smart Lists
          </button>
        </nav>}
        {/* Main Content */}

        {!isBulkUploadModalOpen && (
          activeMainTab === 'tasks' ? <ContactTasksTab /> :
          activeMainTab === 'manage-smartlists' ? <ManageSmartListsTab /> : // Render new component here
            <>
              <div className="dashboard-card h-[calc(150vh-2rem)] flex flex-col">
                <div className="flex justify-between items-center">
                  <h4 className="dashboard-card-title">All</h4>
                  <div className="flex space-x-3">
                    {/* Remove ColumnManager from this row */}
                    <button
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 flex items-center"
                    >
                      <InformationCircleIcon className="h-4 w-4 mr-2" />
                      Verify Phone
                    </button>
                    <button
                      onClick={() => setIsBulkUploadModalOpen(true)}
                      className="px-3 py-2 bg-purple-500 text-white rounded-md text-sm font-medium hover:bg-purple-600 flex items-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </button>
                    {/* <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            Add Contact
          </button> */}
                  </div>
                </div>
                {/* Icon action row above the search/filter/column row */}
                <div className="flex gap-2 mb-3 w-full">
                  <span data-tooltip="tooltip" data-placement="top" title="Add Contact">
                    <button onClick={() => setIsAddModalOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition">
                      <PlusIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </span>
                  
                  <span data-tooltip="tooltip" data-placement="top" title="Add Tag" className="relative">
                    <button
                      onClick={() => {
                        if (selectedContacts.length === 0) {
                          showInfo('Please select contacts to add tags');
                          setShowAddTagTooltip(true);
                          setTimeout(() => setShowAddTagTooltip(false), 1500);
                        } else {
                          setIsAddTagsModalOpen(true);
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition"
                    >
                      <TagIcon className="h-5 w-5 text-gray-700" />
                    </button>
                    {showAddTagTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black text-white text-xs rounded shadow z-50 whitespace-nowrap">
                        you must select contacts
                      </div>
                    )}
                  </span>
                  <span data-tooltip="tooltip" data-placement="top" title="Remove Tag" className="relative">
                    <button
                      onClick={() => {
                        if (selectedContacts.length === 0) {
                          showInfo('Please select contacts to remove tags');
                          setShowRemoveTagTooltip(true);
                          setTimeout(() => setShowRemoveTagTooltip(false), 1500);
                        } else {
                          setIsRemoveTagsModalOpen(true);
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition"
                    >
                      <TagIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    {showRemoveTagTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black text-white text-xs rounded shadow z-50 whitespace-nowrap">
                        you must select contacts
                      </div>
                    )}
                  </span>
                  <span data-tooltip="tooltip" data-placement="top" title="Delete Contacts" className="relative">
                    <button
                      onClick={() => {
                        if (selectedContacts.length === 0) {
                          setShowDeleteTooltip(true);
                          setTimeout(() => setShowDeleteTooltip(false), 1500);
                        } else {
                          setIsDeleteContactsModalOpen(true);
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition"
                    >
                      <TrashIcon className="h-5 w-5 text-gray-700" />
                    </button>
                    {showDeleteTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black text-white text-xs rounded shadow z-50 whitespace-nowrap">
                        Please select contacts to delete
                      </div>
                    )}
                  </span>
                  {/* <span data-tooltip="tooltip" data-placement="top" title="Send Review Requests">
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition">
            <FaStar size={20} color="grey" />
          </button>
        </span> */}
                  <span data-tooltip="tooltip" data-placement="top" title="Export Contacts">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition"
                      onClick={handleExportIconClick}
                    >
                      <ArrowUpTrayIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </span>
                  <span data-tooltip="tooltip" data-placement="top" title="Import Contacts">
                    <button
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition"
                      onClick={() => setIsBulkUploadModalOpen(true)}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </span>
                  {/* <span data-tooltip="tooltip" data-placement="top" title="Add/Edit to Company">
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_471_4361)"><path d="M11 11H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C3 12.52 3 13.08 3 14.2V21m18 0V6.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C19.48 3 18.92 3 17.8 3h-3.6c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C11 4.52 11 5.08 11 6.2V21m11 0H2M14.5 7h3m-3 4h3m-3 4h3" stroke="#4E5456" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></g><defs><clipPath id="clip0_471_4361"><path fill="#fff" d="M0 0h24v24H0z"></path></clipPath></defs></svg>
          </button>
        </span>
        <span data-tooltip="tooltip" data-placement="top" title="Bulk WhatsApp">
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition" disabled>
            <FaWhatsapp size={20} color="grey" />
          </button>
        </span> */}
                  <span data-tooltip="tooltip" data-placement="top" title="Merge up to 10 Contacts">
                    <button className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-[#f3f4f6] border border-[#e3eaf3] transition" disabled>
                      <DocumentDuplicateIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </span>
                </div>
                {/* Existing search/filter/column row below */}
                <div className="flex w-full max-w-3xl gap-3 items-center mt-4 mb-2">
                  {/* Columns Button */}
                  <div className="">
                    <ColumnManager />
                  </div>
                  {/* Search Bar */}
                  <div className="relative border  border-gray-300 rounded-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Quick search by name"
                      className="pl-10 px-3 py-0.0 h-10 border-transparent rounded-md focus:outline-none w-200"
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current);
                        }
                        searchTimeoutRef.current = setTimeout(() => {
                          searchContactsByName(value);
                        }, 300);
                      }}
                    />
                  </div>

                  {/* More Filters Button */}
                  <button
                    className="flex items-center bg-white rounded-lg border border-[#e3eaf3] px-4 py-2 text-black text-[14px] font-medium hover:bg-[#f7fafd] transition"
                    onClick={() => setIsFilterModalOpen(true)}
                  >
                    More Filters
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 color-black ml-2" />
                  </button>
                </div>

                {/* {contacts.length > 0 && <TagFilters />} */}
                {contacts.length > 0 && <PaginationControls />}

                {isAddModalOpen && (
                  <ContactModal
                    isEdit={false}
                    isSubmitting={isSubmitting}
                    editContact={editContact}
                    newContact={newContact}
                    customFields={customFields}
                    user={user}
                    setIsEditModalOpen={setIsEditModalOpen}
                    setIsAddModalOpen={setIsAddModalOpen}
                    handleUpdate={handleUpdate}
                    handleAdd={handleAdd}
                    renderCustomFieldInput={renderCustomFieldInput}
                  />
                )}
                {isEditModalOpen && (
                  <ContactModal
                    isEdit={true}
                    isSubmitting={isSubmitting}
                    editContact={editContact}
                    newContact={newContact}
                    customFields={customFields}
                    user={user}
                    setIsEditModalOpen={setIsEditModalOpen}
                    setIsAddModalOpen={setIsAddModalOpen}
                    handleUpdate={handleUpdate}
                    handleAdd={handleAdd}
                    renderCustomFieldInput={renderCustomFieldInput}
                  />
                )}
                {isDeleteModalOpen && selectedContact && (
                  <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    <div
                      className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                      onClick={e => e.stopPropagation()}
                    >
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">Delete Contact</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete "{selectedContact.name}"? This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setIsDeleteModalOpen(false)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmDelete}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

            

                <BulkAddToPipelineStage
                  contacts={selectedContacts}
                  isOpen={isBulkAddOpportunities}
                  setIsOpen={setIsBulkAddOpportunities}
                  onComplete={() => setIsLoading(false)}
                  onError={error => {
                    setError(error);
                    setIsLoading(false);
                  }}
                  isSubmitting={isSubmitting}
                />

                {isVerifyModalOpen && (
                  <PhoneLookupModal
                    isOpen={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    verifyPhoneNumber={verifyPhoneNumber}
                    setVerifyPhoneNumber={setVerifyPhoneNumber}
                    verificationStatus={verificationStatus}
                    verificationMessage={verificationMessage}
                    phoneDetails={phoneDetails}
                    onLookup={lookupPhoneNumber}
                    resetVerificationModal={resetVerificationModal}
                  />
                )}

                {isBulkMessagingModalOpen && (
                  <BulkMessagingModal
                    isOpen={isBulkMessagingModalOpen}
                    onClose={() => {
                      setIsBulkMessagingModalOpen(false);
                      setSelectedMessageType(null);
                    }}
                    selectedContacts={selectedContacts}
                    selectedMessageType={selectedMessageType}
                    setSelectedMessageType={setSelectedMessageType}
                    smsText={smsText}
                    setSmsText={setSmsText}
                    emailSubject={emailSubject}
                    setEmailSubject={setEmailSubject}
                    emailBody={emailBody}
                    setEmailBody={setEmailBody}
                    isBulkInProcess={isBulkInProcess}
                    onSend={bulkSendEmailOrSMS}
                  />
                )}

                {isLoading ? (
                  <div className="flex-1 overflow-hidden">
                    <div className="relative h-full overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="pl-4 pr-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                            </th>
                            {columns.filter(col => col.visible).map(column => (
                              <th
                                key={column.id}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column.label}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array(5).fill(0).map((_, idx) => (
                            <tr key={idx}>
                              <td className="pl-4 pr-3 py-4 whitespace-nowrap">
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                              </td>
                              {columns.filter(col => col.visible).map(column => (
                                <td key={column.id} className="px-4 py-4">
                                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </td>
                              ))}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>
                ) : contacts.length > 0 ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedContacts.length > 0 && (
                      <div className="mb-2 flex items-center justify-between bg-purple-50 p-3 rounded-md border border-purple-100">
                        <span className="text-sm text-purple-800">
                          <span className="font-semibold">{selectedContacts.length}</span> contacts selected
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsBulkAddOpportunities(true)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            Add to Opportunities
                          </button>
                          <button
                            onClick={() => setIsBulkMessagingModalOpen(true)}
                            className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            Send Message
                          </button>
                          <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            Delete Selected
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="relative h-full overflow-x-auto">
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
                              {columns.filter(col => col.visible).map(column => (
                                <th
                                  key={column.id}
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {column.label}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {contacts.map((contact: Contact) => (
                              <tr key={contact.id} className="hover:bg-gray-50">
                                <td className="pl-4 pr-3 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedContacts.includes(contact)}
                                    onChange={() => toggleSelectContact(contact)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                </td>
                                {columns.filter(col => col.visible).map(column => (
                                  <td key={column.id} className="px-4 py-4 truncate max-w-[200px]">
                                    {renderCell(column, contact)}
                                  </td>
                                ))}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-3">
                                    <IconButton
                                      icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
                                      onClick={() => router.push(`/messaging?contactId=${contact.id}`)}
                                      tooltip="Message this contact"
                                    />
                                    <IconButton
                                      icon={<PencilIcon className="h-5 w-5" />}
                                      onClick={() => handleEdit(contact)}
                                      tooltip="Edit contact"
                                    />
                                    <IconButton
                                      icon={<TrashIcon className="h-5 w-5" />}
                                      onClick={() => handleDelete(contact)}
                                      tooltip="Delete contact"
                                      variant="destructive"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Pagination Controls at the bottom */}
                    <div className="mt-auto">
                      <PaginationControls />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No contacts found{searchQuery ? ` matching "${searchQuery}"` : activeTagFilter ? ` with the tag '${activeTagFilter}'` : ''}.
                  </p>
                )}
              </div>
              {isFilterModalOpen && <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />}
              {isPipelineChangeModalOpen && (
                <PipelineChangeModal
                  isOpen={isPipelineChangeModalOpen}
                  onClose={() => setIsPipelineChangeModalOpen(false)}
                  selectedCount={selectedContacts.length}
                />
              )}
              {isInfoModalOpen && <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />}
              {isAddTagsModalOpen && (
                <AddTagsModal
                  isOpen={isAddTagsModalOpen}
                  onClose={() => setIsAddTagsModalOpen(false)}
                  selectedContacts={selectedContacts}
                  onContactsUpdate={onAddTags}
                />
              )}
              {isRemoveTagsModalOpen && (
                <RemoveTagsModal
                  isOpen={isRemoveTagsModalOpen}
                  onClose={() => setIsRemoveTagsModalOpen(false)}
                  selectedContacts={selectedContacts}
                  onContactsUpdate={onRemoveTags}
                />
              )}
              {isDeleteContactsModalOpen && (
                <DeleteContactsModal
                  isOpen={isDeleteContactsModalOpen}
                  onClose={() => setIsDeleteContactsModalOpen(false)}
                  selectedContacts={selectedContacts}
                  onDelete={handleDeleteContacts}
                />
              )}
              {isExportContactsModalOpen && (
                <ExportContactsModal
                  isOpen={isExportContactsModalOpen}
                  onClose={() => setIsExportContactsModalOpen(false)}
                  selectedContacts={selectedContacts}
                  onExport={handleExportContacts}
                />
              )}
            </>
        )}
      </DashboardLayout>

      {/* Move modals outside DashboardLayout */}
      {isBulkMessagingModalOpen && (
        <BulkMessagingModal
          isOpen={isBulkMessagingModalOpen}
          onClose={() => {
            setIsBulkMessagingModalOpen(false);
            setSelectedMessageType(null);
          }}
          selectedContacts={selectedContacts}
          selectedMessageType={selectedMessageType}
          setSelectedMessageType={setSelectedMessageType}
          smsText={smsText}
          setSmsText={setSmsText}
          emailSubject={emailSubject}
          setEmailSubject={setEmailSubject}
          emailBody={emailBody}
          setEmailBody={setEmailBody}
          isBulkInProcess={isBulkInProcess}
          onSend={bulkSendEmailOrSMS}
        />
      )}

      {isBulkDeleteModalOpen && (
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          selectedCount={selectedContacts.length}
          isSubmitting={isSubmitting}
          onConfirm={confirmBulkDelete}
        />
      )}
    </>
  );
}