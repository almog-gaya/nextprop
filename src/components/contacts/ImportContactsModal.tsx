import React, { useState, useRef, useEffect } from 'react';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYSTEM_FIELDS = [
  { value: '', label: 'Don\'t import' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'tags', label: 'Tags' },
  // Add more fields as needed
];

export default function ImportContactsModal({ isOpen, onClose }: ImportContactsModalProps) {
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState<'contacts' | 'contacts_opportunities'>('contacts');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSampleRow, setCsvSampleRow] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{ [csvHeader: string]: string }>({});
  const [dontUpdateEmpty, setDontUpdateEmpty] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV headers and sample row when file is selected
  useEffect(() => {
    if (csvFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          setCsvHeaders(headers);
          setFieldMapping(headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {}));
          if (lines.length > 1) {
            setCsvSampleRow(lines[1].split(','));
          } else {
            setCsvSampleRow([]);
          }
        }
      };
      reader.readAsText(csvFile);
    } else {
      setCsvHeaders([]);
      setCsvSampleRow([]);
      setFieldMapping({});
    }
  }, [csvFile]);

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
      } else {
        alert('Please upload a valid CSV file.');
      }
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Required fields for mapping
  const requiredFields = ['name', 'email', 'phone'];
  const isNextEnabled = requiredFields.some(field => Object.values(fieldMapping).includes(field));

  // Placeholder import handler
  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      onClose();
      alert('Import started! (You can implement actual import logic here.)');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b">
          <span className="text-[18px] font-medium text-gray-800">Import Contacts</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        {/* Stepper */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className={step === 1 ? 'font-bold text-blue-600' : ''}>1. What to import</span>
            <span>→</span>
            <span className={step === 2 ? 'font-bold text-blue-600' : ''}>2. Upload CSV</span>
            <span>→</span>
            <span className={step === 3 ? 'font-bold text-blue-600' : ''}>3. Map Fields</span>
            <span>→</span>
            <span className={step === 4 ? 'font-bold text-blue-600' : ''}>4. Review</span>
          </div>
        </div>
        {/* Content Area - Make it scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: What to import */}
          {step === 1 && (
            <div className="px-8 pt-4 pb-8">
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-900 mb-2">What do you want to import?</div>
                <div className="flex flex-col gap-3 mt-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="contacts"
                      checked={importType === 'contacts'}
                      onChange={() => setImportType('contacts')}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="text-gray-800">Contacts</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      value="contacts_opportunities"
                      checked={importType === 'contacts_opportunities'}
                      onChange={() => setImportType('contacts_opportunities')}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="text-gray-800">Contacts & Opportunities</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 text-sm font-medium text-blue-600 border border-blue-500 rounded-lg bg-white hover:bg-blue-50 focus:outline-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {/* Step 2: Upload CSV */}
          {step === 2 && (
            <div className="px-8 pt-4 pb-8">
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-900 mb-2">Upload your CSV file</div>
                <div className="text-sm text-gray-600 mb-4">Drag and drop your CSV file here, or <span className="text-blue-600 underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>browse</span> to select a file.</div>
                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 cursor-pointer hover:border-blue-400 transition mb-4"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {csvFile ? (
                    <>
                      <span className="text-green-600 font-medium mb-2">{csvFile.name}</span>
                      <button
                        type="button"
                        className="text-xs text-red-500 underline mt-1"
                        onClick={e => { e.stopPropagation(); setCsvFile(null); }}
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-gray-500">Drop CSV file here or click to upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
                        setCsvFile(file);
                      } else if (file) {
                        alert('Please upload a valid CSV file.');
                      }
                    }}
                  />
                </div>
                <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                  <li>CSV file only. Max size: 30MB.</li>
                  <li>First row must be headers (no blank rows at the top).</li>
                  <li>Required: at least one of Name, Email, or Phone per row.</li>
                  <li>Remove special characters from phone numbers.</li>
                  <li>Only one sheet/tab per file.</li>
                </ul>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`px-5 py-2 text-sm font-medium text-blue-600 border border-blue-500 rounded-lg bg-white hover:bg-blue-50 focus:outline-none ${!csvFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!csvFile}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {/* Step 3: Map Fields */}
          {step === 3 && (
            <div className="px-8 pt-4 pb-8">
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-900 mb-4">Map CSV Columns to Fields</div>
                {csvHeaders.length === 0 ? (
                  <div className="text-gray-500">No columns found in CSV file.</div>
                ) : (
                  <table className="w-full text-sm border rounded overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-3 text-left font-medium text-gray-700">CSV Column</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-700">Sample Value</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-700">Map to Field</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvHeaders.map((header, idx) => (
                        <tr key={header} className="border-b last:border-b-0">
                          <td className="py-2 px-3 text-gray-900 font-medium">{header}</td>
                          <td className="py-2 px-3 text-gray-600">{csvSampleRow[idx] || ''}</td>
                          <td className="py-2 px-3">
                            <select
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              value={fieldMapping[header] || ''}
                              onChange={e => setFieldMapping(fm => ({ ...fm, [header]: e.target.value }))}
                            >
                              {SYSTEM_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={`px-5 py-2 text-sm font-medium text-blue-600 border border-blue-500 rounded-lg bg-white hover:bg-blue-50 focus:outline-none ${!isNextEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isNextEnabled}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="px-8 pt-4 pb-8">
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-900 mb-4">Review & Confirm Import</div>
                <div className="mb-4">
                  <div className="font-medium text-gray-700 mb-2">Field Mapping:</div>
                  <table className="w-full text-sm border rounded overflow-hidden mb-2">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-3 text-left font-medium text-gray-700">CSV Column</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-700">Mapped To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvHeaders.map(header => (
                        <tr key={header} className="border-b last:border-b-0">
                          <td className="py-2 px-3 text-gray-900 font-medium">{header}</td>
                          <td className="py-2 px-3 text-gray-600">{SYSTEM_FIELDS.find(f => f.value === fieldMapping[header])?.label || 'Don\'t import'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dontUpdateEmpty}
                      onChange={e => setDontUpdateEmpty(e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Don&apos;t update empty values</span>
                  </label>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Please review your field mapping and preferences before starting the import. You can monitor the import status in the Bulk Actions page.
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={isImporting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className={`px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 