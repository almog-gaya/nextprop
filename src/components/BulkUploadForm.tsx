'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PhoneIcon, DocumentTextIcon, CheckCircleIcon, TagIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Contact {
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  email?: string;
  notes?: string;
  selected: boolean;
  zipCode?: string;
}

interface Pipeline {
  id: string;
  name: string;
  stageId: string;
}

interface BulkUploadFormProps {
  onContactsSelect: (contacts: { 
    firstName: string; 
    lastName: string; 
    name: string; 
    phone: string; 
    street: string; 
    city: string; 
    state: string; 
    pipelineId: string; 
    stageId: string;
    email?: string; 
    notes?: string; 
    zipCode?: string 
  }[]) => void;
  isLoading?: boolean;
  pipelines?: Pipeline[];
}

interface ColumnMapping {
  [key: string]: string; // Maps standard field name to file column name
}

const STANDARD_FIELDS = [
  { name: 'firstName', label: 'First Name', required: false },
  { name: 'lastName', label: 'Last Name', required: false },
  { name: 'phone', label: 'Phone', required: true, requiresOne: ['email'] },
  { name: 'street', label: 'Street', required: false },
  { name: 'city', label: 'City', required: false },
  { name: 'state', label: 'State', required: false },
  { name: 'email', label: 'Email', required: true, requiresOne: ['phone'] },
  { name: 'notes', label: 'Notes', required: false },
  { name: 'zipCode', label: 'Zip Code', required: false },
];

