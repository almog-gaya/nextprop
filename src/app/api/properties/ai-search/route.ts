import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for type safety
interface ZillowProperty {
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  homeType: string;
  yearBuilt: number;
  daysOnZillow: number;
  imageUrl: string;
}

interface ZillowResult {
  zpid?: string;
  property?: ZillowProperty;
}

interface FormattedProperty {
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
  home_size?: string;
  year_built?: string;
  property_type?: string;
  days_on_zillow?: string;
  image_url?: string;
}

export async function GET(request: NextRequest) {
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt');
  const limit = parseInt(searchParams.get('limit') || '8', 10); // Default to 8 results (5-10 range)
  const apiType = searchParams.get('api') || 'zillow'; // Default to Zillow API
  
  console.log(`AI search received prompt: ${prompt}, using ${apiType} API`);
  
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt parameter' }, { status: 400 });
  }

  try {
    // Extract potential city/location information from the prompt using regex
    const cityStateMatch = prompt.match(/in\s+([A-Za-z\s]+),?\s*([A-Za-z]{2})?|in\s+([A-Za-z\s]+)/i);
    let city = 'Miami';
    if (cityStateMatch) {
      city = cityStateMatch[1] || cityStateMatch[3] || 'Miami';
      city = city.trim();
    }
    
    // Extract beds, baths, price from prompt for better mock data
    const bedsMatch = prompt.match(/(\d+)\s*beds?/i);
    const bathsMatch = prompt.match(/(\d+)\s*baths?/i);
    const priceMatch = prompt.match(/under\s*\$?(\d[\d,.]*)\s*([kmb])?/i) || 
                        prompt.match(/\$?(\d[\d,.]*)\s*([kmb])?/i);
    
    const beds = bedsMatch ? parseInt(bedsMatch[1]) : Math.floor(Math.random() * 4) + 1;
    const baths = bathsMatch ? parseInt(bathsMatch[1]) : Math.floor(Math.random() * 3) + 1;
    
    // Parse price with support for K, M, B suffixes
    let price = 3000000; // Default to $3M for Miami as requested
    if (priceMatch) {
      let priceStr = priceMatch[1].replace(/,/g, '');
      const suffix = priceMatch[2]?.toLowerCase();
      
      // Convert price based on suffix (k, m, b)
      let multiplier = 1;
      if (suffix === 'k') multiplier = 1000;
      else if (suffix === 'm') multiplier = 1000000;
      else if (suffix === 'b') multiplier = 1000000000;
      
      price = parseFloat(priceStr) * multiplier;
    }
    
    // Ensure the price parameter is included in the query if it was detected
    const queryParams = new URLSearchParams();
    queryParams.append('location', `${city}, FL`);
    queryParams.append('price_max', price.toString());
    
    if (bedsMatch) queryParams.append('beds_min', beds.toString());
    if (bathsMatch) queryParams.append('baths_min', baths.toString());
    
    // Call Zillow API - using the most reliable endpoint based on prompt
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const zillowHost = process.env.ZILLOW_RAPIDAPI_HOST || 'zillow-working-api.p.rapidapi.com';
    
    try {
      console.log(`Attempting to call Zillow API with query: ${queryParams.toString()}`);
      
      // Use property search endpoint for more reliable results with images
      const response = await fetch(
        `https://${zillowHost}/property/search?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey || '',
            'X-RapidAPI-Host': zillowHost,
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        }
      );
      
      console.log(`Zillow API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Zillow API response data received');
        
        // Process and format the results
        if (data && data.results && Array.isArray(data.results)) {
          const formattedProperties: FormattedProperty[] = data.results
            .filter((result: any): boolean => 
              result !== null && typeof result === 'object' && (result.zpid || result.property)
            )
            .map((result: any): FormattedProperty => {
              // Handle different response formats
              const property = result.property || result;
              const zpid = result.zpid || property.zpid;
              
              // Get the image URL - different properties might have images in different fields
              let imageUrl = property.imageUrl;
              if (!imageUrl && property.images && property.images.length > 0) {
                imageUrl = property.images[0];
              }
              
              // Fallback Miami property images if no image is available
              const fallbackImages = [
                'https://images.unsplash.com/photo-1549415697-8edfc62b131b?w=800',
                'https://images.unsplash.com/photo-1533858209934-89facda5bbe8?w=800',
                'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
                'https://images.unsplash.com/photo-1512699355324-f07e3106dae5?w=800'
              ];
              
              if (!imageUrl) {
                imageUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
              }
              
              // Get price and ensure it's formatted correctly
              let formattedPrice = '$0';
              if (typeof property.price === 'number') {
                formattedPrice = `$${property.price.toLocaleString()}`;
              } else if (typeof property.price === 'string') {
                formattedPrice = property.price.startsWith('$') ? property.price : `$${property.price}`;
              }
              
              // Build the formatted property object
              return {
                property_id: zpid || String(Math.random()),
                listing_id: zpid || String(Math.random()),
                price: formattedPrice,
                beds: property.bedrooms || beds,
                baths: property.bathrooms || baths,
                address: {
                  line: property.address?.streetAddress || property.streetAddress || 
                        `${property.address?.streetNumber || ''} ${property.address?.street || ''}`.trim() || 
                        '',
                  city: property.address?.city || property.city || city,
                  state_code: (property.address?.state || property.state || 'FL').substring(0, 2),
                  postal_code: property.address?.zipcode || property.zipcode || ''
                },
                home_size: property.livingArea ? `${property.livingArea.toLocaleString()} sqft` : undefined,
                year_built: property.yearBuilt ? String(property.yearBuilt) : undefined,
                property_type: property.homeType || property.propertyType,
                days_on_zillow: property.daysOnZillow ? String(property.daysOnZillow) : '0',
                image_url: imageUrl
              };
            });
            
          console.log(`Returning ${formattedProperties.length} properties (limiting to ${limit})`);
          return NextResponse.json(formattedProperties.slice(0, limit));
        }
      }
      
      // If we reach here, either the API call failed or returned unexpected data
      console.log('Falling back to mock data for city search');
      throw new Error('Zillow API call failed or returned invalid data');
    } catch (apiError) {
      console.error('Zillow API error:', apiError);
      
      // Fall back to generating realistic mock properties
      console.log(`Generating mock properties for city: ${city}`);
      
      // Create mock properties with well-formatted addresses
      const mockProperties: FormattedProperty[] = Array.from({ length: limit }).map((_, index) => {
        const streetNames = ['Main St', 'Oak Ave', 'Maple Rd', 'Palm Blvd', 'Beach Dr', 'Ocean Ave', 'Sunset Blvd'];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        const streetNumber = Math.floor(Math.random() * 9000) + 1000;
        
        const randomPrice = price * (0.8 + Math.random() * 0.4); // Vary price by ±20%
        const formattedPrice = `$${Math.floor(randomPrice).toLocaleString()}`;
        
        const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Apartment'];
        const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
        
        const homeSize = Math.floor((beds * 400 + baths * 200) * (0.8 + Math.random() * 0.4));
        const yearBuilt = Math.floor(1960 + Math.random() * 63); // 1960 to 2023
        const daysOnZillow = Math.floor(Math.random() * 60);
        
        // Miami neighborhoods for better addresses
        const neighborhoods = ['Downtown', 'Brickell', 'South Beach', 'Coconut Grove', 'Wynwood', 'Little Havana'];
        const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
        
        const formattedAddress = `${streetNumber} ${streetName}`;
        
        // Miami property images as fallbacks
        const propertyImages = [
          'https://images.unsplash.com/photo-1549415697-8edfc62b131b?w=800',
          'https://images.unsplash.com/photo-1533858209934-89facda5bbe8?w=800',
          'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
          'https://images.unsplash.com/photo-1512699355324-f07e3106dae5?w=800',
          'https://images.unsplash.com/photo-1545168598-c4c6c1719dcd?w=800'
        ];
        
        return {
          property_id: `mock-${index}`,
          listing_id: `listing-${index}`,
          price: formattedPrice,
          beds: beds,
          baths: baths,
          address: {
            line: formattedAddress,
            city: city,
            state_code: 'FL',
            postal_code: `33${Math.floor(Math.random() * 199) + 100}`
          },
          home_size: `${homeSize.toLocaleString()} sqft`,
          year_built: String(yearBuilt),
          property_type: propertyType,
          days_on_zillow: String(daysOnZillow),
          image_url: propertyImages[Math.floor(Math.random() * propertyImages.length)]
        };
      });
      
      return NextResponse.json(mockProperties);
    }
  } catch (error: any) {
    console.error('Error in AI search:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 