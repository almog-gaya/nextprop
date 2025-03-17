import React from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, UserPlusIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isScraping: boolean;
  handleScrapeProperties: (count: number) => void;
  dailyLimit: number;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  isScraping,
  handleScrapeProperties,
  dailyLimit,
}: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="e.g., Miami property under $1,000,000"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isScraping}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleScrapeProperties(dailyLimit)}
            disabled={isScraping}
            className={`flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm text-white font-medium ${isScraping ? "bg-gray-500" : "bg-purple-700 hover:bg-purple-800"}`}
          >
            {isScraping ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-5 w-5" />
                Scrape {dailyLimit} Properties
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}