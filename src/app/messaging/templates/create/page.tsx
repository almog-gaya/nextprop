'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Mock template categories (same as in the template list page)
const templateCategories = [
  'Initial Outreach',
  'Follow-up',
  'Property Offers',
  'Appointment Scheduling',
  'Nurturing',
  'Closing Deals',
];

// Interface for template variable
interface TemplateVariable {
  id: string;
  name: string;
  defaultValue: string;
  description: string;
}

// Generate a random ID for new variables
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function CreateTemplatePage() {
  // Template basic information
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Initial Outreach');
  
  // Template variables
  const [variables, setVariables] = useState<TemplateVariable[]>([
    { 
      id: generateId(), 
      name: 'name', 
      defaultValue: 'there', 
      description: 'Contact first name' 
    }
  ]);
  
  // Template tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Character count and SMS segments
  const getMessageStats = (content: string) => {
    const charCount = content.length;
    const segmentCount = Math.ceil(charCount / 160);
    
    return {
      charCount,
      segmentCount,
      charCountInCurrentSegment: charCount % 160 || 160,
      remainingInSegment: 160 - (charCount % 160 || 160)
    };
  };
  
  const messageStats = getMessageStats(templateContent);

  // Handle adding variable to content
  const addVariableToContent = (variableName: string) => {
    setTemplateContent(prevContent => {
      return `${prevContent}{{${variableName}}}`;
    });
  };
  
  // Handle adding a new variable
  const addNewVariable = () => {
    setVariables(prev => [
      ...prev, 
      { 
        id: generateId(), 
        name: '', 
        defaultValue: '', 
        description: '' 
      }
    ]);
  };
  
  // Handle removing a variable
  const removeVariable = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
  };
  
  // Handle updating a variable
  const updateVariable = (id: string, field: keyof TemplateVariable, value: string) => {
    setVariables(prev => 
      prev.map(v => 
        v.id === id ? { ...v, [field]: value } : v
      )
    );
  };
  
  // Handle adding a tag
  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) {
      return;
    }
    
    setTags(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };
  
  // Handle removing a tag
  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };
  
  // Handle template save
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    if (!templateContent.trim()) {
      alert('Please enter template content');
      return;
    }
    
    // In a real implementation, this would save the template to the API
    console.log('Saving template:', {
      name: templateName,
      content: templateContent,
      category: selectedCategory,
      variables: variables.filter(v => v.name.trim() !== ''),
      tags
    });
    
    // Here you would redirect to the template list page after saving
    // router.push('/messaging/templates');
    
    // For demo purposes, we'll just show an alert
    alert('Template saved successfully!');
  };

  return (
    <DashboardLayout title="Create Template">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link 
            href="/messaging/templates" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Templates
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Create Message Template</h1>
        </div>
        
        <form onSubmit={handleSaveTemplate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Basic Info */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="mb-6">
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      id="templateName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Initial Property Inquiry"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="templateContent" className="block text-sm font-medium text-gray-700 mb-1">
                      Message Content
                    </label>
                    <div className="relative">
                      <textarea
                        id="templateContent"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                        placeholder="Type your message here. Use variables like {{name}} for personalization."
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                        {messageStats.charCount} / {messageStats.segmentCount} SMS 
                        ({messageStats.remainingInSegment} chars left in current segment)
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="templateCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="templateCategory"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {templateCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tags
                      </label>
                      <span className="text-xs text-gray-500">
                        Tags help organize your templates
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="relative flex-1">
                        <TagIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        onClick={addTag}
                      >
                        Add
                      </button>
                    </div>
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map((tag) => (
                          <div
                            key={tag}
                            className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm"
                          >
                            #{tag}
                            <button
                              type="button"
                              className="ml-1 text-gray-500 hover:text-red-500"
                              onClick={() => removeTag(tag)}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Variables */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Template Variables</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Use variables to personalize your message for each recipient
                  </p>
                </div>
                
                <div className="p-4">
                  {variables.map((variable) => (
                    <div key={variable.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            placeholder="Variable name"
                            value={variable.name}
                            onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                          />
                          <button
                            type="button"
                            className="ml-2 text-blue-600 text-sm font-medium hover:text-blue-800"
                            onClick={() => variable.name && addVariableToContent(variable.name)}
                          >
                            Insert
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => removeVariable(variable.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Default value"
                          value={variable.defaultValue}
                          onChange={(e) => updateVariable(variable.id, 'defaultValue', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Description (e.g., Contact's first name)"
                          value={variable.description}
                          onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="w-full mt-3 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={addNewVariable}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Variable
                  </button>
                </div>
                
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-600">
                      Variables are inserted into your message as {'{{variable}}'}. When a message is sent, 
                      these will be replaced with actual values from the contact's information.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 mb-2"
                  onClick={() => {
                    // Preview functionality would be implemented here
                    alert(`Preview template with content:\n\n${templateContent}`);
                  }}
                >
                  Preview Template
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 