import { useState } from 'react';
import { Send, MessageSquare, Loader } from 'lucide-react';

export default function SimplifiedMessaging() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sentMessages, setSentMessages] = useState<Array<{to: string, text: string, time: string}>>([]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    // Format phone number
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }
    
    setIsSending(true);
    
    try {
      console.log('Sending message to:', formattedPhone);
      
      const response = await fetch('/api/conversations/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          message: message.trim(),
          businessId: '3a541cbd-2a17-4a28-b384-448f1ce8cf32' // Hardcoded business ID for simplicity
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      // Add to sent messages
      setSentMessages(prev => [
        { 
          to: formattedPhone, 
          text: message.trim(),
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      setSuccess(`Message sent successfully to ${formattedPhone}`);
      setMessage(''); // Clear message input after sending
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-2xl font-bold">SMS Messaging</h1>
          <p className="opacity-80">Send SMS messages to your contacts</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
          {/* Message form */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Send a New Message</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                <span className="mr-2">⚠️</span>
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                <span className="mr-2">✅</span>
                <p>{success}</p>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 555 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Include country code (e.g. +1, +44, +972)</p>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message here..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {message.length} characters
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors disabled:bg-blue-300"
              >
                {isSending ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2" size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Sent messages */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
            
            {sentMessages.length === 0 ? (
              <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                <MessageSquare size={40} className="mb-3 text-gray-300" />
                <p>No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentMessages.map((msg, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between mb-2">
                      <span className="text-blue-600 font-medium">{msg.to}</span>
                      <span className="text-sm text-gray-500">{msg.time}</span>
                    </div>
                    <p className="text-gray-700">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 