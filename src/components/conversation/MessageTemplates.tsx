import React, { useState, useEffect } from 'react';
import { PhoneNumber } from '@/contexts/AuthContext';
import { X, MessageSquare, Edit, Plus, Save, Trash2 } from 'lucide-react';
import { ConversationDisplay } from '@/types/messageThread';

interface User {
  email: string;
  name: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  id: string;
  phoneNumbers?: PhoneNumber[];
  website?: string;
}

interface Template {
  id: string;
  name: string;
  text: string;
  isCustom?: boolean;
}

// Default templates
const DEFAULT_TEMPLATES: Template[] = [
  // Basic templates
  {
    id: 'greeting',
    name: 'Greeting',
    text: 'Hi {{first_name}}, how are you doing today?',
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    text: 'Hi {{first_name}}, just following up on our conversation. Let me know if you have any questions.',
  },
  {
    id: 'property-info',
    name: 'Property Information',
    text: 'Hi {{first_name}}, I wanted to provide some information about the property at {{property_address}}. Please let me know if you have any questions.',
  },
  {
    id: 'closing',
    name: 'Closing Message',
    text: 'Thanks for your time {{first_name}}. Feel free to reach out if you need anything else!',
  },
  
  // Realtor re-engagement templates
  {
    id: 'realtor-re-engage-1',
    name: 'Realtor Re-Engage 1',
    text: 'Hey {{first_name}}, this is {{user_name}}, I\'m assisting {{client_name}}. He was prev looking at buying {{last_sold_address}}. Do you have any other listings to write our offer on? Thank you.',
  },
  {
    id: 'realtor-re-engage-2',
    name: 'Realtor Re-Engage 2',
    text: 'Hey {{first_name}}, {{client_name}} is actively looking for more investment opportunities. We saw you sold {{last_sold_address}}—any other distressed or off-market properties that need TLC before they go public? We can move quickly!',
  },
  {
    id: 'realtor-re-engage-3',
    name: 'Realtor Re-Engage 3',
    text: 'Hey {{first_name}}, this is {{user_name}} checking in for {{client_name}}. We were eyeing {{last_sold_address}}, but wanted to see if you have any new listings or fixer-uppers that might be a great fit for an investor before they hit the market. Let me know!',
  },
  {
    id: 'realtor-re-engage-4',
    name: 'Realtor Re-Engage 4',
    text: 'Hey {{first_name}}, I\'m following up on behalf of {{client_name}}. We loved working with you when you sold {{last_sold_address}}. Do you have any upcoming off-market deals or distressed properties that might be a good fit? Always great to do business with you!',
  },
  {
    id: 'realtor-re-engage-5',
    name: 'Realtor Re-Engage 5',
    text: 'Hey {{first_name}}, congrats on selling {{last_sold_address}}! {{client_name}} is looking for similar properties—any other off-market, fixer-uppers, or TLC opportunities you\'re working on? Would love to put in an offer early',
  },
  
  // Distressed listings templates
  {
    id: 'distressed-listing-1',
    name: 'Distressed Listing 1',
    text: 'Hi {{first_name}}, this is {{user_name}} from {{company_name}}. I\'m reaching out about {{property_address}}. I noticed it\'s been on the market for {{days_on_market}} days. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.',
  },
  {
    id: 'distressed-listing-2',
    name: 'Distressed Listing 2',
    text: 'Hi {{first_name}}, this is {{user_name}} with {{company_name}}. I saw {{property_address}} has been sitting for {{days_on_market}} days and wanted to see if your seller might be open to an offer on terms. Just to confirm—your commission is fully covered. Let me know if this is something worth exploring!',
  },
  {
    id: 'distressed-listing-3',
    name: 'Distressed Listing 3',
    text: 'Hi {{first_name}}, this is {{user_name}} with {{company_name}}. I noticed {{property_address}} has been listed for {{days_on_market}} days. I wanted to see if your seller would consider a terms offer. Of course, your commission remains fully paid. Let me know if we can discuss further!',
  },
  {
    id: 'distressed-listing-4',
    name: 'Distressed Listing 4',
    text: 'Hey {{first_name}}, this is {{user_name}} from {{company_name}}. I noticed {{property_address}} has been on the market for {{days_on_market}} days. If the seller is open to terms, I might have a solution that works for everyone—and your commission stays intact. Let me know if they\'d consider it!',
  },
  
  // Distressed homeowner template
  {
    id: 'distressed-homeowner-voicemail',
    name: 'Distressed Homeowner Voicemail',
    text: 'Hey {{first_name}}, it\'s {{user_name}}. I just tried reaching you about your property at {{property_address}}—no worries if now\'s not a good time! Just wanted to see if you\'d be open to discussing some options, whether it\'s a cash offer or something creative. Give me a call back whenever it works for you at {{user_phone}}. Take care!',
  },
];

