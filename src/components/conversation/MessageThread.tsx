import { PhoneNumber } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw, Phone, MoreVertical, AlertCircle, Send, CheckCircle, ChevronDown, StickyNote, FileText } from "lucide-react";
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

const getMessageRenderer = (message: Message, handleRetrySendMessage: any) => {
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
        return <NormalMessageRenderer message={message} isMe={isMe} onRetry={(msg)=>handleRetrySendMessage(msg)} />;
    }
    return null;
};

interface MessageThreadProps {
    activeConversation: ConversationDisplay;
    onSendMessage: (message: string, fromNumber?: string) => void;
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
    const [refreshing, setRefreshing] = useState(false);
    const [isNoteSidebarOpen, setIsNoteSidebarOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const { user } = useAuth();

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
                onSendMessage(newMessage, selectedNumber);
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
        <div className="flex flex-col h-full relative">
            <div className="border-b border-gray-200 p-3 sticky top-0 z-10 bg-white">
                <div className="flex items-center">
                    <div className="md:hidden mr-2">
                        <button className="p-2 rounded-md hover:bg-gray-100">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    <Avatar initials={getInitials(activeConversation.name)} />
                    <div className="ml-3 flex-grow">
                        <p className="font-medium">{activeConversation.name || 'Unknown Contact'}</p>
                        <div className="flex items-center text-sm text-gray-500">
                            {activeConversation.phone && (
                                <span className="mr-2">{activeConversation.phone}</span>
                            )}
                            {activeConversation.email && (
                                <span>{activeConversation.email}</span>
                            )}
                        </div>
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
                        {/* <IconButton
                            icon={<Phone size={20} className="text-gray-600" />}
                            onClick={handleCall}
                            tooltip="Call contact"
                        /> */}
                        <IconButton 
                            icon={<StickyNote size={20} className={isNoteSidebarOpen ? 'text-purple-600' : 'text-gray-600'} />}
                            onClick={() => setIsNoteSidebarOpen(true)}
                            tooltip="Contact notes"
                            className={isNoteSidebarOpen ? 'bg-purple-100 text-purple-600' : ''}
                        />
                        {/* <IconButton 
                            icon={<MoreVertical size={20} className="text-gray-600" />}
                            tooltip="More options"
                        /> */}
                    </div>
                </div>
            </div> 

            <div className="flex-grow overflow-y-auto p-4 relative">
                {hasMore && (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={() => onLoadMore()}
                            className="bg-white text-purple-600 px-4 py-2 rounded-full border border-blue-300 text-sm font-medium hover:bg-blue-50 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Load earlier messages'}
                        </button>
                    </div>
                )}

                {loading && messages.length === 0 ? (
                    renderSkeletonLoader()
                ) : messages && messages.length > 0 ? (
                    messages.map((message: Message) => (
                        <div
                            key={message.id}
                            className={`flex mb-4 ${message.activity
                                ? 'w-full px-4'
                                : (message.direction
                                    ? message.direction === 'outbound'
                                    : message.meta?.email?.direction === 'outbound')
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                        >
                            {getMessageRenderer(message, handleRetrySendMessage)}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col h-full items-center justify-center text-gray-500">
                        <div className="text-center p-4">
                            {loading ? (
                                <p>Loading messages...</p>
                            ) : activeConversation ? (
                                <p>No messages in this conversation yet. Send a message to start olas.</p>
                            ) : (
                                <p>Select a conversation to view messages.</p>
                            )}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-3 bg-white">
                <div className="space-y-2">
                    {conversationType === 'SMS' && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <div className="relative">
                                <span className="font-medium">From:</span>{' '}
                                {!phoneNumbers || phoneNumbers.length === 0 ? (
                                    <span className="text-red-500">No numbers available</span>
                                ) : phoneNumbers.length === 1 ? (
                                    <span>{formatPhoneNumber(phoneNumbers[0].phoneNumber)}</span>
                                ) : (
                                    <div className="inline-block">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center space-x-1 hover:text-purple-600"
                                        >
                                            <span>{formatPhoneNumber(selectedNumber || '')}</span>
                                            <ChevronDown size={16} />
                                        </button>
                                        {isDropdownOpen && (
                                            <div className="absolute left-0 mb-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 bottom-full">
                                                {phoneNumbers.map((number: PhoneNumber) => (
                                                    <button
                                                        key={number.phoneNumber}
                                                        onClick={() => {
                                                            onNumberSelect?.(number.phoneNumber);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                    >
                                                        {formatPhoneNumber(number.phoneNumber)}
                                                        {number.isDefaultNumber && (
                                                            <span className="ml-2 text-xs text-gray-500">(Default)</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="font-medium">To:</span>{' '}
                                {activeConversation.phone || 'Unknown Contact'}
                            </div>
                        </div>
                    )}

                    <div className="flex items-end">
                        <div className="relative flex-grow">
                            <textarea
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px] max-h-[160px]"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={sendingStatus === 'sending' || (conversationType === 'SMS' && !selectedNumber)}
                            />
                            <button
                                onClick={() => setIsTemplatesOpen(true)}
                                className="absolute bottom-2 right-2 text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-gray-100"
                                title="Use message template"
                            >
                                <FileText size={18} />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sendingStatus === 'sending' || (conversationType === 'SMS' && !selectedNumber)}
                            className={`ml-2 p-3 rounded-full flex items-center justify-center ${!newMessage.trim() || sendingStatus === 'sending' || (conversationType === 'SMS' && !selectedNumber)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {sendingStatus === 'sending' ? (
                                <div className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send size={18} className={!newMessage.trim() ? 'text-gray-400' : 'text-white'} />
                            )}
                        </button>
                    </div>

                    {sendingStatus === 'success' && (
                        <div className="mt-1 text-xs text-green-600 flex items-center">
                            <CheckCircle size={12} className="mr-1" /> Message sent successfully
                        </div>
                    )}
                    {((sendingStatus === 'error') || errorMessage) && (
                        <div className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            {errorMessage || 'Failed to send message. Please try again.'}
                        </div>
                    )}
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