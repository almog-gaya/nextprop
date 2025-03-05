import { useState, useEffect } from 'react';
import { Business } from '@/types/database';
import { AlertCircle, X, MessageSquare, Phone as PhoneIcon } from 'lucide-react';

interface NewMessageModalProps {
  onClose: () => void;
  onSend: (phoneNumber: string, message: string, businessId: string) => void;
  businesses: Business[];
  selectedBusinessId: string;
}

export default function NewMessageModal({ 
  onClose, 
  onSend, 
  businesses, 
  selectedBusinessId 
}: NewMessageModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [businessId, setBusinessId] = useState(selectedBusinessId);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // When selected business changes, update local state
  useEffect(() => {
    setBusinessId(selectedBusinessId);
  }, [selectedBusinessId]);

  const handleSend = async () => {
    setError('');
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
      setError('Phone number must be in E.164 format (e.g., +12025550123)');
      return;
    }
    
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSend(formattedPhone, message, businessId);
      
      // Reset form
      setPhoneNumber('');
      setMessage('');
      
      // Close modal
      onClose();
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="new-message-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <MessageSquare className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold">New Message</h2>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Form */}
        <div className="space-y-5">
          {/* Business selector - only show if multiple businesses */}
          {businesses.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
              <select
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} {business.phone_number ? `(${business.phone_number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Phone number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+12025550123"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be in international format (include country code)</p>
          </div>
          
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 