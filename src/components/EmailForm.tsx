'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EnvelopeIcon, XMarkIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

type EmailData = {
  to: string;
  subject: string;
  message: string;
  contactName?: string;
  propertyAddress?: string;
};

type EmailFormProps = {
  onEmailSubmit: (data: EmailData) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  initialData?: Partial<EmailData>;
};

export default function EmailForm({ 
  onEmailSubmit, 
  isLoading = false, 
  initialData = {} 
}: EmailFormProps) {
  const [formData, setFormData] = useState<EmailData>({
    to: initialData.to || '',
    subject: initialData.subject || '',
    message: initialData.message || '',
    contactName: initialData.contactName || '',
    propertyAddress: initialData.propertyAddress || ''
  });
  
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([
    { 
      id: '1', 
      name: 'Property Offer', 
      content: 'Hi {{contactName}},\n\nI noticed you own the property at {{propertyAddress}} and wanted to reach out regarding a potential offer. Would you be interested in discussing this further?\n\nBest regards,\n[Your Name]' 
    },
    { 
      id: '2', 
      name: 'Follow-up', 
      content: 'Hi {{contactName}},\n\nI wanted to follow up on my previous message about your property at {{propertyAddress}}. I am still interested in discussing potential options with you.\n\nLooking forward to hearing from you,\n[Your Name]' 
    },
    { 
      id: '3', 
      name: 'Market Update', 
      content: 'Hi {{contactName}},\n\nI wanted to share some recent market updates that might affect the value of your property at {{propertyAddress}}. The market in your area has been showing some interesting trends that could impact your property value.\n\nWould you be interested in a free property valuation?\n\nBest regards,\n[Your Name]' 
    }
  ]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof EmailData, string>>>({});
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [showRecentEmails, setShowRecentEmails] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Load saved templates and recent emails from localStorage
  useEffect(() => {
    try {
      // Load saved templates
      const savedTemplates = localStorage.getItem('nextprop_email_templates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(prev => [...prev, ...parsed]);
      }
      
      // Load recent emails
      const savedEmails = localStorage.getItem('nextprop_recent_emails');
      if (savedEmails) {
        setRecentEmails(JSON.parse(savedEmails));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);
  
  // Apply selected template
  useEffect(() => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      let content = template.content;
      
      // Replace placeholders with actual values
      if (formData.contactName) {
        content = content.replace(/{{contactName}}/g, formData.contactName);
      }
      
      if (formData.propertyAddress) {
        content = content.replace(/{{propertyAddress}}/g, formData.propertyAddress);
      }
      
      setFormData(prev => ({
        ...prev,
        message: content,
        subject: prev.subject || template.name
      }));
    }
    
    // Reset template selection
    setSelectedTemplate('');
  }, [selectedTemplate, templates, formData.contactName, formData.propertyAddress]);
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is edited
    if (validationErrors[name as keyof EmailData]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof EmailData];
        return updated;
      });
    }
    
    // Clear status messages
    if (error) setError('');
    if (success) setSuccess(false);
  };
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EmailData, string>> = {};
    
    if (!formData.to) {
      errors.to = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.to)) {
      errors.to = 'Invalid email address format';
    }
    
    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.message) {
      errors.message = 'Message content is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await onEmailSubmit(formData);
      
      if (result.success) {
        setSuccess(true);
        
        // Save email to recent emails (limit to 5)
        if (formData.to && !recentEmails.includes(formData.to)) {
          const updatedEmails = [formData.to, ...recentEmails.slice(0, 4)];
          setRecentEmails(updatedEmails);
          localStorage.setItem('nextprop_recent_emails', JSON.stringify(updatedEmails));
        }
        
        // Reset form after successful submission
        setFormData({
          to: '',
          subject: '',
          message: '',
          contactName: '',
          propertyAddress: ''
        });
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };
  
  const handleSelectRecentEmail = (email: string) => {
    setFormData(prev => ({ ...prev, to: email }));
    setShowRecentEmails(false);
  };
  
  const handleSaveTemplate = () => {
    if (!formData.message) return;
    
    const templateName = window.prompt('Enter a name for this template:');
    if (!templateName) return;
    
    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: templateName,
      content: formData.message
    };
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    
    // Save to localStorage
    try {
      const existingTemplates = localStorage.getItem('nextprop_email_templates');
      const savedTemplates = existingTemplates ? JSON.parse(existingTemplates) : [];
      savedTemplates.push(newTemplate);
      localStorage.setItem('nextprop_email_templates', JSON.stringify(savedTemplates));
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.message)
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy message:', err);
      });
  };
  
  // Character count and limit
  const MAX_MESSAGE_LENGTH = 5000;
  const messageCharacterCount = useMemo(() => formData.message.length, [formData.message]);
  const isMessageTooLong = messageCharacterCount > MAX_MESSAGE_LENGTH;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
        <div className="text-purple-600 bg-purple-50 p-3 rounded-full">
          <EnvelopeIcon className="w-5 h-5" />
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex justify-between items-center">
          <span>Email sent successfully!</span>
          <button onClick={() => setSuccess(false)} className="text-green-500">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Recipient field with recent emails dropdown */}
          <div className="relative">
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <div className="flex items-center">
              <input
                type="email"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleChange}
                onFocus={() => recentEmails.length > 0 && setShowRecentEmails(true)}
                onBlur={() => setTimeout(() => setShowRecentEmails(false), 200)}
                placeholder="recipient@example.com"
                className={`w-full p-2 border rounded-md ${validationErrors.to ? 'border-red-500' : 'border-gray-300'}`}
              />
              {recentEmails.length > 0 && (
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowRecentEmails(!showRecentEmails)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {validationErrors.to && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.to}</p>
            )}
            
            {/* Recent emails dropdown */}
            {showRecentEmails && recentEmails.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                <ul className="max-h-60 overflow-auto py-1">
                  {recentEmails.map((email, index) => (
                    <li 
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectRecentEmail(email)}
                    >
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Subject field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Email subject"
              className={`w-full p-2 border rounded-md ${validationErrors.subject ? 'border-red-500' : 'border-gray-300'}`}
            />
            {validationErrors.subject && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.subject}</p>
            )}
          </div>
          
          {/* Contact details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name (optional)
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="John Smith"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Property Address (optional)
              </label>
              <input
                type="text"
                id="propertyAddress"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleChange}
                placeholder="123 Main St"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Templates selector */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
              Select Template
            </label>
            <select
              id="template"
              name="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Select a template --</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Message content */}
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={copyToClipboard}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  {copiedToClipboard ? (
                    <>
                      <CheckIcon className="h-3 w-3 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={handleSaveTemplate}
                  className="text-xs text-purple-600 hover:text-purple-800 disabled:text-gray-400"
                  disabled={!formData.message}
                >
                  Save as Template
                </button>
              </div>
            </div>
            
            <textarea
              id="message"
              name="message"
              rows={8}
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message here..."
              className={`w-full p-2 border rounded-md resize-none ${
                validationErrors.message ? 'border-red-500' : 
                isMessageTooLong ? 'border-orange-500' : 'border-gray-300'
              }`}
            ></textarea>
            
            <div className="flex justify-between mt-1">
              {validationErrors.message ? (
                <p className="text-xs text-red-600">{validationErrors.message}</p>
              ) : isMessageTooLong ? (
                <p className="text-xs text-orange-600">Message exceeds maximum length</p>
              ) : (
                <p className="text-xs text-gray-500">
                  {messageCharacterCount} / {MAX_MESSAGE_LENGTH} characters
                </p>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || isMessageTooLong}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading || isMessageTooLong ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>
    </div>
  );
} 