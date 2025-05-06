import { PhoneNumber } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw, Phone, MoreVertical, AlertCircle, Send, CheckCircle, ChevronDown, StickyNote, FileText, Paperclip, MessageSquare, Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import { ConversationDisplay, Message } from "@/types/messageThread";
import { ActivityMessageRenderer } from "./renderers/ActivityMessageRenderer";
import { EmailMessageRenderer } from "./renderers/EmailMessageRenderer";
import { NormalMessageRenderer } from "./renderers/NormalMessageRenderer";
import { CallMessageRenderer } from "./renderers/CallMessageRenderer";
import NoteSidebar from './NoteSidebar';
import MessageTemplates from './MessageTemplates';
import { useAuth } from "@/contexts/AuthContext";
import { IconButton } from '@/components/ui/iconButton';
import { DNDMessageRenderer } from "./renderers/DNDMessageRenderer";
import { usePathname } from "next/navigation";

const getMessageRenderer = (message: Message, handleRetrySendMessage: any, activeConversation: ConversationDisplay) => {
    const isMe = message.direction
        ? message.direction === 'outbound'
        : message.meta?.email?.direction === 'outbound';

    if ((message.activity?.title?.length ?? 0) > 0) {
        if(message.activity?.type === "user_dnd_disabled" || message.activity?.type === "user_dnd_enabled" || message.activity?.type === "contact_dnd_enabled" || message.activity?.type === "contact_dnd_disabled") {
            const isDisabled = message.activity?.type === "user_dnd_disabled" || message.activity?.type === "contact_dnd_disabled";
            return <DNDMessageRenderer message={message} isMe={isMe} isDisabled={isDisabled} />;
        }
        return <ActivityMessageRenderer message={message} />;
    } else if (message.type == "1") {
        return <CallMessageRenderer message={message} />;
    }
    else if ((message.meta?.email?.direction?.length ?? 0) > 0) {
        return <EmailMessageRenderer message={message} isMe={isMe} />;
    }

    else if (message.text || message.type == "2") {
        return <NormalMessageRenderer message={message} isMe={isMe} onRetry={(msg)=>handleRetrySendMessage(msg)} activeConversation={activeConversation} />;
    }
    return null;
};

interface MessageThreadProps {
    activeConversation: ConversationDisplay;
    onSendMessage: (message: string, fromNumber?: string, toNumber?: string) => void;
    messages: Message[];
    onLoadMore: (isRefresh?: boolean) => void;
    hasMore: boolean;
    loading: boolean;
    selectedNumber: string | null;
    phoneNumbers: PhoneNumber[];
    onNumberSelect?: (number: string) => void;
    handleRetrySendMessage?: (message: Message) => void;
}

const getConversationAppropriateType = (type: string) => {
    switch (type) {
        case 'TYPE_EMAIL':
        case 'TYPE_CUSTOM_EMAIL':
            return 'Email';
        default:
            return 'SMS';
    }
};

function getConvoType(convo: ConversationDisplay) {
    if (convo.email && convo.phone) {
        return convo.lastMessageType ?? convo.type;
    } else if (convo.email) {
        return 'TYPE_EMAIL';
    } else {
        return 'TYPE_PHONE';
    }
}

