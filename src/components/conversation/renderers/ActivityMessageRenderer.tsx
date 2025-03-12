import { OpportunityPopup } from "@/components/OpportunityPopup";
import { Message } from "@/types/messageThread";
import { useState } from "react";

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
        <>
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-200 text-gray-900 border border-gray-200 mx-auto">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">🔗</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {message.activity?.title || 'Activity Update'}
                        </p>
                        {message.activity?.data && (
                            <p className="text-sm text-gray-800">
                                {message.activity.data.name} created in stage{' '}
                                {getStageName(message.activity.data.stage)}
                            </p>
                        )}
                    </div>
                    {message.activity?.data?.pipeline && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {message.activity.data.pipeline}
                        </span>
                    )}
                </div>

                {message.activity?.data && (
                    <button
                        onClick={() => setShowPopup(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                        View opportunity
                    </button>
                )}

                <div className="text-xs mt-2 flex items-center text-gray-500">
                    {new Date(message.dateAdded).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                    })}
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
        </>
    );
};