interface MessageTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (text: string) => void;
  activeConversation: ConversationDisplay;
  user: User | null;
}

function replacePlaceholders(template: string, conversation: ConversationDisplay, user: User | null): string {
  let result = template;
  
  // Contact replacements
  const firstName = conversation.name?.split(' ')[0] || 'there';
  result = result.replace(/{{first_name}}/g, firstName);
  
  // Property replacements
  const propertyAddress = conversation.originalData?.address || 
    (conversation.originalData?.address1 ? 
      `${conversation.originalData.address1}, ${conversation.originalData.city || ''} ${conversation.originalData.state || ''} ${conversation.originalData.postalCode || ''}` : 
      conversation.originalData?.mls_address || 'your property');
  result = result.replace(/{{property_address}}/g, propertyAddress);
  
  // User replacements
  result = result.replace(/{{user_name}}/g, user?.name || 'Team Member');
  result = result.replace(/{{user_phone}}/g, user?.phone || user?.phoneNumbers?.[0]?.phoneNumber || 'N/A');
  
  // Additional placeholders (with defaults for now)
  result = result.replace(/{{client_name}}/g, 'our client');
  result = result.replace(/{{last_sold_address}}/g, '123 Main St');
  result = result.replace(/{{company_name}}/g, 'NextProp');
  result = result.replace(/{{days_on_market}}/g, '90+');
  
  return result;
}

export default function MessageTemplates({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  activeConversation,
  user
}: MessageTemplatesProps) {
  // Get templates from localStorage or use defaults
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('messageTemplates');
    if (savedTemplates) {
      setTemplates([...DEFAULT_TEMPLATES, ...JSON.parse(savedTemplates)]);
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  const saveCustomTemplates = (updatedTemplates: Template[]) => {
    const customTemplates = updatedTemplates.filter(t => t.isCustom);
    localStorage.setItem('messageTemplates', JSON.stringify(customTemplates));
  };

  const handleSelectTemplate = (template: Template) => {
    const replacedText = replacePlaceholders(template.text, activeConversation, user);
    onSelectTemplate(replacedText);
    onClose();
  };

  const handleAddTemplate = () => {
    setNewTemplate({ id: `custom-${Date.now()}`, name: '', text: '', isCustom: true });
    setEditMode(true);
  };

  const handleEditTemplate = (template: Template) => {
    setNewTemplate({ ...template });
    setEditMode(true);
  };

  const handleSaveTemplate = () => {
    if (!newTemplate || !newTemplate.name || !newTemplate.text) return;
    
    const updatedTemplates = newTemplate.isCustom && templates.some(t => t.id === newTemplate.id)
      ? templates.map(t => t.id === newTemplate.id ? newTemplate : t)
      : [...templates, newTemplate];
    
    setTemplates(updatedTemplates);
    saveCustomTemplates(updatedTemplates);
    setNewTemplate(null);
    setEditMode(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    saveCustomTemplates(updatedTemplates);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-700/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium flex items-center">
            <MessageSquare size={18} className="mr-2" /> 
            Message Templates
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {editMode ? (
            <div className="space-y-4">
              <input
                type="text"
                value={newTemplate?.name || ''}
                onChange={e => setNewTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Template name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <textarea
                value={newTemplate?.text || ''}
                onChange={e => setNewTemplate(prev => prev ? { ...prev, text: e.target.value } : null)}
                placeholder="Template text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={6}
              />
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">Available Variables:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className="bg-gray-100 p-1 rounded">{"{{first_name}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{property_address}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{user_name}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{user_phone}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{client_name}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{last_sold_address}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{company_name}}"}</span>
                  <span className="bg-gray-100 p-1 rounded">{"{{days_on_market}}"}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(template => (
                  <div 
                    key={template.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:border-purple-400 transition-colors relative group"
                  >
                    <div className="font-medium mb-1 flex items-center justify-between">
                      <span>{template.name}</span>
                      {template.isCustom && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="text-gray-400 hover:text-purple-600"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.text}</p>
                    <button
                      className="mt-2 text-xs text-purple-600 hover:text-purple-800"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      Use template
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddTemplate}
                className="flex items-center justify-center text-purple-600 hover:text-purple-800 mt-4 w-full p-2 border border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
              >
                <Plus size={16} className="mr-1" /> Create custom template
              </button>
            </>
          )}
        </div>

        {editMode && (
          <div className="border-t border-gray-200 p-3 flex justify-end space-x-3">
            <button
              onClick={() => {
                setNewTemplate(null);
                setEditMode(false);
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!newTemplate?.name || !newTemplate?.text}
              className={`px-4 py-2 text-sm text-white rounded-md flex items-center ${
                !newTemplate?.name || !newTemplate?.text 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Save size={16} className="mr-1" /> Save Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 