import { useState } from 'react';
import { smsTemplatesByObjective, ObjectiveType } from './smsTemplates';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface SmsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: string) => void;
}

// Strategy descriptions to provide context
const strategyDescriptions: Record<string, string> = {
  "For Realtors - Re-Engagement": "Re-engage realtors based on past sales data. AI engages realtors referencing previous conversations and inquiring about new off-market deals.",
  "For Realtors - Distressed Listings": "Target listings over 90 days on MLS, then engage realtors to explore creative financing options.",
  "Distressed Homeowners": "Reach out to distressed homeowners to offer solutions, whether it's a cash offer or creative financing.",
  "Off Market Deals": "Connect with contacts about exclusive off-market property opportunities.",
  "Short Sales": "Engage with contacts about potential short sale opportunities.",
  "Creative Finance": "Discuss creative financing options for real estate investments.",
  "Cash Buyers": "Reach out to potential cash buyers with investment opportunities.",
  "For Home Owners": "Connect with homeowners about selling their properties.",
  "Cash Offer": "Offer quick cash offers for properties.",
  "Distressed Seller": "Provide solutions for sellers facing property challenges.",
  "Relocation": "Assist homeowners who are relocating and need to sell their property."
};

export default function SmsTemplateModal({ isOpen, onClose, onSelectTemplate }: SmsTemplateModalProps) {
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveType | null>(null);

  if (!isOpen) return null;

  // Get a truncated preview of the template (first 70 characters)
  const getTemplatePreview = (template: string) => {
    return template.length > 70 ? `${template.substring(0, 70)}...` : template;
  };

  // Get templates safely
  const getTemplates = () => {
    if (!selectedObjective || !smsTemplatesByObjective[selectedObjective]) {
      return [];
    }
    return smsTemplatesByObjective[selectedObjective];
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Select SMS Template</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Deal Objective/Strategy:</label>
          <select
            className="w-full border-gray-300 rounded-md p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedObjective || ''}
            onChange={(e) => setSelectedObjective(e.target.value as ObjectiveType)}
          >
            <option value="" disabled>Select Objective</option>
            {Object.keys(smsTemplatesByObjective).map((objective) => (
              <option key={objective} value={objective}>{objective}</option>
            ))}
          </select>
        </div>

        {selectedObjective && (
          <>
            <div className="bg-indigo-50 p-4 rounded-md mb-4 flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-800">
                {strategyDescriptions[selectedObjective] || "Select a template from this category."}
              </p>
            </div>
            
            <div className="space-y-3 overflow-y-auto flex-grow mb-6 p-2">
              <h3 className="font-medium text-gray-700 mb-2">Select a template:</h3>
              {getTemplates().map((template, idx) => (
                <div key={idx} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 text-sm font-medium border-b border-gray-200">
                    Template {idx + 1}
                  </div>
                  <button
                    className="w-full text-left p-4 bg-white hover:bg-indigo-50 transition-all text-sm"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <p className="whitespace-pre-wrap">
                      {template}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end mt-auto pt-4 border-t border-gray-200">
          <button
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-md transition-all text-gray-800 font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 