export default function BulkUploadForm({ onContactsSelect, isLoading = false, pipelines: initialPipelines = [] }: BulkUploadFormProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'review'>('upload');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [loadingPipelines, setLoadingPipelines] = useState(initialPipelines.length === 0);

  // Fetch pipelines
  useEffect(() => {
    async function fetchPipelines() {
      try {
        setLoadingPipelines(true);
        const response = await fetch('/api/pipelines');
        if (!response.ok) {
          console.error('Failed to fetch pipelines:', response.status, response.statusText);
          return;
        }
        const data = await response.json();

        let pipelineData: Pipeline[] = [];
        if (Array.isArray(data) && data.length > 0) {
          pipelineData = data.map((pipeline: any) => ({
            id: pipeline.id,
            name: pipeline.name,
            stageId: pipeline.stages.find((stage: any) => stage.position === 0)?.id || ''
          }));
        } else if (data.pipelines && Array.isArray(data.pipelines)) {
          pipelineData = data.pipelines.map((pipeline: any) => ({
            id: pipeline.id,
            name: pipeline.name,
            stageId: pipeline.stages.find((stage: any) => stage.position === 0)?.id || ''
          }));
        } else {
          const extractedArrays = Object.values(data).filter(value =>
            Array.isArray(value) && value.length > 0 && value[0] && 'id' in value[0] && 'name' in value[0]
          );
          if (extractedArrays.length > 0) {
            pipelineData = (extractedArrays[0] as any[]).map((pipeline: any) => ({
              id: pipeline.id,
              name: pipeline.name,
              stageId: pipeline.stages.find((stage: any) => stage.position === 0)?.id || ''
            }));
          }
        }

        setPipelines(pipelineData);
      } catch (err) {
        console.error('Error fetching pipelines:', err);
      } finally {
        setLoadingPipelines(false);
      }
    }
    fetchPipelines();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const binaryString = evt.target?.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length <= 1) {
          setError('The file appears to be empty or has no data rows.');
          return;
        }

        const headers = data[0] as string[];
        const rows = data.slice(1) as any[];
        setColumnHeaders(headers);
        setRawData(rows);
        setStep('mapping');
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError('Failed to parse the Excel file. Please ensure it’s valid.');
      }
    };

    reader.onerror = () => setError('Failed to read the file. Please try again.');
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (standardField: string, fileColumn: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev };
      if (fileColumn === '') {
        delete newMapping[standardField];
      } else {
        newMapping[standardField] = fileColumn;
      }
      return newMapping;
    });
  };

  const handleMappingSubmit = () => {
    if (!columnMapping.phone && !columnMapping.email) {
      setError('You must map at least one of Phone or Email.');
      return;
    }

    const parsedContacts: Contact[] = rawData
      .map((row: any[]) => {
        const contact: Partial<Contact> = { selected: true };
        Object.entries(columnMapping).forEach(([standardField, fileColumn]) => {
          const colIndex = columnHeaders.indexOf(fileColumn);
          if (colIndex !== -1) {
            contact[standardField as keyof Contact] = String(row[colIndex] || '');
          }
        });

        // Handle name splitting if only 'name' is mapped
        if (columnMapping.name && !columnMapping.firstName && !columnMapping.lastName) {
          const name = contact.name || '  ';
          const nameParts = name.trim().split(/\s+/);
          contact.firstName = nameParts[0] || '';
          contact.lastName = nameParts.slice(1).join(' ') || '';
        }

        // Ensure all fields are present
        contact.firstName = contact.firstName || '';
        contact.lastName = contact.lastName || '';
        contact.name = `${contact.firstName} ${contact.lastName}`.trim();
        contact.phone = contact.phone || '';
        contact.street = contact.street || '';
        contact.city = contact.city || '';
        contact.state = contact.state || '';
        contact.email = contact.email || '';
        contact.notes = contact.notes || '';
        contact.zipCode = contact.zipCode || '';
        contact.selected = true;

        return contact as Contact;
      })
      .filter(contact => contact.phone || contact.email);

    if (parsedContacts.length === 0) {
      setError('No valid contacts found after mapping. Each contact must have at least a phone or email.');
      return;
    }

    setContacts(parsedContacts);
    setStep('review');
    if (parsedContacts.length < rawData.length) {
      setError(`${rawData.length - parsedContacts.length} contact(s) skipped due to missing phone and email.`);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setContacts(contacts.map(contact => ({ ...contact, selected: isChecked })));
  };

  const handleSelectContact = (index: number, isChecked: boolean) => {
    const updatedContacts = [...contacts];
    updatedContacts[index].selected = isChecked;
    setContacts(updatedContacts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPipeline) {
      setError('Please select a pipeline for these contacts.');
      return;
    }

    const selectedPipelineData = pipelines.find(p => p.id === selectedPipeline);
    if (!selectedPipelineData) {
      setError('Selected pipeline not found.');
      return;
    }

    const selectedContacts = contacts
      .filter(contact => contact.selected)
      .map(({ firstName, lastName, phone, street, city, state, email, notes, zipCode }) => ({
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone,
        street,
        city,
        state,
        email,
        notes,
        pipelineId: selectedPipeline,
        stageId: selectedPipelineData.stageId,
        zipCode,
      }));

    if (selectedContacts.length === 0) {
      setError('Please select at least one contact.');
      return;
    }

    onContactsSelect(selectedContacts);
  };

  const handleReset = () => {
    setStep('upload');
    setContacts([]);
    setFileName('');
    setError(null);
    setSelectedPipeline('');
    setRawData([]);
    setColumnHeaders([]);
    setColumnMapping({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Phone': '+1234567890',
        'Street': '123 Main St',
        'City': 'New York',
        'State': 'NY',
        'Zip Code': '10001',
        'Email': 'john@example.com',
        'Notes': 'Interested in property'
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'contact_upload_template.xlsx');
  };

  const allSelected = contacts.length > 0 && contacts.every(contact => contact.selected);
  const someSelected = contacts.some(contact => contact.selected);
  const hasPipelines = pipelines && pipelines.length > 0;

  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">
          {step === 'upload' ? 'Bulk Upload Contacts' : 
           step === 'mapping' ? 'Map Your Columns' : 
           'Review Contacts'}
        </h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <DocumentTextIcon className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={step === 'review' ? handleSubmit : (e) => e.preventDefault()}>
        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <input
                  type="file"
                  id="excelFile"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="excelFile"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <DocumentTextIcon className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-[#7c3aed]">Click to upload Excel file</span>
                  <span className="text-xs text-gray-500 mt-1">XLSX, XLS, or CSV</span>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Sample Format (Phone or Email required):</h4>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="text-sm text-[#7c3aed] hover:text-[#6d28d9] flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Sample
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {STANDARD_FIELDS.map(field => (
                          <th key={field.name} className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">
                            {field.label} {field.required ? '*' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 border border-gray-200">Kelly</td>
                        <td className="px-3 py-2 border border-gray-200">Price</td>
                        <td className="px-3 py-2 border border-gray-200">+18167505325</td>
                        <td className="px-3 py-2 border border-gray-200">Oak Avenue</td>
                        <td className="px-3 py-2 border border-gray-200">Kansas City</td>
                        <td className="px-3 py-2 border border-gray-200">Missouri</td>
                        <td className="px-3 py-2 border border-gray-200">kelly@example.com</td>
                        <td className="px-3 py-2 border border-gray-200">Interested in 3-bedroom</td>
                        <td className="px-3 py-2 border border-gray-200">64108</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Match your file columns to the required fields. At least Phone or Email must be mapped.
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STANDARD_FIELDS.map(field => (
                    <div key={field.name} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label} {field.required ? <span className="text-red-500">*</span> : ''}
                      </label>
                      <select
                        value={columnMapping[field.name] || ''}
                        onChange={(e) => handleMappingChange(field.name, e.target.value)}
                        className="w-full rounded-md border border-gray-300 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] p-2 text-sm"
                      >
                        <option value="">-- Select Column --</option>
                        {columnHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleMappingSubmit}
                  className="mt-4 nextprop-button w-full flex justify-center items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Continue to Review
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 w-full text-sm text-[#7c3aed] hover:text-[#6d28d9]"
                >
                  Upload Different File
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pipeline" className="block text-sm font-medium text-gray-700">
                    Select Pipeline <span className="text-red-500">*</span>
                  </label>
                  {!hasPipelines && !loadingPipelines && (
                    <span className="text-xs text-orange-500">No pipelines available. Please create a pipeline first.</span>
                  )}
                </div>
                <div className="relative w-64" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-white rounded-md border border-gray-300 hover:border-[#7c3aed] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] p-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {selectedPipeline ? pipelines.find(p => p.id === selectedPipeline)?.name : 'Select a pipeline'}
                      </span>
                      <ChevronDownIcon className={`h-5 w-5 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {pipelines.map(pipeline => (
                        <div
                          key={pipeline.id}
                          onClick={() => {
                            setSelectedPipeline(pipeline.id);
                            setDropdownOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-[#f5f3ff] cursor-pointer"
                        >
                          {pipeline.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Uploaded: {fileName}
                    </span>
                    <p className="text-xs text-gray-500">
                      {contacts.length} contacts found, {contacts.filter(c => c.selected).length} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-[#7c3aed] hover:text-[#6d28d9]"
                  >
                    Upload Different File
                  </button>
                </div>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-[#7c3aed] rounded border-gray-300 focus:ring-[#7c3aed]"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-sm font-medium text-gray-700">
                      Select All
                    </label>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-16 px-6 py-3"></th>
                          {STANDARD_FIELDS.map(field => (
                            <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.map((contact, index) => (
                          <tr key={index} className={contact.selected ? 'bg-[#f5f3ff]' : ''}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={contact.selected}
                                onChange={(e) => handleSelectContact(index, e.target.checked)}
                                className="h-4 w-4 text-[#7c3aed] rounded border-gray-300 focus:ring-[#7c3aed]"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.firstName || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastName || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.street || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.city || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.state || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.notes || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.zipCode || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p>{error}</p>
            </div>
          )}

          {step === 'review' && (
            <button
              type="submit"
              disabled={isLoading || !someSelected || !selectedPipeline}
              className={`nextprop-button w-full flex justify-center items-center ${(!someSelected || !selectedPipeline) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Add to {selectedPipeline ? pipelines.find(p => p.id === selectedPipeline)?.name : ''} Pipeline ({contacts.filter(c => c.selected).length})
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}