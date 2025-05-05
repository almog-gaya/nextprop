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
        <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10" style={{ background: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)', height: '56px' }}>
                <div className="flex items-center h-full px-4">
                    <div className="md:hidden mr-2">
                        <button className="p-2 rounded-md hover:bg-gray-100">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    <Avatar initials={getInitials(activeConversation.name)} />
                    <div className="ml-3 flex-grow">
                        <p className="font-medium text-base text-gray-900">{activeConversation.name || 'Unknown Contact'}</p>
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
            <div className="bg-[#F4F7F9] px-4 py-3">
                <div className="flex items-center w-full">
                    {/* Attachment Icon */}
                    {/* <button className="text-gray-400 hover:text-gray-500 mr-3">
                        <Paperclip className="w-5 h-5" />
                    </button> */}
                    {/* Input + icons */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            className="w-full h-10 rounded-full bg-white px-5 pr-24 text-gray-700 placeholder-gray-400 outline-none border-none shadow-sm"
                            placeholder="Write a message"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center space-x-3">
                            {/* <button className="text-gray-400 hover:text-gray-500">
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-500">
                                <Smile className="w-5 h-5" />
                            </button> */}
                        </div>
                    </div>
                    {/* Send Button OUTSIDE the input */}
                    <button
                        className="ml-3 w-9 h-9 flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 transition"
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        type="button"
                    >
                        <Send className="w-4.5 h-4.5" />
                    </button>
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