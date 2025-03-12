import { Message } from "@/types/messageThread";
import { AlertCircle } from "lucide-react";

export const NormalMessageRenderer = ({ message, isMe }: { message: Message; isMe: boolean }) => (
    <div
        className={`max-w-[85%] rounded-lg px-4 py-2 ${isMe
                ? message.status === 'failed'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
    >
        <p className="break-words whitespace-pre-wrap text-sm">{message.text}</p>
        <div
            className={`text-xs mt-1 flex items-center ${isMe
                    ? message.status === 'failed'
                        ? 'text-red-500'
                        : 'text-blue-100'
                    : 'text-gray-500'
                }`}
        >
            {new Date(message.dateAdded).toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                month: 'short',
                day: 'numeric'
            })}
            {message.status === 'failed' && (
                <span className="ml-2 text-red-500 flex items-center">
                    <AlertCircle size={12} className="mr-1" /> Failed to send
                </span>
            )}
        </div>
    </div>
);
