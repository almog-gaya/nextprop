import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface ScrapingProgressProps {
  isScraping: boolean;
  progressPercentage: number;
  successCount: number;
  failureCount: number;
  currentStatus: string;
  setIsScraping: (isScraping: boolean) => void;
}

export default function ScrapingProgress({
  isScraping,
  progressPercentage,
  successCount,
  failureCount,
  currentStatus,
  setIsScraping,
}: ScrapingProgressProps) {
  if (!isScraping) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
        <h3 className="text-xl font-semibold mb-4">Scraping Properties</h3>
        <div className="mb-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-gray-600">{successCount} properties scraped</span>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
              <span>Successful</span>
            </div>
            <span className="font-medium">{successCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
              <span>Failed</span>
            </div>
            <span className="font-medium">{failureCount}</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <p>{currentStatus}</p>
        </div>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setIsScraping(false)}
            disabled={progressPercentage < 100}
          >
            {progressPercentage < 100 ? "Processing..." : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}