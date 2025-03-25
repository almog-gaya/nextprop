import { Message } from "@/types/messageThread";
import { MoonStar, MoonIcon } from "lucide-react";

export const DNDMessageRenderer = ({ message, isMe, isDisabled }: { message: Message, isMe: boolean, isDisabled: boolean }) => {
    const title = isDisabled ? "Do Not Disturb Disabled" : "Do Not Disturb Enabled";
    const icon = isDisabled ? <MoonIcon size={18} className="text-gray-500" /> : <MoonStar size={18} className="text-amber-500" />;
    const bgColor = isDisabled ? "bg-gray-50" : "bg-amber-50";
    const borderColor = isDisabled ? "border-gray-200" : "border-amber-200";
    const textColor = isDisabled ? "text-gray-800" : "text-amber-800";
    const descriptionColor = isDisabled ? "text-gray-700" : "text-amber-700";
    const timeColor = isDisabled ? "text-gray-600" : "text-amber-600";
    const badgeColor = isDisabled ? "text-gray-600 bg-white border-gray-200" : "text-amber-600 bg-white border-amber-200";
    const badgeText = isDisabled ? "DND Disabled" : "DND Active";
    
    const description = isMe 
        ? isDisabled 
            ? "You have disabled Do Not Disturb mode. Messages will be delivered normally."
            : "You have enabled Do Not Disturb mode. Messages may not be delivered immediately."
        : isDisabled
            ? "This contact has disabled Do Not Disturb. Messages will be delivered normally."
            : "This contact has Do Not Disturb enabled. Messages may not be delivered immediately.";

    return (
        <div className="w-full">
            <div className={`${bgColor} rounded-xl border ${borderColor} py-3 px-4`}>
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <div className="min-w-0 pr-2">
                                <p className={`text-sm font-semibold ${textColor}`}>
                                    {title}
                                </p>
                                <p className={`text-xs ${descriptionColor} mt-0.5`}>
                                    {description}
                                </p>
                            </div>
                            <span className={`text-xs ${badgeColor} px-2 py-1 rounded-md border flex-shrink-0 whitespace-nowrap`}>
                                {badgeText}
                            </span>
                        </div>
                        
                        <div className={`text-xs mt-1 ${timeColor}`}>
                            {new Date(message.dateAdded).toLocaleString('en-US', {
                               hour: 'numeric',
                               minute: 'numeric',
                               hour12: true,
                               month: 'short',
                               day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};