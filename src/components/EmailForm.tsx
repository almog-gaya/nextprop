'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

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
};

export default function EmailForm({ onEmailSubmit, isLoading = false }: EmailFormProps) {
  const [formData, setFormData] = useState<EmailData>({
    to: '',
    subject: '',
    message: '',
    contactName: '',
    propertyAddress: ''
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
  
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        let content = template.content;
        
        // Replace placeholders with actual values if they exist
        if (formData.contactName) {
          content = content.replace(/{{contactName}}/g, formData.contactName);
        }
        
        if (formData.propertyAddress) {
          content = content.replace(/{{propertyAddress}}/g, formData.propertyAddress);
        }
        
        setFormData(prev => ({
          ...prev,
          message: content
        }));
      }
    }
  }, [selectedTemplate, formData.contactName, formData.propertyAddress]);
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!formData.to || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      const result = await onEmailSubmit(formData);
      
      if (result.success) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          to: '',
          subject: '',
          message: '',
          contactName: '',
          propertyAddress: ''
        });
        setSelectedTemplate('');
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Send Email</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <EnvelopeIcon className="w-5 h-5" />
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Email sent successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="to" className="block mb-1 text-sm font-medium text-gray-700">
              Recipient Email*
            </label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="nextprop-input"
              placeholder="recipient@example.com"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block mb-1 text-sm font-medium text-gray-700">
                Contact Name
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="nextprop-input"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label htmlFor="propertyAddress" className="block mb-1 text-sm font-medium text-gray-700">
                Property Address
              </label>
              <input
                type="text"
                id="propertyAddress"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleChange}
                className="nextprop-input"
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="template" className="block mb-1 text-sm font-medium text-gray-700">
              Email Template
            </label>
            <select
              id="template"
              name="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="nextprop-input"
            >
              <option value="">Select a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="subject" className="block mb-1 text-sm font-medium text-gray-700">
              Subject*
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="nextprop-input"
              placeholder="Email subject"
              required
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block mb-1 text-sm font-medium text-gray-700">
              Message*
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="nextprop-input"
              placeholder="Enter your email message here..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="nextprop-button w-full flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 