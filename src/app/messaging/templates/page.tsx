'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Mock template categories
const templateCategories = [
  'All Templates',
  'Initial Outreach',
  'Follow-up',
  'Property Offers',
  'Appointment Scheduling',
  'Nurturing',
  'Closing Deals',
];

// Mock template data
const mockTemplates = [
  {
    id: '1',
    name: 'Initial Property Inquiry',
    content: 'Hello! I saw your property on {{address}} and I\'m interested in discussing a potential offer. Would you be open to a conversation about it?',
    category: 'Initial Outreach',
    variables: [
      { name: 'address', defaultValue: '123 Main St', description: 'Property address' },
    ],
    tags: ['cold-outreach', 'property-specific'],
    useCount: 124,
    lastUsed: new Date(Date.now() - 2 * 86400000), // 2 days ago
  },
  {
    id: '2',
    name: 'Missed Call Follow-up',
    content: 'Hi {{name}}, I tried reaching you today about your property. When would be a good time to connect?',
    category: 'Follow-up',
    variables: [
      { name: 'name', defaultValue: 'there', description: 'Contact first name' },
    ],
    tags: ['follow-up', 'call-related'],
    useCount: 87,
    lastUsed: new Date(Date.now() - 5 * 3600000), // 5 hours ago
  },
  {
    id: '3',
    name: 'Cash Offer Introduction',
    content: 'Hello {{name}}, based on our analysis of {{address}}, we\'re prepared to make a cash offer of {{offer_amount}}. Are you interested in discussing this further?',
    category: 'Property Offers',
    variables: [
      { name: 'name', defaultValue: 'there', description: 'Contact first name' },
      { name: 'address', defaultValue: '123 Main St', description: 'Property address' },
      { name: 'offer_amount', defaultValue: '$200,000', description: 'Initial offer amount' },
    ],
    tags: ['offer', 'cash-buyer'],
    useCount: 65,
    lastUsed: new Date(Date.now() - 1 * 86400000), // 1 day ago
  },
  {
    id: '4',
    name: 'Appointment Confirmation',
    content: 'Hi {{name}}, just confirming our appointment to discuss your property at {{address}} on {{date}} at {{time}}. Looking forward to it!',
    category: 'Appointment Scheduling',
    variables: [
      { name: 'name', defaultValue: 'there', description: 'Contact first name' },
      { name: 'address', defaultValue: '123 Main St', description: 'Property address' },
      { name: 'date', defaultValue: 'tomorrow', description: 'Appointment date' },
      { name: 'time', defaultValue: '10:00 AM', description: 'Appointment time' },
    ],
    tags: ['appointment', 'confirmation'],
    useCount: 210,
    lastUsed: new Date(Date.now() - 12 * 3600000), // 12 hours ago
  },
  {
    id: '5',
    name: 'Voicemail Response',
    content: 'Hi {{name}}, thanks for your interest in our services. I\'d be happy to explain how we can help with your property at {{address}}. Please let me know when would be a good time to talk.',
    category: 'Nurturing',
    variables: [
      { name: 'name', defaultValue: 'there', description: 'Contact first name' },
      { name: 'address', defaultValue: '123 Main St', description: 'Property address' },
    ],
    tags: ['voicemail-response', 'inquiry'],
    useCount: 178,
    lastUsed: new Date(Date.now() - 3 * 86400000), // 3 days ago
  },
];

// Format relative time for templates
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
};

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastUsed' | 'useCount'>('lastUsed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter templates based on category and search term
  const filteredTemplates = mockTemplates.filter(template => {
    if (selectedCategory !== 'All Templates' && template.category !== selectedCategory) {
      return false;
    }
    
    if (searchTerm && 
        !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'useCount') {
      return sortOrder === 'asc'
        ? a.useCount - b.useCount
        : b.useCount - a.useCount;
    } else { // lastUsed
      return sortOrder === 'asc'
        ? a.lastUsed.getTime() - b.lastUsed.getTime()
        : b.lastUsed.getTime() - a.lastUsed.getTime();
    }
  });

  // Toggle sort order
  const handleSort = (field: 'name' | 'lastUsed' | 'useCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <DashboardLayout title="Message Templates">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Message Templates</h1>
          <Link 
            href="/messaging/templates/create" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Categories sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">Categories</h2>
              <ul className="space-y-2">
                {templateCategories.map((category) => (
                  <li key={category}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selectedCategory === category
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-blue-600 text-sm font-medium">
                  + Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Template list */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search templates..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <div className="sm:w-48">
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortBy(field as 'name' | 'lastUsed' | 'useCount');
                        setSortOrder(order as 'asc' | 'desc');
                      }}
                    >
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="lastUsed-desc">Recently Used</option>
                      <option value="lastUsed-asc">Oldest Used</option>
                      <option value="useCount-desc">Most Popular</option>
                      <option value="useCount-asc">Least Popular</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template cards */}
              <div className="divide-y divide-gray-200">
                {sortedTemplates.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No templates found matching your criteria
                  </div>
                ) : (
                  sortedTemplates.map((template) => (
                    <div key={template.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Category: {template.category} • Used {template.useCount} times • Last used {formatRelativeTime(template.lastUsed)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/messaging/templates/${template.id}`}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                        {template.content}
                      </div>
                      
                      {/* Template variables */}
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {template.variables.map((variable) => (
                            <div key={variable.name} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                              <span>{'{{' + variable.name + '}}'}</span>
                              <span className="mx-1">•</span>
                              <span>{variable.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Template tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="mt-3 flex space-x-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 