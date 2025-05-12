import { Message } from "@/types/messageThread";
import { AlertCircle, MoreVertical, Phone, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { ErrorIcon } from "react-hot-toast";

export const NormalMessageRenderer = ({ message, isMe, onRetry, activeConversation }: { message: Message; isMe: boolean, onRetry: (message: Message) => void, activeConversation: any }) => {
    const { user, logout } = useAuth();
    const { meta = {}, status, dateAdded, text } = message;
    const { from = "", to = "" } = meta;
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

    useEffect(() => {
        console.log("message abc", message)

    });
    return (
        <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[65%] min-w-[300px] ${isMe
                    ? (status === 'failed'||  status === 'undelivered')
                        ? 'bg-red-100 text-red-700 border border-red-300/50 rounded-2xl rounded-br-sm'
                        : 'bg-[#FCF8FF] text-gray-900 rounded-2xl rounded-br-sm'
                    : 'bg-[#EFF3F5] text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200'
                } shadow-md px-5 py-3`}>
                {/* Three-Dot Menu Button */}
                <button
                    onClick={() => setIsPopupOpen(!isPopupOpen)}
                    className={`absolute top-2 right-4 focus:outline-none hover:opacity-75 ${isMe && status !== 'failed' ? 'text-gray-400' : 'text-gray-500'}`}
                >
                    <MoreVertical size={16} />
                </button>

                {/* Sender name for received messages */}
                <span className="block text-xs font-semibold text-[#3244FF] mb-1">{isMe ? user?.name : activeConversation.name || 'Unknown'}</span>

                {/* Message Text */}
                <p className="break-words whitespace-pre-wrap text-sm font-normal leading-relaxed pr-12 pb-3">{text}</p>

                {/* Timestamp and Status */}
                <div className={`absolute top-2 right-12 flex items-center space-x-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                    <span className="text-[12px] font-light">{new Date(dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && status === 'sent' && (
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M6.5 10.5l-2-2m0 0l-1-1m1 1l2 2 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                </div>

                {/* Failed/Undelivered Status */}
                {(isMe && (status === 'failed' || status === 'undelivered')) && (
                    <div className="absolute bottom-2 right-4">
                        <span
                            className="flex items-center text-red-500 cursor-pointer hover:underline text-xs"
                            onClick={() => onRetry(message)}
                        >
                            <AlertCircle size={12} className="mr-1" /> Failed to send
                        </span>
                    </div>
                )}

                {/* Popup for Details */}
                {isPopupOpen && (
                    <div
                        ref={popupRef}
                        className="absolute z-10 top-0 right-0 mt-10 rounded-lg shadow-lg p-4 w-64 bg-white text-gray-900 border border-gray-200"
                        style={{ backdropFilter: 'blur(10px)' }}
                    >
                        {/* Cross Button */}
                        <button
                            onClick={() => setIsPopupOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-blue-500" />
                                <span>From: {from || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-blue-500" />
                                <span>To: {to || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-purple-500" />
                                <span>Status: {status}  </span>
                            </div>
                            {(status === 'failed' || status === 'undelivered') && (
                                <div className="flex items-center gap-2">
                           
                                    <span className="text-red-500"> {message.meta.error.message||message.meta.error.msg}</span>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

