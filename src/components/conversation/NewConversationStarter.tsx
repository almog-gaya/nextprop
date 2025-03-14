import { ConversationDisplay } from "@/types/messageThread";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export const NewConversationCreator = ({ contactId, onConversationCreated }: {
    contactId: string;
    onConversationCreated: (conversation: ConversationDisplay) => void;
}) => {
    const { user } = useAuth();
    const [contact, setContact] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [conversationType, setConversationType] = useState<'TYPE_PHONE' | 'TYPE_EMAIL' | null>(null);
    const [smsText, setSmsText] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const hasPhoneNumbers = user?.phoneNumbers?.length > 0;

    useEffect(() => {
        const fetchContactData = async () => {
            try {
                if(contact) return;
                const response = await axios.get(`/api/contacts/${contactId}`);
                const contactData = response.data;
                setContact(contactData);
                const type = contactData.phone ? 'TYPE_PHONE' : 'TYPE_EMAIL';
                setConversationType(type);
                
                // Set default number if available
                if (type === 'TYPE_PHONE' && user?.phoneNumbers?.length > 0) {
                    const defaultNumber = user.phoneNumbers.find(num => num.isDefaultNumber)?.phoneNumber || 
                                        user.phoneNumbers[0].phoneNumber;
                    setSelectedNumber(defaultNumber);
                }
            } catch (error) {
                console.error('Failed to fetch contact:', error);
                toast.error('Failed to load contact details');
            } finally {
                setLoading(false);
            }
        };

        fetchContactData();
    }, [contactId, user]);
    function getConvoType(convo: ConversationDisplay) {
        /// if phone and email both are available go for lastMessageType ?? type
        /// if phone is available only return Sms
        /// if email is avialable only return Email
        if (convo.email && convo.phone) {
          return convo.lastMessageType ?? convo.type;
        } else if (convo.email) {
          return 'TYPE_EMAIL'
        } else {
          return 'TYPE_PHONE'
        }
      }
      const getAppropriateType = (type: string) => {
        switch (type) {
          case 'TYPE_PHONE':
            return 'SMS';
          case 'TYPE_EMAIL':
          case 'TYPE_CUSTOM_EMAIL':
            return 'Email';
          default:
            return 'SMS';
        }
      };
    const handleSend = async () => {
        if (!conversationType || sending) return;

        if (conversationType === 'TYPE_PHONE' && !hasPhoneNumbers) {
            toast.error('No available phone number to send SMS');
            return;
        }
        setSending(true);
        try {
            const messageType = getAppropriateType(getConvoType(contact!)!);
            const payload = { 
                type: messageType,
                body: smsText,
                text: smsText,
                message: smsText,
                contactId: contactId,
                ...(messageType === 'SMS' && {
                  toNumber: contact!.phone,
                  fromNumber: selectedNumber,
                }),
                ...(messageType === 'Email' && {
                  html: emailBody,
                  emailTo: contact!.email,
                  subject: emailSubject,
                  emailFrom: 'no-reply@gmail.com',
                  body: smsText,
                  text: smsText,
                  message: smsText,
                }),
              };

              console.log(`[payload]: ${JSON.stringify(payload)}`);
            const convoResponse = await fetch('/api/conversations/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const convoData = await convoResponse.json();

            if (convoResponse.ok) {
                const name = contact?.fullName || contact?.name || contact?.email || contact?.phone || 'Unknown Contact';
                const initials = name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                const newConversation: ConversationDisplay = {
                    id: convoData.id,
                    name,
                    avatar: initials,
                    lastMessage: conversationType === 'TYPE_PHONE' ? smsText : emailSubject || 'No messages yet',
                    timestamp: 'Recent',
                    unread: false,
                    contactId,
                    email: contact?.email,
                    phone: contact?.phone,
                    originalData: convoData,
                    type: conversationType,
                };

                onConversationCreated(newConversation);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
            toast.error('Failed to start new conversation');
        } finally {
            setSending(false);
        }
    };

    const contactName = contact?.fullNameLowerCase || contact?.email || contact?.phone || 'Unknown Contact';
    const initials = contactName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="flex flex-col h-full items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-sm p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-600 mb-4"></div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Loading Contact
                        </h3>
                        <p className="text-gray-500 mt-2">
                            Please wait while we fetch the contact details...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-medium">
                                    {initials}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    New {conversationType === 'TYPE_PHONE' ? 'SMS' : 'Email'} with {contactName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {conversationType === 'TYPE_PHONE' ? contact?.phone : contact?.email}
                                </p>
                            </div>
                        </div>

                        {conversationType === 'TYPE_PHONE' && (
                            <div className="space-y-4">
                                {hasPhoneNumbers && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Send from:
                                        </label>
                                        <select
                                            value={selectedNumber || ''}
                                            onChange={(e) => setSelectedNumber(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                                            disabled={sending}
                                        >
                                            {user?.phoneNumbers?.map((num) => (
                                                <option key={num.phoneNumber} value={num.phoneNumber}>
                                                    {num.phoneNumber} {num.isDefaultNumber ? '(Default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea
                                        value={smsText}
                                        onChange={(e) => setSmsText(e.target.value)}
                                        placeholder="Type your SMS message..."
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 transition-all"
                                        rows={4}
                                        disabled={sending || !hasPhoneNumbers}
                                    />
                                    <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                                        {smsText.length}/160
                                    </span>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!smsText.trim() || sending || !hasPhoneNumbers}
                                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {sending ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : hasPhoneNumbers ? (
                                        'Send SMS'
                                    ) : (
                                        'No Available Phone Number'
                                    )}
                                </button>
                            </div>
                        )}

                        {conversationType === 'TYPE_EMAIL' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Subject"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                                    disabled={sending}
                                />
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="Type your email message..."
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 transition-all"
                                    rows={6}
                                    disabled={sending}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!emailSubject.trim() && !emailBody.trim()) || sending}
                                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {sending ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Email'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <p className="text-xs text-gray-400 mt-4 text-center">
                    Contact ID: {contactId}
                </p>
            </div>
        </div>
    );
};