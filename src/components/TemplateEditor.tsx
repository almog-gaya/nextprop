'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EmailTemplate, SmsTemplate, VoicemailTemplate } from '@/lib/types';

interface TemplateEditorProps {
  type: 'email' | 'sms' | 'voicemail';
  template: EmailTemplate | SmsTemplate | VoicemailTemplate;
  onSave: (updatedTemplate: EmailTemplate | SmsTemplate | VoicemailTemplate) => void;
  onCancel: () => void;
}

export default function TemplateEditor({ type, template, onSave, onCancel }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<any>(template);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTemplate((prev: any) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedTemplate((prev: any) => ({ ...prev, [name]: checked }));
  };

  const insertVariable = (fieldName: string, variable: string) => {
    setEditedTemplate((prev: any) => ({ 
      ...prev, 
      [fieldName]: prev[fieldName] + ` {{${variable}}}`
    }));
  };

  const validateTemplate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editedTemplate.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (type === 'email') {
      if (!editedTemplate.subject.trim()) {
        newErrors.subject = 'Subject is required';
      }
      if (!editedTemplate.body.trim()) {
        newErrors.body = 'Email body is required';
      }
    }

    if (type === 'sms') {
      if (!editedTemplate.message.trim()) {
        newErrors.message = 'Message is required';
      } else if (editedTemplate.message.length > 160) {
        newErrors.message = 'Message cannot exceed 160 characters';
      }
    }

    if (type === 'voicemail') {
      if (!editedTemplate.transcription.trim()) {
        newErrors.transcription = 'Transcription is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      onSave(editedTemplate);
    }
  };

  // Variable tags for each template type
  const variableTags = {
    email: ['firstName', 'lastName', 'propertyAddress', 'propertyPrice', 'propertyLink'],
    sms: ['firstName', 'propertyAddress', 'propertyLink'],
    voicemail: ['firstName', 'propertyAddress', 'agentName', 'companyName']
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {type === 'email' ? 'Edit Email Template' : 
             type === 'sms' ? 'Edit SMS Template' : 
             'Edit Voicemail Template'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedTemplate.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Template Type
            </label>
            <select
              id="type"
              name="type"
              value={editedTemplate.type}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="introduction">Introduction</option>
              <option value="follow-up">Follow-up</option>
              <option value="property-info">Property Info</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Email-specific fields */}
          {type === 'email' && (
            <>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line*
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={(editedTemplate as EmailTemplate).subject}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="previewText" className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Text
                </label>
                <input
                  type="text"
                  id="previewText"
                  name="previewText"
                  value={(editedTemplate as EmailTemplate).previewText || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Text shown in email client previews"
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body*
                </label>
                <textarea
                  id="body"
                  name="body"
                  value={(editedTemplate as EmailTemplate).body}
                  onChange={handleChange}
                  rows={8}
                  className={`w-full p-2 border rounded-md ${errors.body ? 'border-red-500' : 'border-gray-300'}`}
                ></textarea>
                {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
                
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {variableTags.email.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        onClick={() => insertVariable('body', variable)}
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SMS-specific fields */}
          {type === 'sms' && (
            <>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message*
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={(editedTemplate as SmsTemplate).message}
                  onChange={handleChange}
                  rows={4}
                  maxLength={160}
                  className={`w-full p-2 border rounded-md ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                ></textarea>
                <div className="flex justify-between mt-1">
                  <span className={`text-sm ${(editedTemplate as SmsTemplate).message.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                    {(editedTemplate as SmsTemplate).message.length}/160 characters
                  </span>
                  {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {variableTags.sms.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        onClick={() => insertVariable('message', variable)}
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    id="includeLink"
                    name="includeLink"
                    checked={(editedTemplate as SmsTemplate).includeLink || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="includeLink" className="ml-2 block text-sm text-gray-700">
                    Include property link in message
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Voicemail-specific fields */}
          {type === 'voicemail' && (
            <>
              <div>
                <label htmlFor="voiceType" className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Type
                </label>
                <select
                  id="voiceType"
                  name="voiceType"
                  value={(editedTemplate as VoicemailTemplate).voiceType || 'male'}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="ai">AI Assistant</option>
                </select>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={(editedTemplate as VoicemailTemplate).duration || 30}
                  onChange={handleChange}
                  min={5}
                  max={120}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="transcription" className="block text-sm font-medium text-gray-700 mb-1">
                  Script/Transcription*
                </label>
                <textarea
                  id="transcription"
                  name="transcription"
                  value={(editedTemplate as VoicemailTemplate).transcription}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full p-2 border rounded-md ${errors.transcription ? 'border-red-500' : 'border-gray-300'}`}
                ></textarea>
                {errors.transcription && <p className="mt-1 text-sm text-red-600">{errors.transcription}</p>}
                
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {variableTags.voicemail.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        onClick={() => insertVariable('transcription', variable)}
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Preview
                </label>
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
                  <button 
                    type="button" 
                    className="p-2 bg-indigo-100 rounded-full text-indigo-700 hover:bg-indigo-200"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">Preview audio</span>
                </div>
              </div>
            </>
          )}

          {/* Common fields for all template types */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sendDelay" className="block text-sm font-medium text-gray-700 mb-1">
                Send Delay
              </label>
              <select
                id="sendDelay"
                name="sendDelay"
                value={editedTemplate.sendDelay || 0}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value={0}>Immediately</option>
                <option value={24}>After 1 day</option>
                <option value={48}>After 2 days</option>
                <option value={72}>After 3 days</option>
                <option value={168}>After 1 week</option>
              </select>
            </div>

            <div>
              <label htmlFor="sendTime" className="block text-sm font-medium text-gray-700 mb-1">
                Best Time to Send
              </label>
              <select
                id="sendTime"
                name="sendTime"
                value={editedTemplate.sendTime || 'morning'}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="morning">Morning (9 AM - 11 AM)</option>
                <option value="afternoon">Afternoon (1 PM - 3 PM)</option>
                <option value="evening">Evening (6 PM - 8 PM)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
          >
            <CheckIcon className="h-4 w-4 mr-1.5" />
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for the play icon
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  );
} 