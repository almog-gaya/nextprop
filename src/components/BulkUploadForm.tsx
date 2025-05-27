'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PhoneIcon, DocumentTextIcon, CheckCircleIcon, TagIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Dropdown } from './ui/dropdown'

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
  stageId: string; // Add stageId for the stage with position 0
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
  onClose: () => void;
}

export default function BulkUploadForm({ onContactsSelect, isLoading = false, pipelines: initialPipelines = [], onClose }: BulkUploadFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [loadingPipelines, setLoadingPipelines] = useState(initialPipelines.length === 0);
  const [step, setStep] = useState(1);
  const [selectedObject, setSelectedObject] = useState<'contacts' | 'opportunities'>('contacts');
  const [importType, setImportType] = useState('Create and update contacts');
  const [confirmConsent, setConfirmConsent] = useState(false);
  const [smartlistChecked, setSmartlistChecked] = useState(false);
  const [workflowChecked, setWorkflowChecked] = useState(false);
  const [tagsChecked, setTagsChecked] = useState(false);
  const [smartlistName, setSmartlistName] = useState('15_MAY_2025_6_19_PM');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [selectedTags, setSelectedTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  // Close dropdown when clicking outside (unchanged)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // File upload handler remains unchanged
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
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
          setError('The file appears to be empty.');
          return;
        }

        const firstRow = data[0] as any;
        if (
          !firstRow['Phone'] &&
          !firstRow['phone'] &&
          !firstRow['Phone Number'] &&
          !firstRow['phone number'] &&
          !firstRow['Email'] &&
          !firstRow['email']
        ) {
          setError('The file must have either a "Phone" or "Email" column.');
          return;
        }

        const parsedContacts: Contact[] = data
          .map((row: any) => {
            const name = row['Contact Name'] || row['contact name'] || row['name'] || row['Name'] || '  ';
            const nameParts = name.trim().split(/\s+/);
            const firstName = row['First Name'] || row['first name'] || nameParts[0] || '';
            const lastName = row['Last Name'] || row['last name'] || nameParts.slice(1).join(' ') || '';
            const phone = row['Phone'] || row['phone'] || row['Phone Number'] || row['phone number'] || '';
            const street = row['Street'] || row['street'] || '';
            const city = row['City'] || row['city'] || '';
            const state = row['State'] || row['state'] || '';
            const email = row['Email'] || row['email'] || '';
            const notes = row['Notes'] || row['notes'] || '';
            const zipCode = row['Zip Code'] || row['zip code'] || row['zipcode'] || row['Zipcode'] || row['ZipCode'] || '';

            return {
              name: name.toString(),
              firstName: firstName.toString(),
              lastName: lastName.toString(),
              phone: phone.toString(),
              street: street.toString(),
              city: city.toString(),
              state: state.toString(),
              email: email.toString(),
              notes: notes.toString(),
              selected: true,
              zipCode: zipCode.toString()
            };
          })
          .filter((contact) => {
            const isValid = contact.phone || contact.email;
            if (!isValid) {
              console.warn(`Skipping contact "${contact.firstName}" due to missing phone and email.`);
            }
            return isValid;
          });

        if (parsedContacts.length === 0) {
          setError('No valid contacts found. Each contact must have at least a phone or email.');
          return;
        }

        setContacts(parsedContacts);
        if (parsedContacts.length < data.length) {
          setError(
            `${data.length - parsedContacts.length} contact(s) skipped due to missing phone and email.`
          );
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError('Failed to parse the Excel file. Please ensure it\'s valid.');
      }
    };

    reader.onerror = () => setError('Failed to read the file. Please try again.');
    reader.readAsBinaryString(file);
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

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault && e.preventDefault();

    if (!selectedPipeline) {
      setError('Please select a pipeline for these contacts.');
      return;
    }

    const selectedPipelineData = pipelines.find(p => p.id === selectedPipeline);
    if (!selectedPipelineData) {
      setError('Selected pipeline not found.');
      return;
    }

    setIsUploading(true);
    try {
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

      const invalidContacts = selectedContacts.filter(c => !c.phone && !c.email);
      if (invalidContacts.length > 0) {
        setError(`The following contacts are missing both phone and email: ${invalidContacts.map(c => c.firstName).join(', ')}. At least one is required.`);
        return;
      }

      // Call the onContactsSelect callback with the selected contacts
      await onContactsSelect(selectedContacts);
      // Close the modal after successful upload
      onClose();
    } catch (error) {
      console.error('Error during bulk import:', error);
      setError('Failed to import contacts. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setContacts([]);
    setFileName('');
    setError(null);
    setSelectedPipeline('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allSelected = contacts.length > 0 && contacts.every(contact => contact.selected);
  const someSelected = contacts.some(contact => contact.selected);
  const hasPipelines = pipelines && pipelines.length > 0;

  const handleSelectPipeline = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    setDropdownOpen(false);
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

  // JSX remains mostly unchanged
  return (
    <div className="bg-[#f6fafd] w-full h-screen overflow-y-auto p-0 rounded-xl">
      {/* Top header section, now step-specific */}
      <div className="px-8 pt-8">
        {step === 3 ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Map columns to fields</h2>
            <p className="text-gray-500 mb-8 text-lg">Map your CSV columns to the appropriate fields</p>
          </>
        ) : step === 4 ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Verify</h2>
            <p className="text-gray-500 mb-8 text-lg">Review and confirm your import settings</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Imports</h2>
            <p className="text-gray-500 mb-8 text-lg">Import contacts and opportunities</p>
          </>
        )}
      </div>
      {/* Stepper UI */}
      <div className="flex items-center justify-between mb-8 px-8">
        {[1,2,3,4].map((n, idx) => (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-9 h-9 flex items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-200
                ${step === n ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-300 text-gray-400'}`}>{n}</div>
              <span className={`mt-2 text-base font-semibold ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>{['Start','Upload','Map','Verify'][idx]}</span>
              <span className={`text-xs mt-0.5 ${step === n ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{[
                'Select objects and more info',
                'Upload file and configure',
                'Map columns to fields',
                'Confirm and finalize selection',
              ][idx]}</span>
            </div>
            {n < 4 && <div className="h-0.5 flex-1 bg-gray-200 mx-2" />}
          </React.Fragment>
        ))}
      </div>
      {/* Step 1: Object selection */}
      {step === 1 && (
        <>
          <div className="px-8">
            <div className="bg-white rounded-xl shadow p-8 mb-8">
              <h3 className="text-lg font-semibold mb-6">Select objects to start importing</h3>
              <div className="flex gap-6">
                {/* Contacts Card */}
                <button
                  type="button"
                  className={`relative flex-1 border rounded-xl p-6 flex flex-col items-start min-h-[110px] cursor-pointer transition focus:outline-none shadow-sm
                    ${selectedObject === 'contacts' ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedObject('contacts')}
                >
                  {/* Checkmark */}
                  <span className={`absolute top-4 right-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150
                    ${selectedObject === 'contacts' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}
                  >
                    {selectedObject === 'contacts' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </span>
                  <div className="flex items-center mb-2">
                    <span className="inline-block w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" /><path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <span className="font-semibold text-lg">Contacts</span>
                  </div>
                  <span className="text-gray-500 text-base">Contains list of all leads, their details, and specifications.</span>
                </button>
                {/* Opportunities Card */}
                <button
                  type="button"
                  className={`relative flex-1 border rounded-xl p-6 flex flex-col items-start min-h-[110px] cursor-pointer transition focus:outline-none shadow-sm
                    ${selectedObject === 'opportunities' ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedObject('opportunities')}
                >
                  {/* Checkmark */}
                  <span className={`absolute top-4 right-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150
                    ${selectedObject === 'opportunities' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}
                  >
                    {selectedObject === 'opportunities' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </span>
                  <div className="flex items-center mb-2">
                    <span className="inline-block w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2">
                      {/* Sparkle/star icon for Opportunities */}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    </span>
                    <span className="font-semibold text-lg">Opportunities</span>
                  </div>
                  <span className="text-gray-500 text-base">Contains list of all deals, their stages, statuses and pipeline progress.</span>
                </button>
              </div>
            </div>
            {/* Previous imports section */}
            <div className="bg-white rounded-xl shadow p-8 mb-8">
              <h4 className="text-base font-semibold mb-2">Previous imports</h4>
              <p className="text-gray-500 text-base mb-2">Previous imports can be found in Bulk Actions</p>
              <a href="#" className="text-blue-600 text-base font-medium hover:underline">Go to Bulk Actions</a>
            </div>
          </div>
          {/* Step 1 Buttons */}
          <div className="flex justify-between items-center px-8 pb-8 mt-2">
            <button type="button" className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" onClick={() => setStep(1)}>Back</button>
            <div className="flex gap-2">
              <button type="button" className="px-6 py-2 rounded  text-white font-medium hover:bg-red-700 bg-red-500 border-gray-200 shadow" onClick={onClose}>Cancel</button>
              <button type="button" className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow" onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        </>
      )}
      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full">
          <div className="bg-white rounded-xl shadow p-10 w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">Upload your files</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Before uploading files, make sure your file is ready to import.{' '}
              <a
                href="#"
                className="text-blue-600 hover:underline"
                onClick={e => { e.preventDefault(); handleDownloadSample(); }}
              >
                Download sample file
              </a> or{' '}
              <a
                href="https://help.leadconnectorhq.com/support/solutions/articles/155000003916-importing-contacts-and-opportunities-via-csv"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                learn more
              </a>.
            </p>
            <div className="flex flex-col items-center justify-center w-full">
              {fileName ? (
                <div className="w-full flex items-center justify-between border border-gray-200 rounded-xl bg-gray-50 px-6 py-5 mb-6 shadow-sm">
                  <div className="flex items-center">
                    <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v8h8V8H8z" /></svg>
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 text-base">{fileName}</div>
                      <div className="text-xs text-gray-500">100KB - 100% Uploaded</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-4 p-2 rounded hover:bg-gray-200 text-gray-500"
                    onClick={handleReset}
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="excelFile" className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer py-16 mb-6 transition hover:border-blue-400">
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 rounded-full p-4 mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12l4 4m0 0l4-4m-4 4V4" /></svg>
                    </div>
                    <span className="text-gray-600 text-base mb-1">Click to upload or drag and drop</span>
                    <span className="text-gray-400 text-sm">csv (max size 30MB)</span>
                  </div>
                  <input
                    type="file"
                    id="excelFile"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose how to import contacts</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={importType}
                onChange={e => setImportType(e.target.value)}
              >
                <option value="Create and update contacts">Create and update contacts</option>
                <option value="Create only">Create only</option>
                <option value="Update only">Update only</option>
              </select>
            </div>
          </div>
          {/* Step 2 Buttons */}
          <div className="flex justify-between items-center w-full max-w-2xl mx-auto mt-8">
            <button type="button" className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" onClick={() => setStep(1)}>Back</button>
            <div className="flex gap-2">
              <button type="button" className="px-6 py-2 rounded  text-white font-medium hover:bg-red-700 bg-red-500 border-gray-200 shadow" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className={`px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow ${!fileName ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => fileName && setStep(3)}
                disabled={!fileName}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Step 3: Map columns to fields */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center w-full">
          {/* Mapping Guide Card */}
          <div className="bg-white rounded-xl shadow p-8 w-full max-w-5xl mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-2">Mapping guide</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Ensure all required fields are correctly mapped for a smooth import process. Validate and finalize your data before completing the import
            </p>
            <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md">
              <div className="border-b border-gray-100">
                <button type="button" className="w-full flex justify-between items-center py-3 text-left font-medium text-gray-700 focus:outline-none">
                  <span>Fields required to</span>
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                <details className="py-2">
                  <summary className="cursor-pointer font-medium text-gray-700">Create contacts</summary>
                  <ul className="pl-4 mt-2 text-gray-500 text-sm list-disc">
                    <li>First Name</li>
                    <li>Last Name</li>
                    {/* Add more required fields as needed */}
                  </ul>
                </details>
                <details className="py-2">
                  <summary className="cursor-pointer font-medium text-gray-700">Update contacts</summary>
                  <ul className="pl-4 mt-2 text-gray-500 text-sm list-disc">
                    <li>Email</li>
                    <li>Phone</li>
                    {/* Add more required fields as needed */}
                  </ul>
                </details>
              </div>
            </div>
          </div>
          {/* Uploaded Files Table */}
          <div className="bg-white rounded-xl shadow p-8 w-full max-w-5xl mx-auto mb-8">
            <h4 className="text-base font-semibold mb-4">Uploaded files</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="px-4 py-2 text-left">Column header in file</th>
                    <th className="px-4 py-2 text-left">Preview information</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Object <span className="ml-1" title="Object"><svg className="inline w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg></span></th>
                    <th className="px-4 py-2 text-left">Fields <span className="ml-1" title="Fields"><svg className="inline w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg></span></th>
                    <th className="px-4 py-2 text-left">Update empty values</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length > 0 && Object.keys(contacts[0]).map((header, idx, allHeaders) => (
                    <tr key={header} className={idx % 2 === 1 ? "bg-gray-50" : "bg-white border-b border-gray-100"}>
                      <td className="px-4 py-2 font-medium text-gray-900">{header}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {contacts.slice(0, 3).map((c, i) => (
                          <React.Fragment key={i}>
                            {c[header] || "-"}<br />
                          </React.Fragment>
                        ))}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Mapped
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900">Contact</td>
                      <td className="px-4 py-2">
                        <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                          {allHeaders.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" defaultChecked />
                          <span className="ml-2 text-xs text-gray-600">Don't update to an empty value</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Footer for Step 3 */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto pb-8">
            <button type="button" className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" onClick={() => setStep(2)}>Back</button>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center text-sm text-gray-700">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 mr-2" defaultChecked />
                Don't import data in 24 unmapped columns
              </label>
              <button type="button" className="px-6 py-2 rounded  text-white font-medium hover:bg-red-700 bg-red-500 border-gray-200 shadow" onClick={onClose}>Cancel</button>
              <button type="button" className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow" onClick={() => setStep(4)}>Next</button>
            </div>
          </div>
        </div>
      )}
      {/* Step 4: Verify */}
      {step === 4 && (
        <div className="flex flex-col items-center justify-center w-full">
          {/* Preferences Card */}
          <div className="bg-white rounded-xl shadow p-8 w-full max-w-5xl mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-2">Preferences</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Review your data and mapping settings before starting the import to ensure accuracy and completeness.
            </p>
            {/* Pipeline Selection - moved here */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Pipeline <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={selectedPipeline}
                onChange={e => setSelectedPipeline(e.target.value)}
                required
              >
                <option value="">Select a pipeline</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                ))}
              </select>
              {loadingPipelines && <div className="text-xs text-gray-500 mt-1">Loading pipelines...</div>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={smartlistChecked} onChange={e => setSmartlistChecked(e.target.checked)} />
                <span className="text-gray-700 text-sm">Create a Smartlist for new contacts created by the import</span>
                <input type="text" className="ml-4 border border-gray-200 rounded-lg px-4 py-2 text-base w-64 bg-gray-50" value={smartlistName} onChange={e => setSmartlistName(e.target.value)} disabled={!smartlistChecked} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={workflowChecked} onChange={e => setWorkflowChecked(e.target.checked)} />
                <span className="text-gray-700 text-sm">Add imported contacts to a workflow</span>
                <select className="ml-4 border border-gray-200 rounded-lg px-4 py-2 text-base w-64 bg-gray-50" value={selectedWorkflow} onChange={e => setSelectedWorkflow(e.target.value)} disabled={!workflowChecked}>
                  <option value="">Please select Workflow</option>
                  <option value="workflow1">Workflow 1</option>
                  <option value="workflow2">Workflow 2</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={tagsChecked} onChange={e => setTagsChecked(e.target.checked)} />
                <span className="text-gray-700 text-sm">Add tags to imported contacts</span>
                <select className="ml-4 border border-gray-200 rounded-lg px-4 py-2 text-base w-64 bg-gray-50" value={selectedTags} onChange={e => setSelectedTags(e.target.value)} disabled={!tagsChecked}>
                  <option value="">Please select tags</option>
                  <option value="tag1">Tag 1</option>
                  <option value="tag2">Tag 2</option>
                </select>
              </div>
            </div>
          </div>
          {/* Review Import Section */}
          <div className="bg-white rounded-xl shadow p-8 w-full max-w-5xl mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-4">Review import</h3>
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">Document</div>
              {fileName && (
                <div className="w-full flex items-center border border-gray-200 rounded-xl bg-gray-50 px-6 py-5 mb-4 shadow-sm max-w-md">
                  <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v8h8V8H8z" /></svg>
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 text-base">{fileName}</div>
                    <div className="text-xs text-gray-500">100 KB - 100% Uploaded</div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Mapping</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-500 text-xs">
                      <th className="px-4 py-2 text-left">Column header in file</th>
                      <th className="px-4 py-2 text-left">Preview information</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Object <span className="ml-1" title="Object"><svg className="inline w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg></span></th>
                      <th className="px-4 py-2 text-left">Fields <span className="ml-1" title="Fields"><svg className="inline w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg></span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length > 0 && Object.keys(contacts[0]).map((header, idx) => (
                      <tr key={header} className={idx % 2 === 1 ? "bg-gray-50" : "bg-white border-b border-gray-100"}>
                        <td className="px-4 py-2 font-medium text-gray-900">{header}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {contacts.slice(0, 3).map((c, i) => (
                            <React.Fragment key={i}>
                              {c[header] || "-"}<br />
                            </React.Fragment>
                          ))}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Mapped
                          </span>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">Contact</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{header}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto pb-8 gap-2">
            <button type="button" className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" onClick={() => setStep(3)}>Back</button>
           
              <label className="inline-flex items-center text-sm text-gray-500">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 mr-2" checked={confirmConsent} onChange={e => setConfirmConsent(e.target.checked)} />
                I confirm all contacts in this import have consented to hear from us. I've previously contacted them within the last past year, and this list is not from a third party
              </label>
              <button type="button" className="px-6 py-2 rounded  text-white font-medium hover:bg-red-700 bg-red-500 border-gray-200 shadow" onClick={onClose}>Cancel</button>
              <div className="relative">
                <button 
                  type="button" 
                  className={`px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow ${!confirmConsent || !selectedPipeline ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  disabled={!confirmConsent || !selectedPipeline || isUploading} 
                  onClick={handleSubmit}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    'Start Bulk Import'
                  )}
                </button>
                {!selectedPipeline && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg shadow-lg whitespace-nowrap">
                    Please select a pipeline
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-8 border-transparent border-t-red-100"></div>
                    </div>
                  </div>
                )}
              </div>
           
          </div>
        </div>
      )}
    </div>
  );
}