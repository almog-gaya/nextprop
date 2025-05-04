import React, { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  PhoneIcon,
  UserIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Property {
  property_id: string;
  listing_id: string;
  price: string;
  beds: number;
  baths: number;
  address: {
    line: string;
    city: string;
    state_code: string;
    postal_code: string;
  };
  // Added fields for simplified UI
  title: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  // Optional extended properties
  year_built?: string;
  lot_size?: string;
  home_size?: string;
  property_type?: string;
  days_on_zillow?: string;
  image_url?: string;
}

interface PropertyListingProps {
  limit?: number;
}

export default function PropertyListing({ limit = 6 }: PropertyListingProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastSearchType, setLastSearchType] = useState<'ai' | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [addedLeads, setAddedLeads] = useState<string[]>([]);

  // Example prompts for AI search - all focused on Miami as requested
  const examplePrompts = [
    "Luxury waterfront houses in Miami Beach under $2M with pool and at least 3 beds...",
    "Condos in Brickell Miami with ocean view...",
    "Single family homes in Coral Gables Miami built after 2010 with at least 4 beds...",
    "Modern apartments in Downtown Miami under $1M with gym access and less than 15 days on market..."
  ];

  // Function to generate random contact details for demo purposes
  const generateRandomContact = () => {
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Maria', 'Robert'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: `(305) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
    };
  };

  // Generate property titles based on features
  const generatePropertyTitle = (property: any) => {
    const features = [];
    if (property.beds) features.push(`${property.beds} bed`);
    if (property.baths) features.push(`${property.baths} bath`);
    
    let propertyType = property.property_type || '';
    if (!propertyType) {
      if (property.beds <= 1) {
        propertyType = 'Condo';
      } else if (property.beds <= 3) {
        propertyType = 'Apartment';
      } else {
        propertyType = 'House';
      }
    }
    
    return `${features.join(', ')} ${propertyType} in ${property.address.city}`;
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!aiPrompt.trim()) {
        // Default to Miami properties if no prompt provided
        setAiPrompt("Modern houses in Miami with pool");
      }
      
      // Use the AI search endpoint
      const url = '/api/properties/ai-search';
      const params = {
        prompt: aiPrompt.trim(),
        limit: limit.toString()
      };
      
      setLastSearchType('ai');
      setSearchCount(prev => prev + 1);
      
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${url}?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      
      // Process Zillow API response format
      let formattedProperties: Property[] = [];
      
      if (data && Array.isArray(data)) {
        // Map array of properties
        formattedProperties = data.map((property: any) => ({
          property_id: property.property_id || property.zpid || String(Math.random()),
          listing_id: property.listing_id || String(Math.random()),
          price: property.price || '$0',
          beds: property.beds || 0,
          baths: property.baths || 0,
          address: {
            line: property.address?.line || property.address || 'Address not available',
            city: property.address?.city || 'Miami',
            state_code: property.address?.state_code || 'FL',
            postal_code: property.address?.postal_code || '33101'
          },
          title: property.title || generatePropertyTitle(property),
          contact: property.contact || generateRandomContact(),
          year_built: property.year_built,
          lot_size: property.lot_size,
          home_size: property.home_size,
          property_type: property.property_type,
          days_on_zillow: property.days_on_zillow,
          image_url: property.image_url || getRandomImageUrl(property.beds || 3, property.property_type)
        }));
        
        // Sort by days on market (days_on_zillow), lowest first
        formattedProperties.sort((a, b) => {
          const daysA = parseInt(a.days_on_zillow || '100', 10);
          const daysB = parseInt(b.days_on_zillow || '100', 10);
          return daysA - daysB;
        });
      } else if (data) {
        // Handle single property response
        formattedProperties = [{
          property_id: data.property_id || data.zpid || String(Math.random()),
          listing_id: data.listing_id || String(Math.random()),
          price: data.price || '$0',
          beds: data.beds || 0,
          baths: data.baths || 0,
          address: {
            line: data.address?.line || data.address || 'Address not available',
            city: data.address?.city || 'Miami',
            state_code: data.address?.state_code || 'FL',
            postal_code: data.address?.postal_code || '33101'
          },
          title: data.title || generatePropertyTitle(data),
          contact: data.contact || generateRandomContact(),
          year_built: data.year_built,
          lot_size: data.lot_size,
          home_size: data.home_size,
          property_type: data.property_type,
          days_on_zillow: data.days_on_zillow,
          image_url: data.image_url || getRandomImageUrl(data.beds || 3, data.property_type)
        }];
      }
      
      setProperties(formattedProperties);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get a random real estate image URL as fallback
  const getRandomImageUrl = (beds: number, type: string = '') => {
    const imagePool = [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d'
    ];
    
    // If it's likely a condo or apartment, use more urban-looking images
    if (type.toLowerCase().includes('condo') || type.toLowerCase().includes('apartment') || beds <= 2) {
      return imagePool[Math.floor(Math.random() * 4) + 4]; // Use more urban images
    }
    
    // Otherwise return a random house image
    return imagePool[Math.floor(Math.random() * imagePool.length)];
  };

  useEffect(() => {
    fetchProperties();
  }, [limit]);

  const handleSearch = () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a property description');
      return;
    }
    fetchProperties();
  };

  const handleAddToLeads = async (property: Property) => {
    try {
      // Don't add the same lead twice
      if (addedLeads.includes(property.property_id)) {
        alert(`${property.contact.name} is already in your leads!`);
        return;
      }
      
      const response = await fetch('/api/contacts/add-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: property.contact.name,
          email: property.contact.email,
          phone: property.contact.phone,
          address: `${property.address.line}, ${property.address.city}, ${property.address.state_code} ${property.address.postal_code}`,
          notes: `Interested in: ${property.title} - ${property.price}`,
          source: 'Real Estate Listing',
          type: 'Property Inquiry'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add lead');
      }

      const result = await response.json();
      
      // Track added leads to prevent duplicates
      setAddedLeads(prev => [...prev, property.property_id]);
      
      // Show success feedback
      alert(`Successfully added ${property.contact.name} to contacts!`);
    } catch (err) {
      console.error('Error adding lead:', err);
      alert('Failed to add contact. Please try again.');
    }
  };

  const useExamplePrompt = (index: number) => {
    setAiPrompt(examplePrompts[index]);
    setTimeout(() => fetchProperties(), 100);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Real Estate Listings</h2>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
          {showAdvanced ? 'Simple View' : 'Detailed View'}
        </button>
      </div>

      <div className="mb-6">
        <div className="space-y-3">
          <div className="relative rounded-md shadow-sm">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Describe your dream property in Miami (e.g., Luxury waterfront condo in Miami Beach with 2 beds, pool access)"
              rows={3}
            />
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-2">
              <InformationCircleIcon className="h-4 w-4 inline mr-1" />
              Example searches:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button 
                  key={index}
                  onClick={() => useExamplePrompt(index)} 
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <p className="text-xs text-gray-500">
              Tip: Include details like neighborhood, property type, price range, bedrooms, bathrooms, etc.
            </p>
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-blue-700"
            >
              Search Properties
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            {error}
          </p>
          <div className="mt-3">
            <p className="text-sm">Search is currently experiencing issues. Try these alternatives:</p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              <li>Try a different query</li>
              <li>Click one of the example searches above</li>
              <li>Try again later</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <HomeIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or try one of our example searches.
              </p>
            </div>
          ) : (
            properties.map((property) => (
              <div key={property.property_id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full bg-gray-200">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <HomeIcon className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Days on market badge */}
                  {property.days_on_zillow && (
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium text-gray-800 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {parseInt(property.days_on_zillow) === 0 ? 'New Today' : 
                       parseInt(property.days_on_zillow) === 1 ? '1 day on market' : 
                       `${property.days_on_zillow} days on market`}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{property.title}</h3>
                  <p className="text-gray-600">{property.address.line}</p>
                  <p className="text-gray-600">{property.address.city}, {property.address.state_code} {property.address.postal_code}</p>
                  <p className="text-gray-900 font-bold text-xl mt-2">{property.price}</p>
                  
                  {showAdvanced && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {property.year_built && (
                        <div>
                          <span className="font-medium">Year Built:</span> {property.year_built}
                        </div>
                      )}
                      {property.lot_size && (
                        <div>
                          <span className="font-medium">Lot Size:</span> {property.lot_size}
                        </div>
                      )}
                      {property.home_size && (
                        <div>
                          <span className="font-medium">Home Size:</span> {property.home_size}
                        </div>
                      )}
                      {property.days_on_zillow && (
                        <div>
                          <span className="font-medium">Days on Market:</span> {property.days_on_zillow}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Contact Agent</h4>
                    <div className="flex items-center mb-1">
                      <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{property.contact.name}</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{property.contact.email}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{property.contact.phone}</span>
                    </div>
                    
                    <button
                      onClick={() => handleAddToLeads(property)}
                      disabled={addedLeads.includes(property.property_id)}
                      className={`w-full mt-2 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${addedLeads.includes(property.property_id) 
                        ? 'bg-green-600 text-white cursor-default' 
                        : 'text-white bg-purple-600 hover:bg-blue-700'}`}
                    >
                      {addedLeads.includes(property.property_id) ? 'Added to Contacts' : 'Add to Contacts'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 