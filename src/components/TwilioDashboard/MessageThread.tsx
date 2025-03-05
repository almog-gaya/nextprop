import { useState } from 'react';
import { Send, Phone, MoreVertical, ArrowLeft } from 'lucide-react';
import { Business } from '@/types/database';

interface MessageThreadProps {
  messages: any[];
  onSend: (message: string, businessId?: string) => void;
  activeConversation: any;
  businesses: Business[];
  selectedBusinessId: string;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium flex-shrink-0">
      {initials}
    </div>
  );
}

export default function MessageThread({ 
  messages, 
  onSend, 
  activeConversation, 
  businesses,
  selectedBusinessId 
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [businessId, setBusinessId] = useState(selectedBusinessId);

  // When selected business changes, update local state
  if (selectedBusinessId !== businessId) {
    setBusinessId(selectedBusinessId);
  }

  const handleSend = () => {
    if (newMessage.trim()) {
      onSend(newMessage, businessId);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get info about the active conversation
  const contactName = activeConversation ? activeConversation.name : 'Select a conversation';
  const contactPhone = activeConversation ? activeConversation.phone : '';

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="block md:hidden mr-2">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
          </div>
          {activeConversation && (
            <>
              <Avatar initials={activeConversation.avatar} />
              <div className="ml-3">
                <h2 className="font-medium text-gray-900">{contactName}</h2>
                <p className="text-xs text-gray-500">{contactPhone}</p>
              </div>
            </>
          )}
          {!activeConversation && (
            <div className="ml-3">
              <h2 className="font-medium text-gray-900">No conversation selected</h2>
              <p className="text-xs text-gray-500">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeConversation && (
            <>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Phone size={20} className="text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && activeConversation ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Send one to start the conversation.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.senderId === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p>{message.text}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${message.senderId === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </span>
                  {message.businessName && message.senderId === 'user' && (
                    <span className={`text-xs ml-2 ${message.senderId === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.businessName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        {/* Business selector */}
        {businesses?.length > 0 && (
          <div className="mb-2">
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            >
              {businesses.map((business: Business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            placeholder={activeConversation ? "Type a message..." : "Select a conversation to start messaging"}
            className="flex-grow rounded-lg border border-gray-300 p-2 min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            disabled={!activeConversation}
          />
          <button
            className={`text-white rounded-full p-2 transition-colors ${
              activeConversation && newMessage.trim() 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!activeConversation || !newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 