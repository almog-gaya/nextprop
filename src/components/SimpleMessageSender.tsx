"use client";

import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export default function SimpleMessageSender() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sentMessages, setSentMessages] = useState<Array<{to: string, text: string, time: string}>>([]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/conversations/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          message: message.trim(),
          businessId: '3a541cbd-2a17-4a28-b384-448f1ce8cf32'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      setSentMessages(prev => [
        { 
          to: formattedPhone, 
          text: message.trim(),
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      setSuccess(`Message sent successfully to ${formattedPhone}`);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex flex-1 flex-col md:flex-row h-full bg-white rounded-lg shadow-sm">
      {/* Left panel - Message form */}
      <div className="w-full md:w-1/3 border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">New Message</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start text-sm">
            <AlertCircle className="mr-2 h-4 w-4 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-colors"
              placeholder="+1 555 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-colors"
              placeholder="Type your message here..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-2.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium rounded-lg flex items-center justify-center transition-colors disabled:bg-[#a78bfa] disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : (
              <>
                <Send className="mr-2" size={16} />
                Send Message
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8">
          <h3 className="font-medium text-sm text-gray-900 mb-3">Recent Messages</h3>
          {sentMessages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages sent yet</p>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-24rem)] overflow-y-auto pr-2">
              {sentMessages.map((msg, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 hover:border-[#7c3aed] transition-colors">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#7c3aed] font-medium">{msg.to}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-gray-700">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Right panel - Conversation placeholder */}
      <div className="flex-1 flex items-center justify-center bg-gray-50/50 p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-1">No conversation selected</p>
          <p className="text-sm">Send a message to start a new conversation</p>
        </div>
      </div>
    </div>
  );
} 