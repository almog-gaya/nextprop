'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { timezones } from '@/utils/timezones';
import { GHLContact } from '@/types/dashboard';

interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContact: GHLContact | null;
  editContactData: {
    firstName: string;
    lastName: string;
    email: string;
    locationId: string;
    phone: string;
    timezone: string;
    dnd: boolean;
    tags: string[];
    customFields: any[];
  };
  onUpdateContact: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

interface CustomField {
  id: string;
  dataType: string;
  fieldKey: string;
  name: string;
  picklistOptions?: { value: string; label: string }[];
}

export default function ContactEditModal({
  isOpen,
  onClose,
  selectedContact,
  editContactData,
  onUpdateContact,
  isSubmitting,
}: ContactEditModalProps) {
  const [formData, setFormData] = useState(editContactData);

  useEffect(() => {
    setFormData(editContactData);
  }, [editContactData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateContact(formData);
  };

  const displayName = selectedContact?.name || formData.firstName || 'Contact';

  const renderCustomFieldInput = (
    field: CustomField,
    value: any,
    onChange: (value: { id: string; key: string; value: any }) => void
  ) => {
    if (field.picklistOptions && field.picklistOptions.length > 0) {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
          className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
          disabled={isSubmitting}
        >
          <option value="">Select {field.name}</option>
          {field.picklistOptions.map((option) => (
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
            value={value || ''}
            onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
            placeholder={`Enter ${field.name}`}
            disabled={isSubmitting}
          />
        );
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.picklistOptions?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const newValue = Array.isArray(value) ? [...value] : [];
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
            value={value || ''}
            onChange={(e) => onChange({ id: field.id, key: field.fieldKey, value: e.target.value })}
            className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
            placeholder={`Enter ${field.name}`}
            disabled={isSubmitting}
          />
        );
    }
  };

  const customFieldsDefinitions: CustomField[] = [
    {
      id: 'ECqyHR21ZJnSMolxlHpU',
      dataType: 'STANDARD_FIELD',
      fieldKey: 'contact.type',
      name: 'Contact Type',
      picklistOptions: [
        { value: 'lead', label: 'Lead' },
        { value: 'customer', label: 'Customer' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Edit Contact: {displayName}</h3>
        <p className="text-sm text-gray-600 mb-4 sm:mb-6">Update contact details below</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                disabled={isSubmitting}
              >
                <option value="">Select Timezone</option>
                {timezones.map((timezone) => (
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, dnd: e.target.checked }))}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                Do Not Disturb
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.tags &&
                  formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          const newTags = [...formData.tags];
                          newTags.splice(index, 1);
                          setFormData((prev) => ({ ...prev, tags: newTags }));
                        }}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
              </div>
              <div className="mt-2 flex">
                <input
                  type="text"
                  id="newTag"
                  className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const value = target.value.trim();
                      if (value && !formData.tags.includes(value)) {
                        setFormData((prev) => ({
                          ...prev,
                          tags: [...prev.tags, value],
                        }));
                        target.value = '';
                      }
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {customFieldsDefinitions.map((field) => {
              const customFieldValue =
                formData.customFields.find((cf) => cf.id === field.id)?.value ||
                (field.dataType === 'CHECKBOX' ? [] : '');
              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                  {renderCustomFieldInput(field, customFieldValue, (value) => {
                    const updatedCustomFields = [
                      ...formData.customFields.filter((cf) => cf.id !== field.id),
                      value,
                    ];
                    setFormData((prev) => ({ ...prev, customFields: updatedCustomFields }));
                  })}
                </div>
              );
            })}
          </div>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-white rounded-md bg-blue-500 hover:bg-blue-600 text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}