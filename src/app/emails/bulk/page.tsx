'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon, ArrowLeftIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

type BulkContact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property?: string;
  selected: boolean;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
};

export default function BulkEmailsPage() {
  const [selectedContacts, setSelectedContacts] = useState<BulkContact[]>([]);
  const [allContacts, setAllContacts] = useState<BulkContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Property Offer',
      subject: 'Interested in Your Property',
      content: 'Hi {{name}},\n\nI noticed you own the property at {{property}} and wanted to reach out regarding a potential offer. Would you be interested in discussing this further?\n\nBest regards,\n[Your Name]'
    },
    {
      id: '2',
      name: 'Market Update',
      subject: 'Market Update for Your Property',
      content: 'Hi {{name}},\n\nI wanted to share some recent market updates that might affect the value of your property at {{property}}. The market in your area has been showing some interesting trends that could impact your property value.\n\nWould you be interested in a free property valuation?\n\nBest regards,\n[Your Name]'
    },
    {
      id: '3',
      name: 'Follow-up',
      subject: 'Following Up on Our Conversation',
      content: 'Hi {{name}},\n\nI wanted to follow up on our previous conversation about your property at {{property}}. I am still interested in discussing potential options with you.\n\nLooking forward to hearing from you,\n[Your Name]'
    }
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Simulated data fetch
  useEffect(() => {
    const fetchContacts = async () => {
      // In a real implementation, we would fetch contacts from an API
      const mockContacts = Array.from({ length: 30 }, (_, i) => ({
        id: `contact-${i + 1}`,
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        phone: `+1 555-${String(i + 1).padStart(3, '0')}-${String(i + 100).padStart(4, '0')}`,
        property: `${123 + i} Main St, Anytown, USA`,
        selected: false
      }));
      
      setAllContacts(mockContacts);
      setLoading(false);
    };

    fetchContacts();
  }, []);

  const handleContactSelect = (contact: BulkContact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, { ...contact, selected: true }]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => ({ ...contact, selected: true })));
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) {
        setEmailSubject(template.subject);
        setEmailContent(template.content);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }
    
    if (!emailSubject || !emailContent) {
      alert('Please enter an email subject and content');
      return;
    }
    
    setIsSubmitting(true);
    setResults({ success: 0, failed: 0 });
    
    try {
      // Prepare emails array with personalized content for each contact
      const emails = selectedContacts.map(contact => ({
        to: contact.email,
        subject: emailSubject,
        contactName: contact.name,
        message: emailContent
          .replace(/{{name}}/g, contact.name || '')
          .replace(/{{property}}/g, contact.property || '')
      }));
      
      // Send bulk email request to API
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setResults({
          success: data.results.success,
          failed: data.results.failed
        });
      } else {
        console.error('Error sending bulk emails:', data.message);
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = searchTerm
    ? allContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.property && contact.property.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allContacts;

  return (
    <DashboardLayout title="Bulk Email Campaign">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <a href="/emails" className="text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeftIcon className="w-5 h-5" />
          </a>
          <h1 className="text-2xl font-bold text-[#1e1b4b]">Bulk Email Campaign</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="nextprop-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#1e1b4b]">Select Contacts</h3>
                  <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
                    <UserIcon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="nextprop-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-[#7c3aed] hover:text-[#6d28d9]"
                    onClick={handleSelectAll}
                  >
                    {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedContacts.length} selected
                  </span>
                </div>
                
                <div className="overflow-y-auto max-h-96 border rounded-md">
                  {loading ? (
                    <div className="flex justify-center items-center p-4">
                      <svg className="animate-spin h-5 w-5 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No contacts found matching "{searchTerm}"
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {filteredContacts.map(contact => (
                        <li 
                          key={contact.id} 
                          className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer ${
                            selectedContacts.some(c => c.id === contact.id) ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => handleContactSelect(contact)}
                        >
                          <div className="mr-3">
                            {selectedContacts.some(c => c.id === contact.id) ? (
                              <div className="h-5 w-5 bg-[#7c3aed] rounded flex items-center justify-center">
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-gray-500">{contact.email}</p>
                            {contact.property && <p className="text-xs text-gray-400">{contact.property}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="nextprop-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#1e1b4b]">Compose Email</h3>
                  <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="template" className="block mb-1 text-sm font-medium text-gray-700">
                      Email Template
                    </label>
                    <select
                      id="template"
                      className="nextprop-input"
                      value={selectedTemplateId}
                      onChange={handleTemplateSelect}
                    >
                      <option value="">Select a template...</option>
                      {emailTemplates.map(template => (
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
                      className="nextprop-input"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block mb-1 text-sm font-medium text-gray-700">
                      Message*
                    </label>
                    <textarea
                      id="content"
                      rows={8}
                      className="nextprop-input font-mono text-sm"
                      value={emailContent}
                      onChange={e => setEmailContent(e.target.value)}
                      placeholder="Enter your email message here...

Available placeholders:
{{name}} - Contact's name
{{property}} - Contact's property address"
                      required
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Template Variables</p>
                    <p className="text-yellow-700">Use <code className="bg-yellow-100 px-1 rounded">{"{{name}}"}</code> to insert the contact's name</p>
                    <p className="text-yellow-700">Use <code className="bg-yellow-100 px-1 rounded">{"{{property}}"}</code> to insert the property address</p>
                  </div>
                  
                  {(results.success > 0 || results.failed > 0) && (
                    <div className={`p-4 rounded-md ${results.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <h4 className="font-medium text-gray-900 mb-2">Sending Results</h4>
                      <p className="text-sm">
                        <span className="text-green-700">{results.success} successful</span>
                        {results.failed > 0 && (
                          <span className="text-red-700 ml-3">{results.failed} failed</span>
                        )}
                      </p>
                      {isSubmitting && (
                        <p className="text-xs text-gray-500 mt-1">
                          Processing... ({results.success + results.failed} of {selectedContacts.length} completed)
                        </p>
                      )}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="nextprop-button w-full flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Emails ({results.success + results.failed}/{selectedContacts.length})...
                      </>
                    ) : (
                      <>
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        Send Emails to {selectedContacts.length} Contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 