interface ActionButtonsProps {
  isJobRunning: boolean;
  handleCancelJob: () => void;
  handleRunNow: () => void; 
  hasSearchQuery: boolean;
}

export default function ActionButtons({ 
  isJobRunning, 
  handleCancelJob, 
  handleRunNow,  
  hasSearchQuery 
}: ActionButtonsProps) {
  return (
    <div className="pt-5 mt-4 border-t border-gray-200">
      <div className="flex justify-end space-x-3">
        {isJobRunning ? (
          <button
            onClick={handleCancelJob}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 shadow-sm"
          >
            Cancel Job
          </button>
        ) : (
          <button
            onClick={handleRunNow}
            disabled={!hasSearchQuery}
            className={`px-4 py-2 rounded-md transition-colors duration-200 shadow-sm ${
              !hasSearchQuery
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Run Now
          </button>
        )}
      </div>
    </div>
  );
}