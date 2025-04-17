import { ChatBubbleLeftRightIcon, TagIcon } from '@heroicons/react/24/outline';

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
  const placeholders = ['first_name', 'street_name', 'property_url', 'property_price'];

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center mb-3">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600 mr-2" />
        <h3 className="text-md font-medium text-gray-900">SMS Template</h3>
      </div>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={onChange}
        
        className="block w-full pl-6 pr-0 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white transition-all h-32 font-mono text-sm"
        placeholder="Enter your SMS template with placeholders like {{firstName}}, {{propertyAddress}}, etc."
        disabled={isJobRunning}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 mr-1 self-center">Insert: </span>
        {placeholders.map(placeholder => (
          <button
            key={placeholder}
            type="button"
            onClick={() => insertPlaceholder(placeholder)}
            className="px-3 py-1.5 text-sm rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:shadow-sm transition-all flex items-center"
            disabled={isJobRunning}
          >
            <TagIcon className="h-3 w-3 mr-1.5" />
            {`{{${placeholder}}}`}
          </button>
        ))}
        <p className="w-full mt-2 text-sm text-amber-600">
          ⚠️ Important: Only use the placeholders provided above. Messages with custom placeholders will be skipped for contacts missing those fields.
        </p>
      </div>
    </div>
  );
}