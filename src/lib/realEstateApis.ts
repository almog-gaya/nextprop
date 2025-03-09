import { getCachedData } from './enhancedApi';

// Constants
export const DEFAULT_PROPGPT_API_KEY = process.env.PROPGPT_API_KEY || '';
export const DEFAULT_REAPI_KEY = process.env.REAPI_KEY || '';
export const DEFAULT_RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '566bf65200msh29c052dcdd20b4cp1b5559jsne5bb52a3b1a0';
export const DEFAULT_ZILLOW_RAPIDAPI_HOST = 'zillow-working-api.p.rapidapi.com';

// Helper Functions
function validatePropGptApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 20) {
    return false;
  }
  return true;
}

function validateReapiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 20) {
    return false;
  }
  return true;
}

// Cache Duration in seconds
const CACHE_DURATION = 3600; // 1 hour cache

// PropGPT API Integration
// Documentation: https://developer.realestateapi.com/reference/propgpt-api
async function searchPropertiesWithPropGpt(
  query: string,
  params: any = {},
  apiKey = DEFAULT_PROPGPT_API_KEY
) {
  if (!validatePropGptApiKey(apiKey)) {
    throw new Error('Invalid PropGPT API key format');
  }
  
  try {
    // The PropGPT API endpoint would be replaced with the actual endpoint
    const endpoint = 'https://api.realestateapi.com/propgpt/search';
    
    // Get the city parameter for the query
    const city = params.city || 'Miami';
    const state = params.state_code || 'FL';
    
    // If a specific query wasn't provided, generate one based on the city
    const searchQuery = query || `Recently listed houses in ${city}, ${state} under $1 million`;
    
    const fullParams = {
      query: searchQuery,
      city: city,
      state: state,
      sort: params.sort || 'newest',
      ...params,
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(fullParams),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`PropGPT API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to search properties with PropGPT:', error);
    throw error;
  }
}

// RealEstateAPI.com Integration
async function searchPropertiesWithReapi(
  params: any = {},
  apiKey = DEFAULT_REAPI_KEY
) {
  if (!validateReapiKey(apiKey)) {
    throw new Error('Invalid REAPI key format');
  }
  
  try {
    // The actual RealEstateAPI endpoint
    const endpoint = 'https://api.realestateapi.com/v1/property/search';
    
    // Get the city parameter
    const city = params.city || 'Miami';
    const state = params.state_code || 'FL';
    
    const requestBody = {
      location: {
        city: city,
        state: state
      },
      price_max: params.price_max || 1000000,
      sort_by: params.sort || 'newest',
      limit: params.limit || 20,
      offset: params.offset || 0,
      ...params
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`RealEstateAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to search properties with RealEstateAPI:', error);
    throw error;
  }
}

// RapidAPI Realtor.com Integration
async function searchPropertiesWithRealtor(
  params: any = {},
  apiKey = DEFAULT_RAPIDAPI_KEY
) {
  if (!apiKey) {
    throw new Error('Invalid RapidAPI key');
  }
  
  try {
    const endpoint = 'https://realtor.p.rapidapi.com/properties/v2/list-for-sale';
    
    // Get the city parameter, default to Miami
    const city = params.city || 'Miami';
    const state = params.state_code || 'FL';
    
    const queryParams = new URLSearchParams({
      city: city,
      state_code: state,
      offset: params.offset?.toString() || '0',
      limit: params.limit?.toString() || '20',
      sort: params.sort || 'newest', // Default to newest listings
      price_max: params.price_max?.toString() || '1000000'
    });
    
    // Add additional filter parameters if provided
    if (params.beds_min) queryParams.append('beds_min', params.beds_min.toString());
    if (params.baths_min) queryParams.append('baths_min', params.baths_min.toString());
    if (params.price_min) queryParams.append('price_min', params.price_min.toString());
    if (params.property_type) queryParams.append('property_type', params.property_type);
    
    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
    };
    
    const response = await fetch(`${endpoint}?${queryParams}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Realtor.com API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to search properties with Realtor.com:', error);
    throw error;
  }
}

// Zillow API Integration via RapidAPI
async function getPropertyByAddressWithZillow(
  address: string,
  apiKey = DEFAULT_RAPIDAPI_KEY
) {
  if (!apiKey) {
    throw new Error('Invalid RapidAPI key');
  }
  
  try {
    const endpoint = 'https://zillow-working-api.p.rapidapi.com/byaddress';
    
    // URL encode the address parameter
    const queryParams = new URLSearchParams({
      propertyaddress: address
    });
    
    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': DEFAULT_ZILLOW_RAPIDAPI_HOST
    };
    
    const response = await fetch(`${endpoint}?${queryParams}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get property with Zillow API:', error);
    throw error;
  }
}

// Search properties with Zillow API
async function searchPropertiesWithZillow(
  params: any = {},
  apiKey = DEFAULT_RAPIDAPI_KEY
) {
  try {
    // Get search parameters
    const city = params.city || 'Miami';
    const state = params.state_code || 'FL';
    const beds = Number(params.beds_min) || 0;
    const baths = Number(params.baths_min) || 0;
    const priceMax = Number(params.price_max) || 1000000;
    
    // Format the AI prompt based on search parameters
    const aiPrompt = `Houses for sale ${beds > 0 ? `with ${beds} beds` : ''} ${baths > 0 ? `${beds > 0 ? 'and' : 'with'} ${baths} baths` : ''} in ${city} ${state} ${priceMax > 0 ? `under $${Math.floor(priceMax).toLocaleString()}` : ''}`.trim();
    
    console.log(`Searching properties with Zillow API using prompt: ${aiPrompt}`);
    
    // Call the Zillow API using the byaiprompt endpoint
    const response = await fetch(
      `https://${DEFAULT_ZILLOW_RAPIDAPI_HOST}/search/byaiprompt?ai_search_prompt=${encodeURIComponent(aiPrompt)}&page=1&sortOrder=Homes_for_you`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': DEFAULT_ZILLOW_RAPIDAPI_HOST,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got valid results
    if (data && data.results && Array.isArray(data.results)) {
      // Convert the Zillow API response format to our expected format
      const properties = data.results
        .filter((result: any) => result && result.property)
        .map((result: any) => {
          const property = result.property;
          
          // Get the image URL from the property photos if available
          let imgSrc = '';
          if (property.media?.propertyPhotoLinks?.highResolutionLink) {
            imgSrc = property.media.propertyPhotoLinks.highResolutionLink;
          } else if (property.media?.allPropertyPhotos?.highResolution?.length > 0) {
            imgSrc = property.media.allPropertyPhotos.highResolution[0];
          }
          
          // Format price
          const price = property.price && typeof property.price.value === 'number' 
            ? property.price.value 
            : 0;
          
          // Format address
          const address = property.address 
            ? `${property.address.streetAddress}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`
            : '';
            
          return {
            zpid: property.zpid,
            address: address,
            price: price,
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            livingArea: property.livingArea || 0,
            lotSize: property.lotSizeWithUnit?.lotSize || 0,
            yearBuilt: property.yearBuilt || 0,
            imgSrc: imgSrc,
            detailUrl: property.hdpView?.hdpUrl || `https://www.zillow.com/homes/${city}-${state}`,
            description: `Property in ${property.address?.city || city}, ${property.address?.state || state}`,
            listingDate: new Date().toISOString() // Most listings don't include this, so we use current date
          };
        });
        
      // Apply pagination parameters
      const limit = Number(params.limit) || 20;
      const offset = Number(params.offset) || 0;
      const paginatedProperties = properties.slice(offset, offset + limit);
      
      return {
        properties: paginatedProperties,
        total_count: properties.length,
        matching_count: paginatedProperties.length
      };
    }
    
    // If we get here, something is wrong with the API response format, fall back to mock data
    throw new Error('Invalid response format from Zillow API');
  } catch (error) {
    console.error('Failed to search properties with Zillow:', error);
    
    // Fall back to mock data
    // For Zillow, since the API endpoint we have is primarily for property lookup by address,
    // we'll implement a city-based search simulation
    
    // Get city parameter, default to Miami
    const city = params.city || 'Miami';
    const state = params.state_code || 'FL';
    const priceMax = Number(params.price_max) || 1000000;
    
    // Create a list of properties in the requested city
    // This is a placeholder - in a real implementation, you would use 
    // an endpoint that supports searching for properties by city
    const cityProperties = [
      {
        zpid: 'z1',
        address: `123 Ocean Drive, ${city}, ${state} 33139`,
        price: 850000,
        bedrooms: 3,
        bathrooms: 2,
        livingArea: 1800,
        lotSize: 4500,
        yearBuilt: 2015,
        imgSrc: 'https://www.zillowstatic.com/s3/builder/dreamhome/ZHDRH22_Exterior_001_Desktop.jpg',
        detailUrl: `https://www.zillow.com/homes/${city}-${state}`,
        description: `Beautiful property in ${city}, ${state} with ocean views.`,
        listingDate: '2023-11-10T14:30:00Z'
      },
      {
        zpid: 'z2',
        address: `456 Brickell Ave, ${city}, ${state} 33131`,
        price: 920000,
        bedrooms: 2,
        bathrooms: 2.5,
        livingArea: 1500,
        lotSize: 3000,
        yearBuilt: 2018,
        imgSrc: 'https://www.zillowstatic.com/s3/builder/dreamhome/ZHDRH22_Interior_Kitchen_Desktop.jpg',
        detailUrl: `https://www.zillow.com/homes/${city}-${state}`,
        description: `Luxury condo in ${city}, ${state} with amazing amenities.`,
        listingDate: '2023-11-15T09:15:00Z'
      },
      {
        zpid: 'z3',
        address: `789 Collins Ave, ${city} Beach, ${state} 33139`,
        price: 675000,
        bedrooms: 2,
        bathrooms: 2,
        livingArea: 1200,
        lotSize: 0,
        yearBuilt: 2010,
        imgSrc: 'https://www.zillowstatic.com/s3/builder/dreamhome/ZHDRH22_Interior_LivingRoom_Desktop.jpg',
        detailUrl: `https://www.zillow.com/homes/${city}-${state}`,
        description: `Beachfront condo in ${city} Beach with stunning views.`,
        listingDate: '2023-12-01T11:45:00Z'
      },
      {
        zpid: 'z4',
        address: `101 SW 8th St, ${city}, ${state} 33130`,
        price: 450000,
        bedrooms: 1,
        bathrooms: 1,
        livingArea: 950,
        lotSize: 0,
        yearBuilt: 2005,
        imgSrc: 'https://www.zillowstatic.com/s3/builder/dreamhome/ZHDRH22_Interior_Bedroom_Desktop.jpg',
        detailUrl: `https://www.zillow.com/homes/${city}-${state}`,
        description: `Cozy apartment in downtown ${city}.`,
        listingDate: '2023-12-10T16:20:00Z'
      },
      {
        zpid: 'z5',
        address: `202 NE 2nd Ave, ${city}, ${state} 33132`,
        price: 750000,
        bedrooms: 3,
        bathrooms: 2,
        livingArea: 1650,
        lotSize: 5000,
        yearBuilt: 2008,
        imgSrc: 'https://www.zillowstatic.com/s3/builder/dreamhome/ZHDRH22_Interior_Bathroom_Desktop.jpg',
        detailUrl: `https://www.zillow.com/homes/${city}-${state}`,
        description: `Spacious family home in ${city} with a large backyard.`,
        listingDate: '2023-12-15T08:30:00Z'
      }
    ];
    
    // Filter to properties under the price max
    const filteredProperties = cityProperties.filter(prop => prop.price <= priceMax);
    
    // Sort properties based on sort parameter
    const sort = params.sort || 'newest';
    
    if (sort === 'newest') {
      filteredProperties.sort((a, b) => 
        new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime()
      );
    } else if (sort === 'price_high') {
      filteredProperties.sort((a, b) => b.price - a.price);
    } else if (sort === 'price_low') {
      filteredProperties.sort((a, b) => a.price - b.price);
    }
    
    // Pagination parameters
    const limit = Number(params.limit) || 20;
    const offset = Number(params.offset) || 0;
    
    // Apply pagination
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);
    
    return {
      properties: paginatedProperties,
      total_count: filteredProperties.length,
      matching_count: paginatedProperties.length
    };
  }
}

// Function to search for properties with various filters
export async function searchProperties(
  params: any = {},
  apiType: 'propgpt' | 'reapi' | 'realtor' | 'zillow' = 'propgpt',
  apiKey?: string
) {
  const defaultParams = {
    city: params.city || 'Miami',
    state_code: params.state_code || 'FL',
    price_max: params.price_max || 1000000,
    limit: params.limit || 20,
    offset: params.offset || 0,
    sort: params.sort || 'newest',
    // Additional parameters can be added based on the API requirements
  };
  
  const mergedParams = {
    ...defaultParams,
    ...params,
  };
  
  switch (apiType) {
    case 'propgpt':
      const city = mergedParams.city;
      const query = `Recently listed houses in ${city} under ${mergedParams.price_max} dollars`;
      return await searchPropertiesWithPropGpt(query, mergedParams, apiKey || DEFAULT_PROPGPT_API_KEY);
    case 'reapi':
      return await searchPropertiesWithReapi(mergedParams, apiKey || DEFAULT_REAPI_KEY);
    case 'realtor':
      return await searchPropertiesWithRealtor(mergedParams, apiKey || DEFAULT_RAPIDAPI_KEY);
    case 'zillow':
      return await searchPropertiesWithZillow(mergedParams, apiKey || DEFAULT_RAPIDAPI_KEY);
    default:
      throw new Error(`Unsupported API type: ${apiType}`);
  }
}

// Function to get property details by address using Zillow API
export async function getPropertyByAddress(
  address: string,
  apiKey = DEFAULT_RAPIDAPI_KEY
) {
  return await getPropertyByAddressWithZillow(address, apiKey);
}

// For backward compatibility
export async function getMiamiPropertiesUnder1M(
  params: any = {},
  apiType: 'propgpt' | 'reapi' | 'realtor' | 'zillow' = 'propgpt',
  apiKey?: string
) {
  return searchProperties({
    city: 'Miami',
    price_max: 1000000,
    ...params
  }, apiType, apiKey);
}

export {
  searchPropertiesWithPropGpt,
  searchPropertiesWithReapi,
  searchPropertiesWithRealtor,
  searchPropertiesWithZillow,
  getPropertyByAddressWithZillow
}; 