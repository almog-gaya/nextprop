import { OpportunityPopup } from "@/components/OpportunityPopup";
import { Message } from "@/types/messageThread";
import { useEffect, useState } from "react";
import { Link } from "lucide-react";

// Sub-component: MessageHeader
const MessageHeader = ({ title, name, stage }: { title?: string; name?: string; stage?: string }) => (
  <div className="flex items-start justify-between">
    <div className="min-w-0 pr-2">
      <p className="truncate text-sm font-medium text-gray-800">
        {title || "Activity Update"}
      </p>
      {name && (
        <p className="mt-0.5 truncate text-xs text-gray-600">
          {name} - created in stage {stage || "New Lead"}
        </p>
      )}
    </div>
    <span className="flex-shrink-0 whitespace-nowrap rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-500">
      {/* Placeholder for future use */}
    </span>
  </div>
);

// Sub-component: MessageFooter
const MessageFooter = ({ pipeline, date }: { pipeline?: string; date: string }) => (
  <div className="mt-1.5 flex items-center gap-2 max-w-full">
    {pipeline && (
      <div className="truncate rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 max-w-[110px] shrink-0">
        {pipeline}
      </div>
    )}
    <div className="text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0">
      {new Date(date).toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        month: "short",
        day: "numeric",
      })}
    </div>
  </div>
);

// Sub-component: OpportunityButton
const OpportunityButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-xs font-medium text-[var(--nextprop-primary)] hover:text-[var(--nextprop-primary-dark)] transition-colors duration-150"
  >
    View opportunity
  </button>
);

// Main Component: ActivityMessageRenderer
export const ActivityMessageRenderer = ({ message }: { message: Message }) => {
  const [showPopup, setShowPopup] = useState(false);

  const getStageName = (stage: string | { newStageName: string } | undefined): string => {
    if (!stage) return "Unknown Stage";
    if (typeof stage === "string") return stage;
    return stage.newStageName || "Unknown Stage";
  };

  const getPipelineName = (pipeline: string | undefined): string => {
    return pipeline || "Unknown Pipeline";
  };

  const stageDisplay = message.activity?.title?.toLowerCase().includes("updated")? "New Lead" : "";

  return (
    <div className="w-full max-w-full overflow-hidden text-sm">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex-shrink-0">
            <Link size={16} className="text-gray-400" />
          </div>
          <div className="min-w-0 flex-grow space-y-1.5">
            <MessageHeader
              title={message.activity?.title}
              name={message.activity?.data?.name}
              stage={stageDisplay}
            />
            <OpportunityButton onClick={() => setShowPopup(true)} />
            <MessageFooter
              pipeline={message.activity?.data?.pipeline}
              date={message.dateAdded}
            />
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