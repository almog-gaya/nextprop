import React, { useState } from "react";
import {
  ArrowPathIcon,
  UserPlusIcon,
  FunnelIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

interface SearchBarProps {
  link: string;
  setLink: (link: string) => void;
  priceMin: number;
  setPriceMin: (price: number) => void;
  priceMax: number;
  setPriceMax: (price: number) => void;
  daysOnZillow: string;
  setDaysOnZillow: (days: string) => void;
  isScraping: boolean;
  handleScrapeProperties: (count: number) => void;
  dailyLimit: number;
  searchMode: "query" | "zipcode";
  setSearchMode: (mode: "query" | "zipcode") => void;
  types: string;
  setTypes: (types: string) => void;
}

export default function SearchBarProperties({
  link,
  setLink,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  daysOnZillow,
  setDaysOnZillow,
  isScraping,
  handleScrapeProperties,
  dailyLimit,
  searchMode,
  setTypes,
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [homeTypes, setHomeTypes] = useState({
    house: false,
    townhouse: false,
    multifamily: false,
  });

  const MIN_PRICE = 0;
  const MAX_PRICE = 1000000;

  const validatePriceRange = (min: number, max: number) => {
    if (min < 0 || max < 0) {
      setPriceError("Prices cannot be negative");
      return false;
    }
    if (min > max && max !== 0) {
      setPriceError("Max price must be greater than min price");
      return false;
    }
    setPriceError(null);
    return true;
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newMin = Math.max(MIN_PRICE, Math.min(value, priceMax));
    setPriceMin(newMin);
    validatePriceRange(newMin, priceMax);
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newMax = Math.min(MAX_PRICE, Math.max(value, priceMin));
    setPriceMax(newMax);
    validatePriceRange(priceMin, newMax);
  };

  const handleScrapeWithValidation = () => {
    if (validatePriceRange(priceMin, priceMax)) {
      handleScrapeProperties(dailyLimit);
    }
  };

  const handleHomeTypeChange = (type: keyof typeof homeTypes) => {
    const newHomeTypes = { ...homeTypes, [type]: !homeTypes[type] };
    const allSelected = Object.values(newHomeTypes).every((v) => v);
    if (allSelected) {
      setHomeTypes({
        house: false,
        townhouse: false,
        multifamily: false,
      });
      setTypes(Object.keys(newHomeTypes).filter((type) => newHomeTypes[type]).join("+"));
    } else {
      setHomeTypes(newHomeTypes);
    }
  };

  return (
    <div className="mb-8 rounded-xl bg-white shadow-lg p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 items-center">
          <div className="w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">Paste Redfin Link </label>            <input
              type="text"
              placeholder="e.g., https://www.redfin.com/zipcode/32754/filter/min-days-on-market=3mo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isScraping}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
              />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleScrapeWithValidation}
              disabled={isScraping || !!priceError}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${isScraping || priceError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg"
                }`}
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

      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: auto;
          position: relative;
          z-index: 20;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.2);
          background: #7c3aed;
        }
        input[type="range"]:disabled::-webkit-slider-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: auto;
          position: relative;
          z-index: 20;
        }
        input[type="range"]::-moz-range-thumb:active {
          transform: scale(1.2);
          background: #7c3aed;
        }
        input[type="range"]:disabled::-moz-range-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}