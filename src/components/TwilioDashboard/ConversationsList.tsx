import { Search, Plus } from 'lucide-react';

interface ConversationsListProps {
  conversations: any[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium flex-shrink-0">
      {initials}
    </div>
  );
}

export default function ConversationsList({ 
  conversations, 
  activeId, 
  onSelect,
  onNewMessage
}: ConversationsListProps) {
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
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                activeId === conversation.id ? 'bg-gray-100' : ''
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
                  {conversation.business && (
                    <span className="text-xs text-blue-600">{conversation.business}</span>
                  )}
                </div>
                {conversation.unread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <button 
          className="w-full py-2 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={onNewMessage}
        >
          <Plus size={18} />
          <span>New Message</span>
        </button>
      </div>
    </div>
  );
} 