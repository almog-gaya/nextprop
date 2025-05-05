import { Message } from "@/types/messageThread";
import { AlertCircle, Clock, MoreVertical, Phone, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const NormalMessageRenderer = ({ message, isMe, onRetry, activeConversation }: { message: Message; isMe: boolean, onRetry: (message: Message) => void, activeConversation: any }) => {

    const { meta = {}, status, dateAdded, text } = message;
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);

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

    // Close details modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
                setShowDetails(false);
            }
        };

        if (showDetails) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDetails]);

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(text || '');
        toast.success('Message copied to clipboard');
        setIsPopupOpen(false);
    };

    const handleResendMessage = () => {
        if (onRetry) {
            onRetry(message);
            setIsPopupOpen(false);
        }
    };

    const handleShowDetails = () => {
        setShowDetails(true);
        setIsPopupOpen(false);
    };

    // Format the timestamp for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get message status display
    const getStatusDisplay = () => {
        if (!isMe) return "Received";
        
        switch (status) {
            case "sent":
                return "Delivered";
            case "failed":
                return "Failed";
            case "queued":
                return "Queued";
            case "delivered":
                return "Delivered";
            case "read":
                return "Read";
            default:
                return status || "Unknown";
        }
    };

    return (
        <>
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
                        
                        {/* 3 dots menu button */}
                        <button 
                            onClick={() => setIsPopupOpen(!isPopupOpen)} 
                            className="ml-1 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                    
                    {/* Message options popup */}
                    {isPopupOpen && (
                        <div 
                            ref={popupRef}
                            className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                            style={{ top: '25px' }}
                        >
                            <div className="py-1">
                                <button
                                    onClick={handleCopyMessage}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Copy message
                                </button>
                                {isMe && status === 'failed' && (
                                    <button
                                        onClick={handleResendMessage}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Resend message
                                    </button>
                                )}
                                <button
                                    onClick={handleShowDetails}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Message details
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0" onClick={() => setShowDetails(false)}></div>
                    <div 
                        ref={detailsRef}
                        className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 w-full max-w-lg mx-4 relative"
                    >
                        <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b">
                            <h3 className="text-base font-medium text-gray-800">Message Details</h3>
                            <button 
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Content</div>
                                <div className="text-gray-700 text-sm p-3 bg-gray-50 rounded-md whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{text}</div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sent By</div>
                                    <div className="text-gray-700 text-sm">
                                        {isMe ? 'You' : activeConversation.name || 'Unknown'}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</div>
                                    <div className="flex items-center">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                            status === 'failed' ? 'bg-red-500' : 
                                            status === 'sent' || status === 'delivered' ? 'bg-green-500' : 
                                            'bg-yellow-500'
                                        }`}></span>
                                        <span className="text-gray-700 text-sm">{getStatusDisplay()}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Date & Time</div>
                                    <div className="flex items-center text-gray-700 text-sm">
                                        <Clock size={14} className="mr-1 text-gray-400" />
                                        {formatDate(dateAdded)}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Message ID</div>
                                    <div className="text-gray-500 text-xs font-mono">{message.id.substring(0, 10)}...</div>
                                </div>
                            </div>
                            
                            {Object.keys(meta).length > 0 && (
                                <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Additional Info</div>
                                    <div className="text-xs font-mono bg-gray-50 p-3 rounded-md overflow-auto max-h-40">
                                        {JSON.stringify(meta, null, 2)}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-5 py-3 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};