export default function MessageThread({
    activeConversation,
    onSendMessage,
    messages,
    onLoadMore,
    hasMore,
    loading,
    selectedNumber,
    phoneNumbers,
    onNumberSelect,
    handleRetrySendMessage,
}: MessageThreadProps) {
    const [newMessage, setNewMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isToDropdownOpen, setToDropdownOpen] = useState(false);
    const [selectedToNumber, setSelectedToNumber] = useState<string | null>(activeConversation?.phone || null);
    const [refreshing, setRefreshing] = useState(false);
    const [isNoteSidebarOpen, setIsNoteSidebarOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const { user } = useAuth();
    const pathname = usePathname();
    const showBackButton = pathname !== '/messaging-embed' && !pathname.endsWith('/messaging-embed');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current && !loading) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    useEffect(() => {
        if (sendingStatus === 'sending' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sendingStatus]);

    useEffect(() => {
        setSelectedToNumber(activeConversation?.phone || null);
    }, [activeConversation]);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ')
            .filter((n: string) => n.length > 0)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleSend = () => {
        setErrorMessage('');
        const conversationType = getConversationAppropriateType(getConvoType(activeConversation!)!);
        if (conversationType === 'SMS') {
            if (newMessage.trim() && selectedNumber) {
                setSendingStatus('sending');
                const toNumber = selectedToNumber || activeConversation.phone;
                onSendMessage(newMessage, selectedNumber, toNumber);
                setNewMessage('');
                setTimeout(() => setSendingStatus('idle'), 3000);
            }
        } else {
            if (newMessage.trim()) {
                setSendingStatus('sending');
                onSendMessage(newMessage);
                setNewMessage('');
                setTimeout(() => setSendingStatus('idle'), 3000);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRefresh = () => {
        if (activeConversation && !refreshing) {
            setRefreshing(true);
            onLoadMore(true);
            setTimeout(() => setRefreshing(false), 1000);
        }
    };

    const handleCall = async () => {
        if (!phoneNumbers?.length) {
            toast.error('You don\'t have any active phone number yet');
            return;
        }
        const response = await fetch(`/api/conversations/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'call',
                contactId: activeConversation.contactId,
                conversationId: activeConversation.id,
                conversationProviderId: 'twilio_provider',
                date: new Date().toISOString(),
                toNumber: activeConversation.phone,
                fromNumber: selectedNumber,
            }),
        });
        await response.json();
    };

    const formatPhoneNumber = (phone: string) => {
        if (!phone) return '';
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    };

    const handleSelectTemplate = (text: string) => {
        setNewMessage(text);
    };

    const handleContactClick = () => {
        if (activeConversation.contactId) {
            window.location.href = `/contacts/${activeConversation.contactId}`;
        }
    };

    if (!activeConversation) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-gray-500 p-8">
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                    <p>Please select a conversation from the list to view messages.</p>
                </div>
            </div>
        );
    }

    const renderSkeletonLoader = () => {
        return (
            <div className="animate-pulse space-y-4 py-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div
                            className={`max-w-[65%] rounded-lg px-4 py-2 ${i % 2 === 0 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'}`}
                        >
                            <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
                            <div className="h-3 w-12 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const conversationType = getConversationAppropriateType(getConvoType(activeConversation!)!);
    return (
        <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10" style={{ background: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)', height: '56px' }}>
                <div className="flex items-center h-full px-4">
                    {showBackButton && (
                        <button 
                            onClick={() => window.history.back()}
                            className="mr-2 p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                    )}
                    <Avatar initials={getInitials(activeConversation.name)} />
                    <div className="ml-3 flex-grow">
                        <p 
                            className="font-medium text-base text-gray-900 cursor-pointer hover:underline"
                            onClick={handleContactClick}
                        >
                            {activeConversation.name || 'Unknown Contact'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <IconButton
                            icon={<div className={`${refreshing ? 'animate-spin' : ''}`}>
                                <RefreshCw size={20} className="text-gray-600" />
                            </div>}
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                            tooltip="Refresh messages"
                        />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto h-[calc(100vh-180px)]">
                {loading ? renderSkeletonLoader() : (
                    <div className="p-4 space-y-4">
                        {hasMore && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={() => onLoadMore()}
                                    className="bg-white text-purple-600 px-4 py-2 rounded-full border border-purple-300 text-sm font-medium hover:bg-purple-50 transition-colors"
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load earlier messages'}
                                </button>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div key={message.id}>
                                {getMessageRenderer(message, handleRetrySendMessage, activeConversation)}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            <div className="bg-white">
                {conversationType === 'SMS' && (
                    <div className="border-b border-gray-200">
                        {/* FROM and TO dropdowns side by side */}
                        <div className="flex items-center justify-between px-4 py-2">
                            {/* FROM dropdown on the left */}
                            <div className="flex items-center">
                                <div className="text-gray-600 text-sm mr-1">From:</div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="flex items-center justify-between text-sm text-gray-700"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <span>{selectedNumber ? formatPhoneNumber(selectedNumber) : '+1 Select a number'}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                                    </button>
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute z-10 bottom-full mb-1 w-56 origin-bottom-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {phoneNumbers.map((phone) => (
                                                <button
                                                    key={phone.phoneNumber}
                                                    className={`flex w-full items-center px-4 py-2 text-xs ${
                                                        selectedNumber === phone.phoneNumber ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                                    } hover:bg-gray-100`}
                                                    onClick={() => {
                                                        if (onNumberSelect) {
                                                            onNumberSelect(phone.phoneNumber);
                                                        }
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    {formatPhoneNumber(phone.phoneNumber)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TO dropdown on the right */}
                            <div className="flex items-center">
                                <div className="text-gray-600 text-sm mr-1">To:</div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="flex items-center justify-between text-sm text-gray-700"
                                        onClick={() => setToDropdownOpen(!isToDropdownOpen)}
                                    >
                                        <span>{selectedToNumber ? formatPhoneNumber(selectedToNumber) : formatPhoneNumber(activeConversation.phone)}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                                    </button>
                                    
                                    {isToDropdownOpen && (
                                        <div className="absolute z-10 bottom-full mb-1 w-56 origin-bottom-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {/* Always show the primary phone */}
                                            <button
                                                key={activeConversation.phone}
                                                className={`flex w-full items-center px-4 py-2 text-xs ${
                                                    selectedToNumber === activeConversation.phone ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                                } hover:bg-gray-100`}
                                                onClick={() => {
                                                    setSelectedToNumber(activeConversation.phone);
                                                    setToDropdownOpen(false);
                                                }}
                                            >
                                                {formatPhoneNumber(activeConversation.phone)}
                                            </button>
                                            
                                            {/* Show additional phone numbers if they exist */}
                                            {activeConversation.phones && activeConversation.phones
                                                .filter(phone => phone !== activeConversation.phone) // Filter out the primary phone
                                                .map((phone) => (
                                                    <button
                                                        key={phone}
                                                        className={`flex w-full items-center px-4 py-2 text-xs ${
                                                            selectedToNumber === phone ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                                        } hover:bg-gray-100`}
                                                        onClick={() => {
                                                            setSelectedToNumber(phone);
                                                            setToDropdownOpen(false);
                                                        }}
                                                    >
                                                        {formatPhoneNumber(phone)}
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="py-3 px-4">
                    {/* Input with rounded corners */}
                    <div className="flex items-center">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="w-full py-2 px-4 text-sm rounded-lg bg-gray-100 text-gray-700 placeholder-gray-500 outline-none border-none"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {/* Send Button */}
                        <button
                            className="ml-3 w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                            onClick={handleSend}
                            disabled={!newMessage.trim()}
                            type="button"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {activeConversation.contactId && (
                <NoteSidebar
                    contactId={activeConversation.contactId}
                    isOpen={isNoteSidebarOpen}
                    onClose={() => setIsNoteSidebarOpen(false)}
                />
            )}

            <MessageTemplates
                isOpen={isTemplatesOpen}
                onClose={() => setIsTemplatesOpen(false)}
                onSelectTemplate={handleSelectTemplate}
                activeConversation={activeConversation}
                user={user}
            />
        </div>
    );
}