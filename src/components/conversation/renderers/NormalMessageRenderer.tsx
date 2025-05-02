import { Message } from "@/types/messageThread";
import { AlertCircle, MoreVertical, Phone, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const NormalMessageRenderer = ({ message, isMe, onRetry, activeConversation }: { message: Message; isMe: boolean, onRetry: (message: Message) => void, activeConversation: any }) => {

    const { meta = {}, status, dateAdded, text } = message;
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsPopupOpen(false);
            }
        };

        if (isPopupOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isPopupOpen]);

    return (
        <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}> 
            <div className={`relative max-w-[65%] min-w-[200px] ${isMe ? 'bg-[#FCF8FF] text-gray-900 rounded-2xl rounded-br-sm' : 'bg-[#EFF3F5] text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200'} shadow-md px-5 py-3`}>
                {/* Sender name for received messages */}
             
                    <span className="block text-xs font-semibold text-[#3244FF] mb-1">{isMe ? 'Company' : activeConversation.name || 'Unknown'}</span>
                
                {/* Message Text */}
                <p className="break-words whitespace-pre-wrap text-sm font-normal leading-relaxed">{text}</p>
                {/* Timestamp and Status */}
                <div className={`absolute top-2  right-4 flex items-center space-x-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}> 
                    <span className="text-[12px] font-light">{new Date(dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && status === 'sent' && (
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M6.5 10.5l-2-2m0 0l-1-1m1 1l2 2 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                </div>
            </div>
        </div>
    );
};