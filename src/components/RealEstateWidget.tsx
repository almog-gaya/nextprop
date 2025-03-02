import React, { useState } from 'react';
import { HomeModernIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface RealEstateWidgetProps {
  className?: string;
}

const RealEstateWidget: React.FC<RealEstateWidgetProps> = ({ className = '' }) => {
  const [citySearch, setCitySearch] = useState<string>('Miami');
  
  // Generate demo stats
  const stats = {
    totalListings: 142,
    newToday: 8,
    leadsGenerated: 23,
    avgPrice: "$745,000"
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center">
            <HomeModernIcon className="h-5 w-5 mr-2 text-blue-500" />
            Real Estate Leads
          </h3>
          <Link 
            href="/properties" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            View All
            <ArrowRightIcon className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total Listings</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalListings}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">New Today</p>
            <p className="text-lg font-bold text-gray-900">{stats.newToday}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Leads Generated</p>
            <p className="text-lg font-bold text-gray-900">{stats.leadsGenerated}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Avg. Price</p>
            <p className="text-lg font-bold text-gray-900">{stats.avgPrice}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Property Search</h4>
          <div className="flex">
            <input
              type="text"
              placeholder="Enter city name (e.g., Miami)"
              className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && window.location.assign(`/properties?city=${encodeURIComponent(citySearch)}`)}
            />
            <Link
              href={`/properties?city=${encodeURIComponent(citySearch)}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-lg"
            >
              Search
            </Link>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Cities</h4>
          <div className="flex flex-wrap gap-2">
            {['Miami', 'New York', 'Los Angeles', 'Chicago', 'Houston'].map((city) => (
              <Link
                key={city}
                href={`/properties?city=${encodeURIComponent(city)}`}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateWidget; 