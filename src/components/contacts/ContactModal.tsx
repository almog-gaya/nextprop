import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Contact } from '@/types';
import { timezones } from '@/utils/timezones';
import { createPortal } from 'react-dom';

interface ContactModalProps {
  isEdit: boolean;
  isSubmitting: boolean;
  editContact: Contact;
  newContact: Contact;
  customFields: any[];
  user: any;
  setIsEditModalOpen: (value: boolean) => void;
  setIsAddModalOpen: (value: boolean) => void;
  handleUpdate: (formData: Contact) => void;
  handleAdd: (formData: Contact) => void;
  renderCustomFieldInput: (field: any, value: any, onChange: (value: any) => void) => React.ReactNode;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isEdit,
  isSubmitting,
  editContact,
  newContact,
  customFields,
  user,
  setIsEditModalOpen,
  setIsAddModalOpen,
  handleUpdate,
  handleAdd,
  renderCustomFieldInput,
}) => {
  const [formData, setFormData] = useState<Contact>(isEdit ? editContact : newContact);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
      onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto my-8 p-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 pb-2">
          <div>
            <p className="text-[24px] font-normal text-gray-900">{isEdit ? 'Edit Contact' : 'Add New Contact'}</p>
            <p className="text-xs text-gray-600">{isEdit ? 'Update contact details below' : 'Create a new contact'}</p>
          </div>
          <button
            onClick={() => {
              if (isEdit) {
                setIsEditModalOpen(false);
              } else {
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
            }}
            className="w-[30px] h-[30px] flex items-center justify-center p-0 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200"
          >
            <XMarkIcon className='w-[20px] h-[20px]' />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name Fields */}
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">First Name</p>
              <input
                type="text"
                placeholder='Your First Name'
                value={formData.firstName || ''}
                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Last Name</p>
              <input
                type="text"
                placeholder='Your Last Name '
                value={formData.lastName || ''}
                onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>

            {/* Contact Info */}
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Email</p>
              <input
                type="email"
                placeholder='Your Email'
                value={formData.email || ''}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Phone</p>
              <input
                type="tel"
                placeholder='Your Phone Number'
                value={formData.phone || ''}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>

            {/* Address Fields */}
            <div className="sm:col-span-2">
              <div className='border border-gray-200 rounded-md'>
                <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Address Line 1</p>
                <input
                  type="text"
                  placeholder='Your Address'
                  value={formData.address1 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                  className="w-full bg-white text-sm"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">City</p>
              <input
                type="text"
                placeholder='Your City'
                value={formData.city || ''}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">State</p>
              <input
                type="text"
                placeholder='Your State'
                value={formData.state || ''}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Postal Code</p>
              <input
                type="text"
                placeholder='Your City Code'
                value={formData.postalCode || ''}
                onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Country</p>
              <input
                type="text"
                value={formData.country || ''}
                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              />
            </div>
            {/* Timezone and DND */}
            <div className='border border-gray-200 rounded-md'>
              <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Timezone</p>
              <select
                value={formData.timezone || ''}
                onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full bg-white text-sm"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isSubmitting}
              >
                <option value="">Select Timezone</option>
                {timezones.map(timezone => (
                  <option key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Custom Fields */}
            {customFields.map(field => {
              const customFieldValue =
                formData.customFields && typeof formData.customFields === 'object'
                  ? formData.customFields[field.fieldKey] || (field.dataType === 'CHECKBOX' ? [] : '')
                  : field.dataType === 'CHECKBOX' ? [] : '';
              return (
                <div key={field.id} className='border border-gray-200 rounded-md'>
                  <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">{field.name}</p>
                  {renderCustomFieldInput(field, customFieldValue, value => {
                    const updatedCustomFields = {
                      ...(formData.customFields || {}),
                      [field.fieldKey]: value.value,
                    };
                    setFormData(prev => ({ ...prev, customFields: updatedCustomFields }));
                  })}
                </div>
              );
            })}
            <div className="sm:col-span-2">
              <label className="flex items-center text-[12px] font-normal text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.dnd}
                  onChange={e => setFormData(prev => ({ ...prev, dnd: e.target.checked }))}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                Do Not Disturb
              </label>
            </div>

            {/* Source */}
            <div className="sm:col-span-2">
              <div className='border border-gray-200 rounded-md'>
                <p className="block text-[12px] font-normal text-gray-700 ml-3 mt-1 mb-1">Source</p>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full bg-white text-sm"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    modalContent,
    document.body
  );
};

export default ContactModal; 