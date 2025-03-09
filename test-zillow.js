// Simple script to test the Zillow API directly
// Using axios which works with CommonJS
const axios = require('axios');

// API keys - same as in our application
const DEFAULT_RAPIDAPI_KEY = '566bf65200msh29c052dcdd20b4cp1b5559jsne5bb52a3b1a0';
const DEFAULT_ZILLOW_RAPIDAPI_HOST = 'zillow-working-api.p.rapidapi.com';

async function testZillowAPI() {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY || DEFAULT_RAPIDAPI_KEY;
    const zillowHost = process.env.ZILLOW_RAPIDAPI_HOST || DEFAULT_ZILLOW_RAPIDAPI_HOST;
    
    // Use common search locations - testing with a specific city
    const city = 'Naples';
    
    // Generate realistic search parameters
    const maxPrice = 700000; // Fixed max price that's more likely to return results
    
    // Format the AI prompt - keep it simple to increase chance of getting results
    const aiPrompt = `Houses for sale in ${city} Florida under $${maxPrice.toLocaleString()}`;
    
    console.log(`Calling Zillow API with prompt: ${aiPrompt}`);
    
    // Make the API call to Zillow using axios instead of fetch
    const response = await axios({
      method: 'GET',
      url: `https://${zillowHost}/search/byaiprompt`,
      params: {
        ai_search_prompt: aiPrompt,
        page: 1,
        sortOrder: 'Homes_for_you'
      },
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': zillowHost,
      },
      timeout: 15000 
    });
    
    console.log('API Response status:', response.status);
    
    const data = response.data;
    
    // Check if we got property results - using the correct searchResults field
    if (data && data.searchResults && Array.isArray(data.searchResults)) {
      console.log(`Found ${data.searchResults.length} properties`);
      
      // Print first property details
      if (data.searchResults.length > 0) {
        const firstProperty = data.searchResults[0].property;
        console.log('\nFirst property details:');
        console.log('Address:', firstProperty.address);
        console.log('Price:', firstProperty.price?.value);
        console.log('Beds:', firstProperty.bedrooms);
        console.log('Baths:', firstProperty.bathrooms);
        console.log('Type:', firstProperty.propertyType);
        console.log('Image:', firstProperty.media?.propertyPhotoLinks?.highResolutionLink || 'No image');
        
        // Print a sample of how to construct a complete property description
        console.log('\nSample property description:');
        const addressStr = `${firstProperty.address.streetAddress}, ${firstProperty.address.city}, ${firstProperty.address.state} ${firstProperty.address.zipcode}`;
        const priceStr = firstProperty.price?.value ? `$${firstProperty.price.value.toLocaleString()}` : 'Price not available';
        const bedsStr = firstProperty.bedrooms ? `${firstProperty.bedrooms} bed` : '';
        const bathsStr = firstProperty.bathrooms ? `${firstProperty.bathrooms} bath` : '';
        const sqftStr = firstProperty.livingArea ? `${firstProperty.livingArea.toLocaleString()} sqft` : '';
        
        console.log(`${addressStr}\n${priceStr} - ${bedsStr} / ${bathsStr} - ${sqftStr}\nProperty Type: ${firstProperty.propertyType || 'Not specified'}`);
      } else {
        console.log('No properties found in the results');
      }
    } else {
      console.log('No valid searchResults returned from API');
      console.log('Response structure:', Object.keys(data).join(', '));
      console.log('First level data sample:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('Error testing Zillow API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testZillowAPI(); 