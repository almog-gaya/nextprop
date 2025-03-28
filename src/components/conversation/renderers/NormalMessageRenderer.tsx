import { Message } from "@/types/messageThread";
import { AlertCircle, MoreVertical, Phone, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const NormalMessageRenderer = ({ message, isMe, onRetry }: { message: Message; isMe: boolean, onRetry: (message: Message) => void }) => {

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

    return (
        <div className="relative max-w-[85%]">
            {/* Message Bubble */}
            <div
                className={`rounded-xl px-5 py-4 shadow-md ${isMe
                    ? status === 'failed'
                        ? 'bg-red-100 text-red-700 border border-red-300/50'
                        : 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900 border border-gray-200/50'}`}
                style={{ backdropFilter: 'blur(10px)' }} // Glassmorphism effect
            >
                {/* Three-Dot Menu (Top Right) */}
                {(
                    <button
                        onClick={() => setIsPopupOpen(!isPopupOpen)}
                        className={`absolute top-2 right-2 focus:outline-none hover:opacity-75 ${isMe && status !== 'failed' ? 'text-white' : 'text-gray-500'}`}
                    >
                        <MoreVertical size={16} />
                    </button>
                )}

                {/* Message Text */}
                <p className="break-words whitespace-pre-wrap text-sm font-medium leading-relaxed pr-8">
                    {text}
                </p>

                {/* Timestamp and Status */}
                <div
                    className={`text-xs mt-3 flex items-center ${isMe
                        ? status === 'failed'
                            ? 'text-red-500'
                            : 'text-blue-100/90'
                        : 'text-gray-500'}`}
                >
                    <span className="font-light">
                        {new Date(dateAdded).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true,
                            month: 'short',
                            day: 'numeric',
                        })}
                    </span>
                    {status === 'failed' && (
                        <span 
                            className="ml-3 flex items-center text-red-500 cursor-pointer hover:underline"
                            onClick={() => { 
                                onRetry(message);
                            }}
                        >
                            <AlertCircle size={12} className="mr-1" /> Failed to send
                        </span>
                    )}
                </div>
            </div>

            {/* Popup for Details (Top Right) */}
            {isPopupOpen && (
                <div
                    ref={popupRef}
                    className="absolute z-10 top-0 right-0 mt-10 rounded-lg shadow-lg p-4 w-64 bg-white text-gray-900 border border-gray-200"
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    {/* Cross Button (Top Right) */}
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
                            <span>Status: {status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};