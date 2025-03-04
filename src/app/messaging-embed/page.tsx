'use client';

import { useEffect, useState } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';


function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium flex-shrink-0">
      {initials}
    </div>
  );
}

function ConversationList({ conversations, activeId, onSelect }: any) {
  return (
    <div className="border-r border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations"
            className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-y-auto flex-grow">
        {conversations.map((conversation: any) => (
          <div
            key={conversation.id}
            className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${activeId === conversation.id ? 'bg-gray-100' : ''
              }`}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar initials={conversation.avatar} />
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.name}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {conversation.timestamp}
                  </span>
                </div>
                <p className={`text-sm truncate ${conversation.unread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageThread({ messages, onSend }: any) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSend(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="block md:hidden mr-2">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
          </div>
          <Avatar initials="JS" />
          <div className="ml-3">
            <h2 className="font-medium text-gray-900">John Smith</h2>
            <p className="text-xs text-gray-500">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Phone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Video size={20} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${message.senderId === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
            >
              <p>{message.text}</p>
              <p className={`text-xs mt-1 ${message.senderId === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            placeholder="Type a message..."
            className="flex-grow rounded-lg border border-gray-300 p-2 min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
          />
          <button
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
            onClick={handleSend}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

 
interface Conversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType: string;
  type: string;
  unreadCount: number;
  fullName: string;
  contactName: string;
  email: string;
  phone: string;
}

 
interface Message {
  id: string;
  body: string;
  direction: string;
  dateAdded: string;
  messageType: string;
}

export default function MessagingEmbedPage() {
  const [activeConversationId, setActiveConversationId] = useState('1');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations?status=unread&sort=desc&sortBy=last_message_date&locationId=N3z6NPutyGGVRyOxjSDy');
        const data = await response.json();
        console.log('API Response:', data);  
        if (Array.isArray(data?.conversations)) {
          setConversations(data.conversations);
        } else {
          console.error('Invalid conversations data format:', data);
          setConversations([]);  
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);  
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  
  const formattedConversations = conversations.map(conv => ({
    id: conv.id,
    name: conv.fullName,
    lastMessage: conv.lastMessageBody,
    timestamp: 'Recent',
    unread: conv.unreadCount > 0,
    avatar: conv.fullName?.split(' ').map(n => n?.[0] || '').join('').toUpperCase() || 'U'
  }));

  // fetching messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) return;

      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/conversations/${activeConversationId}/messages`);
        const data = await response.json();

        if (Array.isArray(data?.messages)) {
          const formattedMessages = data.messages.map((msg: Message) => ({
            id: msg.id,
            senderId: msg.direction === 'inbound' ? 'client' : 'user',
            text: msg.body,
            timestamp: new Date(msg.dateAdded).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  // Update handleSendMessage
  const handleSendMessage = async (text: string) => {
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const body = { "type": "SMS", "contactId": "abc123def456", "appointmentId": "appt123", "attachments": ["https://storage.com/file1.pdf", "https://storage.com/file2.jpg"], "emailFrom": "sender@company.com", "emailCc": ["cc1@company.com", "cc2@company.com"], "emailBcc": ["bcc1@company.com", "bcc2@company.com"], "html": "<p>Hello World</p>", "message": text, "subject": "Important Update", "replyMessageId": "msg123", "templateId": "template123", "threadId": "thread123", "scheduledTimestamp": 1669287863, "conversationProviderId": "provider123", "emailTo": "recipient@company.com", "emailReplyMode": "reply", "fromNumber": "+1499499299", "toNumber": "+1439499299" }
      await fetch(`/api/conversations/messages`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <DashboardLayout title="Messaging >>>">
      <div className="h-[calc(100vh-200px)] grid grid-cols-1 md:grid-cols-3 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="hidden md:block">
          {loading ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : (
            <ConversationList
              conversations={formattedConversations}
              activeId={activeConversationId}
              onSelect={setActiveConversationId}
            />
          )}
        </div>
        <div className="md:col-span-2">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <div>Loading messages...</div>
            </div>
          ) : (
            <MessageThread
              messages={messages}
              onSend={handleSendMessage}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}