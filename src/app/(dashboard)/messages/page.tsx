import SimpleMessageSender from '@/components/SimpleMessageSender';

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Send and manage your messages</p>
      </div>
      <div className="flex-1 p-6">
        <SimpleMessageSender />
      </div>
    </div>
  );
} 