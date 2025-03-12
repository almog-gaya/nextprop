import { useState } from "react";
import { Message } from "@/types/messageThread";
import { AlertCircle, ChevronDown, ChevronUp, Mail } from "lucide-react";

/**
 * Props for the EmailMessageRenderer component.
 */
interface EmailMessageRendererProps {
    message: Message; // The message object containing email details
    isMe: boolean;    // Indicates if the message is sent by the current user
}

/**
 * EmailMessageRenderer component renders an individual email message in a conversation thread.
 * It supports expanding the message to fetch and display the full email content via an API call.
 */
export const EmailMessageRenderer = ({ message, isMe }: EmailMessageRendererProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [fullMessage, setFullMessage] = useState<{
        from: string;
        to: string[];
        cc: string[];
        bcc: string[];
        body: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Base styles with improved contrast and readability
    const messageStyles = {
        base: "max-w-[85%] rounded-lg px-5 py-4 border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md",
        sender: isMe
            ? message.status === "failed"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-purple-700 text-white border-purple-700"
            : "bg-white text-gray-900 border-gray-200",
    };

    const timestampStyles = {
        base: "text-xs mt-3 flex items-center font-medium",
        color: isMe
            ? message.status === "failed"
                ? "text-red-500"
                : "text-purple-200"
            : "text-gray-500",
    };

    // Format the timestamp for display
    const formattedDate = new Date(message.dateAdded).toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        month: "short",
        day: "numeric",
    });

    // Function to fetch full email content via API
    const fetchFullMessage = async () => {
        if (isExpanded && fullMessage) return; // Skip if already fetched

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/conversations/messages/email?id=${message.meta?.email?.messageIds[0]}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch email content");
            }

            const data = await response.json();
            setFullMessage({
                from: data.from,
                to: data.to,
                cc: data.cc || [],
                bcc: data.bcc || [],
                body: data.body,
            });
            setIsExpanded(true);
        } catch (err) {
            setError("An error occurred while fetching the email content.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle expand/collapse on click
    const handleClick = () => {
        if (!isExpanded) {
            fetchFullMessage();
        } else {
            setIsExpanded(false);
        }
    };

    return (
        <div
            className={`${messageStyles.base} ${messageStyles.sender} group`}
            onClick={handleClick}
        >
            {/* Email header with icon */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Mail size={16} className={`mr-2 ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-500"}`} />
                    {message.meta?.email?.subject ? (
                        <h3 className="font-bold text-base leading-tight">
                            {message.meta.email.subject}
                        </h3>
                    ) : (
                        <h3 className="font-bold text-base leading-tight">Email Message</h3>
                    )}
                </div>
                {!isLoading && (
                    <div className={`${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-500"}`}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                )}
            </div>

            {/* Preview text when collapsed */}
            {!isExpanded && !isLoading && (
                <p className={`text-sm ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-500"} italic flex items-center`}>
                    <span>Tap to view full message</span>
                </p>
            )}

            {/* Expanded content */}
            {isExpanded && fullMessage && (
                <div className={`text-sm space-y-4 mt-3 pt-3 border-t ${isMe && message.status !== "failed" ? "border-purple-500" : "border-gray-200"}`}>
                    {/* From */}
                    <div className="flex flex-col">
                        <span className={`font-semibold ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-600"} text-xs uppercase tracking-wide mb-1`}>
                            From:
                        </span>
                        <span className={`${isMe && message.status !== "failed" ? "text-white" : "text-gray-900"} break-words`}>
                            {fullMessage.from}
                        </span>
                    </div>

                    {/* To */}
                    <div className="flex flex-col">
                        <span className={`font-semibold ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-600"} text-xs uppercase tracking-wide mb-1`}>
                            To:
                        </span>
                        <span className={`${isMe && message.status !== "failed" ? "text-white" : "text-gray-900"} break-words`}>
                            {fullMessage.to.join(", ")}
                        </span>
                    </div>

                    {/* CC (if present) */}
                    {fullMessage.cc.length > 0 && (
                        <div className="flex flex-col">
                            <span className={`font-semibold ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-600"} text-xs uppercase tracking-wide mb-1`}>
                                CC:
                            </span>
                            <span className={`${isMe && message.status !== "failed" ? "text-white" : "text-gray-900"} break-words`}>
                                {fullMessage.cc.join(", ")}
                            </span>
                        </div>
                    )}

                    {/* BCC (if present) */}
                    {fullMessage.bcc.length > 0 && (
                        <div className="flex flex-col">
                            <span className={`font-semibold ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-600"} text-xs uppercase tracking-wide mb-1`}>
                                BCC:
                            </span>
                            <span className={`${isMe && message.status !== "failed" ? "text-white" : "text-gray-900"} break-words`}>
                                {fullMessage.bcc.join(", ")}
                            </span>
                        </div>
                    )}

                    {/* Body */}
                    <div className={`pt-3 border-t ${isMe && message.status !== "failed" ? "border-purple-500" : "border-gray-200"}`}>
                        <span className={`font-semibold ${isMe && message.status !== "failed" ? "text-purple-200" : "text-gray-600"} text-xs uppercase tracking-wide block mb-2`}>
                            Message:
                        </span>
                        <div
                            className={`${isMe && message.status !== "failed" ? "text-white prose-invert" : "text-gray-900"} prose prose-sm max-w-none`}
                            dangerouslySetInnerHTML={{ __html: fullMessage.body }}
                        />
                    </div>
                </div>
            )}

            {/* Loading state with improved indicator */}
            {isLoading && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-gray-300"></div>
                    <span className="ml-2 text-sm font-medium text-gray-500">Loading email...</span>
                </div>
            )}

            {/* Error state with improved visibility */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mt-2 flex items-center">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Timestamp and status */}
            <div className={`${timestampStyles.base} ${timestampStyles.color} justify-between`}>
                <span>{formattedDate}</span>
                {message.status === "failed" && (
                    <span className="text-red-500 flex items-center ml-2">
                        <AlertCircle size={12} className="mr-1" />
                        Failed to send
                    </span>
                )}
            </div>
        </div>
    );
};