'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';

// Define Property interface
interface Property {
  property_id: string;
  listing_id?: string;
  price: string;
  beds: number;
  baths: number;
  address: {
    line: string;
    city: string;
    state_code: string;
    postal_code: string;
  };
  title?: string;
  home_size?: string;
  year_built?: string;
  property_type?: string;
  days_on_zillow?: string;
  image_url?: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Example search suggestions
  const searchSuggestions = [
    "Luxury waterfront houses in Miami Beach under $3M with pool and at least 3 beds",
    "Condos in Brickell Miami with ocean view under $3M",
    "Single family homes in Coral Gables Miami built after 2010 with at least 4 beds",
    "Modern apartments in Downtown Miami under $3M with gym access"
  ];

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchQuery("Properties in Miami under $3M");
      query = "Properties in Miami under $3M";
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Specifically using the Zillow Working API endpoint
      const url = '/api/properties/ai-search';
      const params = {
        prompt: query.trim(),
        limit: '8', // Limiting to 8 results (between 5-10 as requested)
        api: 'zillow' // Explicitly specify Zillow API
      };
      
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${url}?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      
      // Ensure we have image_url for all properties and format prices correctly
      const processedProperties = data.map((property: any) => ({
        ...property,
        // If image_url is missing, use a default Miami property image
        image_url: property.image_url || 'https://images.unsplash.com/photo-1549415697-8edfc62b131b?q=80&w=1000&auto=format&fit=crop',
        // Make sure price is properly formatted
        price: property.price && typeof property.price === 'string' 
          ? property.price.startsWith('$') ? property.price : `$${property.price}`
          : typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : '$TBD'
      }));
      
      setProperties(processedProperties);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Use suggestion for search
  const useSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Load default search on first render
  useEffect(() => {
    handleSearch("Properties in Miami under $3M");
  }, []);

  return (
    <DashboardLayout title="Properties">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-lg text-gray-600 mb-6">
            Find your dream property with our advanced AI-powered search
          </p>
          
          {/* Search bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent text-lg"
                placeholder="Describe your ideal property... (e.g., Miami beach house under $3M with pool)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={() => handleSearch()}
                className="absolute inset-y-0 right-0 px-6 py-2 nextprop-gradient text-white font-medium rounded-r-lg flex items-center"
              >
                Search
              </button>
            </div>
            
            {/* Search suggestions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => useSuggestion(suggestion)}
                  className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Results section */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loader"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="mt-2 text-sm text-red-600">
                    Search is currently experiencing issues. Try these alternatives:
                  </p>
                  <ul className="list-disc list-inside mt-1 text-sm text-red-600">
                    <li>Try a different query</li>
                    <li>Click one of the example searches above</li>
                    <li>Try again later</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#1e1b4b] mr-2">Search Results</h2>
                <div className="nextprop-gradient h-1 w-20 rounded-full"></div>
              </div>
              {properties.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No properties found. Try refining your search criteria.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div key={property.property_id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg border-b-2 border-[#7c3aed]">
                      <div className="relative h-48 w-full bg-gray-200">
                        {property.image_url ? (
                          <Image 
                            src={property.image_url} 
                            alt={property.address?.line || 'Property'} 
                            fill
                            className="object-cover"
                            unoptimized={true} // Use this for external images
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-0 right-0 nextprop-gradient text-white px-3 py-1 m-2 rounded-full text-sm font-medium">
                          {property.price}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-[#1e1b4b] mb-1 truncate">
                          {property.address?.line || 'Property Address'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 truncate">
                          {property.address?.city}{property.address?.city && property.address?.state_code ? ', ' : ''}{property.address?.state_code} {property.address?.postal_code}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <span>{property.beds} Beds</span>
                            <span>•</span>
                            <span>{property.baths} Baths</span>
                            {property.home_size && (
                              <>
                                <span>•</span>
                                <span>{property.home_size}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-[#7c3aed]">
                            {property.days_on_zillow && `${property.days_on_zillow} days on market`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* About section */}
        <div className="mt-16 bg-white rounded-xl shadow-sm p-6 border-t-2 border-[#7c3aed]">
          <h2 className="text-xl font-bold text-[#1e1b4b] mb-4">About Our Real Estate Search</h2>
          <p className="text-gray-600 mb-4">
            Our AI-powered search helps you find properties using natural language. Simply describe what you're looking for,
            and our system will match you with relevant listings.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 text-[#1e1b4b]">Search Tips:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
            <li>Include location details (neighborhood, city)</li>
            <li>Specify price range (under $X, between $X-$Y)</li>
            <li>Mention important features (pool, ocean view, etc.)</li>
            <li>Include size requirements (beds, baths, square footage)</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
} 