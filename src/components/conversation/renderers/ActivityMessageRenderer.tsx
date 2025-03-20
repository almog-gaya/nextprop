import { OpportunityPopup } from "@/components/OpportunityPopup";
import { Message } from "@/types/messageThread";
import { useState } from "react";
import { Link } from "lucide-react";

export const ActivityMessageRenderer = ({ message }: { message: Message }) => {
    const [showPopup, setShowPopup] = useState(false);

    // Helper function to get stage name as string
    const getStageName = (stage: string | { newStageName: string } | undefined): string => {
        if (!stage) return 'Unknown Stage';
        if (typeof stage === 'string') return stage;
        return stage.newStageName || 'Unknown Stage';
    };

    // Helper function to get pipeline name as string
    const getPipelineName = (pipeline: string | undefined): string => {
        return pipeline || 'Unknown Pipeline';
    };

    return (
        <div className="w-full">
            <div className="bg-[#eeeef0] rounded-xl border border-gray-200 py-3 px-4">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                        <Link size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {message.activity?.title || 'Activity Update'}
                                </p>
                                {message.activity?.data && (
                                    <p className="text-sm text-gray-700 mt-0.5 truncate">
                                        {message.activity.data.name} - created in stage {message.activity?.title?.toLowerCase().includes('updated') ? 'Tested Sabrina SMS' : 'New Lead'}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200 flex-shrink-0 whitespace-nowrap">
                                
                            </span>
                        </div>
                        
                        <button
                            onClick={() => setShowPopup(true)}
                            className="text-sm text-[#9333ea] hover:text-purple-700 font-medium"
                        >
                            View opportunity
                        </button>

                        <div className="text-sm mt-1 text-gray-500">
                            {new Date(message.dateAdded).toLocaleString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {showPopup && message.activity?.data && (
                <OpportunityPopup
                    id={message.activity.data.id}
                    pipelineName={getPipelineName(message.activity.data.pipeline)}
                    stageName={getStageName(message.activity.data.stage)}
                    onClose={() => setShowPopup(false)}
                />
            )}
        </div>
    );
};