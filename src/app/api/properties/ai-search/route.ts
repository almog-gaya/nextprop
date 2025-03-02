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
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  console.log(`AI search received prompt: ${prompt}`);
  
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
    const priceMatch = prompt.match(/price\s*(\d[\d,]*)/i) || prompt.match(/(\d[\d,]*k?)/i);
    
    const beds = bedsMatch ? parseInt(bedsMatch[1]) : Math.floor(Math.random() * 4) + 1;
    const baths = bathsMatch ? parseInt(bathsMatch[1]) : Math.floor(Math.random() * 3) + 1;
    
    let price = 500000;
    if (priceMatch) {
      let priceStr = priceMatch[1].replace(/,/g, '');
      if (priceStr.toLowerCase().endsWith('k')) {
        priceStr = priceStr.slice(0, -1) + '000';
      }
      price = parseInt(priceStr);
    }
    
    // Call Zillow API for AI search
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const zillowHost = process.env.ZILLOW_RAPIDAPI_HOST || 'zillow-working-api.p.rapidapi.com';
    
    try {
      console.log(`Attempting to call Zillow AI search API with prompt: ${prompt}`);
      
      const response = await fetch(
        `https://${zillowHost}/search/by_AI_prompt`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey || '',
            'X-RapidAPI-Host': zillowHost,
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        }
      );
      
      console.log(`Zillow AI search API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Zillow API response:', data);
        
        // Process and format the results
        if (data && data.results && Array.isArray(data.results)) {
          const formattedProperties: FormattedProperty[] = data.results
            .filter((result: ZillowResult): result is Required<ZillowResult> => 
              result !== null && typeof result === 'object' && 'property' in result
            )
            .map((result: Required<ZillowResult>): FormattedProperty => {
              const property = result.property;
              return {
                property_id: property.zpid || String(Math.random()),
                listing_id: property.zpid || String(Math.random()),
                price: `$${property.price.toLocaleString()}`,
                beds: property.bedrooms,
                baths: property.bathrooms,
                address: {
                  line: property.address.streetAddress,
                  city: property.address.city,
                  state_code: property.address.state,
                  postal_code: property.address.zipcode
                },
                home_size: `${property.livingArea.toLocaleString()} sqft`,
                year_built: String(property.yearBuilt),
                property_type: property.homeType,
                days_on_zillow: String(property.daysOnZillow),
                image_url: property.imageUrl
              };
            });
            
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
      
      // Create mock properties based on the extracted parameters
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
        
        return {
          property_id: `mock-${index}`,
          listing_id: `listing-${index}`,
          price: formattedPrice,
          beds: beds,
          baths: baths,
          address: {
            line: `${streetNumber} ${streetName}`,
            city: city,
            state_code: city === 'Miami' ? 'FL' : 'CA',
            postal_code: `${Math.floor(Math.random() * 90000) + 10000}`
          },
          home_size: `${homeSize.toLocaleString()} sqft`,
          year_built: String(yearBuilt),
          property_type: propertyType,
          days_on_zillow: String(daysOnZillow)
        };
      });
      
      return NextResponse.json(mockProperties);
    }
  } catch (error: any) {
    console.error('Error in AI search:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 