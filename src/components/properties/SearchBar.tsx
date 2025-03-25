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
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-grow w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Redfin Link</label>
            <input
              type="text"
              placeholder="e.g., https://www.redfin.com/zipcode/32754/filter/min-days-on-market=3mo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isScraping}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex gap-3">
            {searchMode === "zipcode" && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                disabled={isScraping}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:bg-gray-300 disabled:text-gray-500"
              >
                <FunnelIcon className="h-5 w-5" />
                <span className="font-medium">Filters</span>
              </button>
            )}
            <button
              onClick={handleScrapeWithValidation}
              disabled={isScraping || !!priceError}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                isScraping || priceError
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

        {/* {searchMode === "zipcode" && showFilters && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Days on Redfin</label>
                <select
                  value={daysOnZillow}
                  onChange={(e) => setDaysOnZillow(e.target.value)}
                  disabled={isScraping}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="1wk">Last 7 days</option>
                  <option value="2wk">Last 14 days</option>
                  <option value="1mo">Last 30 days</option>
                  <option value="2mo">Last 60 days</option>
                  <option value="3mo">Last 90 days</option>
                  <option value="6mo">Last 180 days</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Home Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { type: "house", Icon: HomeIcon, label: "House" },
                    { type: "townhouse", Icon: BuildingStorefrontIcon, label: "Townhouse" },  
                    { type: "multifamily", Icon: BuildingOffice2Icon, label: "Multi-family" }, 
                  ].map(({ type, Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleHomeTypeChange(type as keyof typeof homeTypes)}
                      disabled={isScraping}
                      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                        homeTypes[type as keyof typeof homeTypes]
                          ? "bg-purple-100 text-purple-700 shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } disabled:bg-gray-300 disabled:text-gray-500`}
                    >
                      <Icon className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div> 
              </div>
            </div>
          </div>
        )} */}
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