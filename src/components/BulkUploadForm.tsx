'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PhoneIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Contact {
  name: string;
  phone: string;
  street_name: string;
  selected: boolean;
}

interface BulkUploadFormProps {
  onContactsSelect: (contacts: { name: string; phone: string; street_name: string }[]) => void;
  isLoading?: boolean;
}

export default function BulkUploadForm({ onContactsSelect, isLoading = false }: BulkUploadFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // Check if the data has the required format
        if (data.length === 0) {
          setError('The file appears to be empty.');
          return;
        }
        
        // Check if the data has the required columns
        const firstRow = data[0] as any;
        if (!firstRow['Contact Name'] && !firstRow['contact name'] && !firstRow['Name'] && !firstRow['name']) {
          setError('The file must have a "Contact Name" or "Name" column.');
          return;
        }
        
        if (!firstRow['Phone'] && !firstRow['phone'] && !firstRow['Phone Number'] && !firstRow['phone number']) {
          setError('The file must have a "Phone" or "Phone Number" column.');
          return;
        }

        if (!firstRow['Street Name'] && !firstRow['street name'] && !firstRow['Street'] && !firstRow['street']) {
          setError('The file must have a "Street Name" or "Street" column.');
          return;
        }
        
        // Parse the data into contacts
        const parsedContacts: Contact[] = data.map((row: any) => {
          const name = row['Contact Name'] || row['contact name'] || row['Name'] || row['name'] || '';
          const phone = row['Phone'] || row['phone'] || row['Phone Number'] || row['phone number'] || '';
          const street_name = row['Street Name'] || row['street name'] || row['Street'] || row['street'] || '';
          
          return {
            name,
            phone: phone.toString(), // Convert to string in case it's a number in the spreadsheet
            street_name: street_name.toString(),
            selected: true
          };
        });
        
        setContacts(parsedContacts);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError('Failed to parse the Excel file. Please make sure it\'s a valid spreadsheet.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedContacts = contacts
      .filter(contact => contact.selected)
      .map(({ name, phone, street_name }) => ({ name, phone, street_name }));
    
    if (selectedContacts.length === 0) {
      setError('Please select at least one contact.');
      return;
    }
    
    onContactsSelect(selectedContacts);
  };

  const handleReset = () => {
    setContacts([]);
    setFileName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const allSelected = contacts.length > 0 && contacts.every(contact => contact.selected);
  const someSelected = contacts.some(contact => contact.selected);

  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Bulk Upload Contacts</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <DocumentTextIcon className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {contacts.length === 0 ? (
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Required Format:</h4>
                <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Contact Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Phone</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Street Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 border border-gray-200">Kelly Price</td>
                        <td className="px-3 py-2 border border-gray-200">+18167505325</td>
                        <td className="px-3 py-2 border border-gray-200">Oak Avenue</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 border border-gray-200">Cody Ferrin</td>
                        <td className="px-3 py-2 border border-gray-200">+18622089925</td>
                        <td className="px-3 py-2 border border-gray-200">Pine Street</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
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
                        <th scope="col" className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Street Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact, index) => (
                        <tr key={index} className={contact.selected ? 'bg-[#f5f3ff]' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={contact.selected}
                              onChange={(e) => handleSelectContact(index, e.target.checked)}
                              className="h-4 w-4 text-[#7c3aed] rounded border-gray-300 focus:ring-[#7c3aed]"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{contact.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{contact.street_name}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p>{error}</p>
            </div>
          )}
          
          {contacts.length > 0 && (
            <button
              type="submit"
              disabled={isLoading || !someSelected}
              className={`nextprop-button w-full flex justify-center items-center ${!someSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  Use Selected Contacts ({contacts.filter(c => c.selected).length})
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 