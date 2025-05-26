import { useState } from 'react';
import { ChatBubbleLeftRightIcon, TagIcon } from '@heroicons/react/24/outline';
import SmsTemplateModal from './SmsTemplateModal';

interface SmsTemplateConfigProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  insertPlaceholder: (placeholder: string) => void;
  isJobRunning: boolean;
}

export default function SmsTemplateConfig({ 
  message, 
  onChange, 
  textareaRef, 
  insertPlaceholder, 
  isJobRunning 
}: SmsTemplateConfigProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  // These are the fields that exist in the contact_payload for each contact in automation collection
  const contactPayloadFields = [
    { key: 'firstName', placeholder: 'first_name', description: 'Contact\'s first name' },
    { key: 'lastName', placeholder: 'last_name', description: 'Contact\'s last name' },
    { key: 'email', placeholder: 'email', description: 'Contact\'s email address' },
    { key: 'phone', placeholder: 'phone', description: 'Contact\'s phone number' },
    { key: 'address1', placeholder: 'street_name', description: 'Property street address' },
    { key: 'city', placeholder: 'city', description: 'Property city' },
    { key: 'state', placeholder: 'state', description: 'Property state' },
    { key: 'postalCode', placeholder: 'postal_code', description: 'Property postal code' }
  ];

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleTemplateSelect = (template: string) => {
    const event = {
      target: { value: template }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(event);
    closeModal();
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600 mr-2 mb-6" />
          <h3 className="text-md font-medium text-gray-900">SMS Template</h3>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
          disabled={isJobRunning}
        >
          Choose Template
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={onChange}
        className="w-full p-3 bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-32 font-mono text-sm"
        placeholder="Enter your SMS template with contact fields like {{first_name}}, {{street_name}}, etc."
        disabled={isJobRunning}
      />
      
      <div className="mt-3">
        <p className="text-sm text-gray-600 mb-2">Insert contact fields:</p>
        <div className="flex flex-wrap gap-2">
          {contactPayloadFields.map(field => (
            <button
              key={field.key}
              type="button"
              onClick={() => insertPlaceholder(field.placeholder)}
              className="px-3 py-1.5 text-sm rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:shadow-sm transition-all flex items-center"
              disabled={isJobRunning}
              title={field.description}
            >
              <TagIcon className="h-3 w-3 mr-1.5" />
              {`{{${field.placeholder}}}`}
            </button>
          ))}
        </div>
      </div>

      <SmsTemplateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}