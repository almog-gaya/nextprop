import { Message } from "@/types/messageThread";
import { Phone, MoreVertical, X } from "lucide-react";
import { useState, useEffect } from "react";

interface CallDetails {
  id: string;
  callSid: string;
  from: string;
  to: string;
  direction: string;
  callStatus: string;
  duration: number;
  answeredBy?: {
    user: string;
    device: string;
    userDetails?: {
      id: string;
      fullName: string;
      phone: string;
      email: string;
    };
  };
}

export const CallMessageRenderer = ({ message }: { message: Message }) => {
  const hasCallRecording = (message.attachments?.length ?? 0) > 0;
  const recordingUrl = message.attachments?.[0];
  const callDuration = message.meta?.call?.duration || 0;
  const callStatus = message.meta?.call?.status || "unknown";
  const isOutbound = message.direction === "outbound";
  const [showMenu, setShowMenu] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert duration from seconds to minutes:seconds format
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const fetchDetails = () => {
    setShowPopup(true);
    setLoading(true);
    setShowMenu(false);
  };

  useEffect(() => {
    if (!showPopup || !loading) return;

    const fetchCallDetails = async () => {
      try {
        const response = await fetch(
          `/api/conversations/messages/call?id=${message.altId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch call details");
        }
        const data = await response.json();
        setCallDetails(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [showPopup, loading, message.altId]);

  // Determine icon color based on call status
  const iconColor = callStatus === "completed" ? "text-green-500" : "text-red-500";

  return (
    <div className="w-full max-w-[60%]">
      <div
        className={`rounded-lg px-4 py-2 ${
          isOutbound ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-900"
        }`}
      >
        <div className="flex items-start gap-2">
          <Phone size={18} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold">
                {isOutbound ? "Outbound Call" : "Inbound Call"}
              </p>
              <div className="flex items-center gap-2">
                {hasCallRecording && (
                  <span
                    className={`text-xs px-2 py-1 rounded-md border border-gray-200 ${
                      isOutbound ? "bg-white text-gray-600" : "bg-white text-gray-600"
                    }`}
                  >
                    {callDuration > 0 ? formatDuration(callDuration) : "No duration"}
                  </span>
                )}
                <div className="relative">
                  <MoreVertical
                    size={18}
                    className={`cursor-pointer ${
                      isOutbound ? "text-white" : "text-gray-500"
                    }`}
                    onClick={fetchDetails}
                  />
                  {showMenu && (
                    <div
                      className={`absolute right-0 mt-1 w-32 rounded-md shadow-lg ${
                        isOutbound ? "bg-purple-700 text-white" : "bg-white text-gray-900"
                      } border border-gray-200 z-10`}
                    >
                      <button
                        onClick={fetchDetails}
                        className={`block w-full text-left px-4 py-2 text-sm hover:${
                          isOutbound ? "bg-purple-800" : "bg-gray-100"
                        }`}
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasCallRecording && callStatus === "completed" && (
              <div className="mb-2">
                <audio
                  controls
                  src={recordingUrl}
                  className="w-full max-w-[300px]"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div
              className={`text-xs mt-1 ${
                isOutbound ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {new Date(message.dateAdded).toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Call Details Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-black">Call Details</h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-black hover:text-black transition-colors duration-200 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-black text-sm">Loading...</span>
                </div>
              ) : error || !callDetails ? (
                <div className="text-center">
                  <p className="text-red-500 text-sm">{error || "No data available"}</p>
                </div>
              ) : (
                <>
                  {/* Call Info Section */}
                  <div className="space-y-4">
                    <h4 className="text-lm font-bold text-black uppercase">
                      Call Info
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm text-gray-500">Direction</label>
                        <p className="text-base font-medium text-black capitalize">
                          {callDetails.direction}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <p className="text-base font-medium text-black capitalize">
                          {callDetails.callStatus}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">From</label>
                        <p className="text-base font-medium text-black">
                          {callDetails.from}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">To</label>
                        <p className="text-base font-medium text-black">
                          {callDetails.to}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Duration</label>
                        <p className="text-base font-medium text-black">
                          {formatDuration(callDetails.duration)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Answered By Section */}
                  <div className="space-y-4">
                    <h4 className="text-lm font-bold text-black uppercase">
                      Answered By
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="text-base font-medium text-black break-words">
                          {callDetails.answeredBy?.userDetails?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Device</label>
                        <p className="text-base font-medium text-black">
                          {callDetails.answeredBy?.device || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="text-base font-medium text-black">
                          {callDetails.answeredBy?.userDetails?.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="text-base font-medium text-black break-words">
                          {callDetails.answeredBy?.userDetails?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!loading && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};