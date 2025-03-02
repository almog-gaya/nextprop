'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyListing from '@/components/PropertyListing';

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiType = searchParams.get('api') as 'propgpt' | 'reapi' | 'realtor' | 'zillow' || 'propgpt';
  const limit = Number(searchParams.get('limit')) || 12;
  
  // State for filter options
  const [priceRange, setPriceRange] = useState<string>(searchParams.get('price_max') || '1000000');
  const [bedrooms, setBedrooms] = useState<string>(searchParams.get('beds_min') || '');
  const [propertyType, setPropertyType] = useState<string>(searchParams.get('property_type') || '');
  
  // Handle filter application
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Add current API type
    params.append('api', apiType);
    
    // Add filter values
    if (priceRange) params.append('price_max', priceRange);
    if (bedrooms) params.append('beds_min', bedrooms);
    if (propertyType) params.append('property_type', propertyType);
    
    // Preserve limit
    params.append('limit', limit.toString());
    
    // Navigate to the filtered results
    router.push(`/properties?${params.toString()}`);
  };
  
  return (
    <DashboardLayout title="Real Estate Listings">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Listings</h1>
          <p className="text-gray-600 mt-2">
            Browse recently listed properties in Miami under $1 million
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md mb-8 p-4">
          <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label htmlFor="priceRange" className="mb-2 text-sm font-medium text-gray-700">
                Price Range
              </label>
              <select 
                id="priceRange" 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="1000000">Under $1,000,000</option>
                <option value="750000">Under $750,000</option>
                <option value="500000">Under $500,000</option>
                <option value="300000">Under $300,000</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="bedrooms" className="mb-2 text-sm font-medium text-gray-700">
                Bedrooms
              </label>
              <select 
                id="bedrooms" 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="propertyType" className="mb-2 text-sm font-medium text-gray-700">
                Property Type
              </label>
              <select 
                id="propertyType" 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="single_family">Single Family</option>
                <option value="condo">Condo/Townhome</option>
                <option value="multi_family">Multi-Family</option>
                <option value="land">Land</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        <PropertyListing 
          apiType={apiType}
          limit={limit}
          title="Miami Properties Under $1M"
          subtitle="Recently listed properties in Miami under $1 million"
        />
        
        <div className="mt-10 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">About Our Real Estate Data</h2>
          <p className="text-gray-600 mb-4">
            We provide comprehensive real estate data from multiple trusted sources to help you make informed decisions.
            Our property listings are updated regularly to ensure you have access to the most current information available.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Available Data Providers:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>PropGPT API</strong> - Uses AI to find properties matching natural language queries</li>
            <li><strong>RealEstateAPI.com</strong> - Comprehensive property data with detailed analytics</li>
            <li><strong>Realtor.com</strong> - One of the largest databases of listings in the United States</li>
            <li><strong>Zillow API</strong> - Search for specific properties by address with detailed information</li>
          </ul>
          
          <p className="text-gray-600 mt-6">
            Want to customize this data for your specific needs? Contact our team for custom integrations.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
} 