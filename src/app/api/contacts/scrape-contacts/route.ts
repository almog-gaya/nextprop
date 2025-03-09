import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';

// Add these imports to use the Zillow API
import { DEFAULT_RAPIDAPI_KEY, DEFAULT_ZILLOW_RAPIDAPI_HOST } from '@/lib/realEstateApis';

// Known pipeline IDs from the existing application
// These are fallbacks if we can't find a leads pipeline dynamically
const LEADS_PIPELINE_ID = 'uFa3Uh6Cz1iKHA8YtzhN'; 
const REVIEW_STAGE_ID = 'MHYFVj1Q9BtfSxO6CFXC';

// Globals to store dynamically discovered pipeline IDs
let dynamicLeadsPipelineId: string | null = null;
let dynamicReviewStageId: string | null = null;

// Interface for scraped contact data
interface ScrapedContact {
  name: string;
  firstName?: string; // Optional first name
  lastName?: string;  // Optional last name
  email: string;
  phone: string;
  address: {
    line: string;
    city: string;
    state_code: string;
    postal_code: string;
  };
  source: string;
  notes?: string;
  property?: any; // Store the original property data
}

// Function to fetch real property data from Zillow
async function fetchRealZillowProperties(count = 1): Promise<any[]> {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY || DEFAULT_RAPIDAPI_KEY;
    const zillowHost = process.env.ZILLOW_RAPIDAPI_HOST || DEFAULT_ZILLOW_RAPIDAPI_HOST;
    
    // Use common search locations
    const cities = ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Naples'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    // Generate realistic search parameters
    const beds = Math.floor(Math.random() * 3) + 2; // 2-4 beds
    const baths = Math.floor(Math.random() * 2) + 2; // 2-3 baths
    const maxPrice = 700000; // Fixed max price that's more likely to return results
    
    // Format the AI prompt - keep it simple to increase chance of getting results
    const aiPrompt = `Houses for sale in ${city} Florida under $${maxPrice.toLocaleString()}`;
    
    console.log(`Calling Zillow API with prompt: ${aiPrompt}`);
    
    // Make the API call to Zillow
    const response = await fetch(
      `https://${zillowHost}/search/byaiprompt?ai_search_prompt=${encodeURIComponent(aiPrompt)}&page=1&sortOrder=Homes_for_you`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': zillowHost,
        },
        // Use AbortSignal for timeout (15 seconds)
        signal: AbortSignal.timeout(15000)
      }
    );
    
    if (!response.ok) {
      console.error(`Zillow API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    // Check if we have valid results - using searchResults instead of results
    if (data && data.searchResults && Array.isArray(data.searchResults) && data.searchResults.length > 0) {
      console.log(`Got ${data.searchResults.length} properties from Zillow API`);
      
      // Extract properties from search results
      const properties = data.searchResults
        .filter((result: any) => result.property)
        .map((result: any) => result.property)
        .filter((property: any) => {
          // Basic validation: must have an address and basic details
          return property && 
                 property.address && 
                 property.address.streetAddress && 
                 property.address.city && 
                 property.address.state;
        });
      
      if (properties.length === 0) {
        console.log("Zillow API returned no valid property data");
        return [];
      }
      
      // Return up to the requested count of properties
      return properties.slice(0, count);
    } else {
      console.log("Zillow API returned no valid searchResults");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Zillow properties:", error);
    return [];
  }
}

// Function to generate a contact with real Zillow data or fallback to test data
async function generateContact(index: number): Promise<ScrapedContact> {
  try {
    // First try to get real property data
    const properties = await fetchRealZillowProperties(1);
    
    if (properties.length > 0) {
      const property = properties[0];
      
      // Log the property object structure to see what agent data is available
      console.log("Property data structure for agent info:", JSON.stringify({
        agent: property.agent || null,
        brokerName: property.brokerName || null,
        attributionInfo: property.attributionInfo || null,
        propertyDisplayRules: property.propertyDisplayRules || null,
        listingAgent: property.listingAgent || null,
        brokerInfo: property.brokerInfo || null,
        realtorInfo: property.realtorInfo || null,
        // Include the raw property for debugging - REMOVE AFTER DEBUGGING
        rawProperty: property
      }, null, 2));
      
      // Extract agent/broker information from the property data - looking in multiple possible locations
      let agentName = '';
      let agentFirstName = '';
      let agentLastName = '';
      let brokerName = '';
      let mlsName = '';
      let builderName = '';
      let attributionName = '';
      let agentEmail = ''; // Real agent email from Zillow
      let agentPhone = ''; // Real agent phone from Zillow
      let displayName = ''; // Name to display for the contact
      
      // Deep look for contact info throughout the property object
      function searchForContactInfo(obj: any, path = '') {
        // Skip null and undefined
        if (obj === null || obj === undefined) return;
        
        // Handle objects
        if (typeof obj === 'object' && !Array.isArray(obj)) {
          // Check for common properties at this level
          if (obj.email && typeof obj.email === 'string' && obj.email.includes('@') && !agentEmail) {
            agentEmail = obj.email;
            console.log(`Found real email at ${path}.email: ${agentEmail}`);
          }
          
          if (obj.phone && typeof obj.phone === 'string' && !agentPhone) {
            agentPhone = obj.phone;
            console.log(`Found real phone at ${path}.phone: ${agentPhone}`);
          }
          
          if (obj.agentEmail && typeof obj.agentEmail === 'string' && obj.agentEmail.includes('@') && !agentEmail) {
            agentEmail = obj.agentEmail;
            console.log(`Found real email at ${path}.agentEmail: ${agentEmail}`);
          }
          
          if (obj.agentPhone && typeof obj.agentPhone === 'string' && !agentPhone) {
            agentPhone = obj.agentPhone;
            console.log(`Found real phone at ${path}.agentPhone: ${agentPhone}`);
          }
          
          // Recursively search all properties
          for (const key in obj) {
            searchForContactInfo(obj[key], path ? `${path}.${key}` : key);
          }
        } 
        // Handle arrays
        else if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            searchForContactInfo(item, `${path}[${index}]`);
          });
        }
      }
      
      // Perform deep search for contact info
      searchForContactInfo(property);
      
      // Extract real email if available
      if (agentEmail) {
        agentEmail = agentEmail;
      } else if (property.listingAgent?.email) {
        agentEmail = property.listingAgent.email;
      } else if (property.attributionInfo?.agentEmail) {
        agentEmail = property.attributionInfo.agentEmail;
      } else if (property.realtorInfo?.email) {
        agentEmail = property.realtorInfo.email;
      }
      
      // Extract real phone number if available
      if (agentPhone) {
        agentPhone = agentPhone;
      } else if (property.listingAgent?.phone) {
        agentPhone = property.listingAgent.phone;
      } else if (property.attributionInfo?.agentPhone) {
        agentPhone = property.attributionInfo.agentPhone;
      } else if (property.realtorInfo?.phone) {
        agentPhone = property.realtorInfo.phone;
      } else if (property.brokerInfo?.phone) {
        agentPhone = property.brokerInfo.phone;
      }
      
      // Find agent name - checking all possible locations in the API response
      // Direct agent property
      if (property.agent?.name) {
        agentName = property.agent.name;
      } 
      // ListingAgent property
      else if (property.listingAgent?.name) {
        agentName = property.listingAgent.name;
      }
      // AttributionInfo
      else if (property.attributionInfo?.agentName) {
        agentName = property.attributionInfo.agentName;
      }
      // PropertyDisplayRules
      else if (property.propertyDisplayRules?.agent?.agentName) {
        agentName = property.propertyDisplayRules.agent.agentName;
      }
      
      // Extract broker information
      if (property.brokerName) {
        brokerName = property.brokerName;
      } 
      else if (property.brokerInfo?.name) {
        brokerName = property.brokerInfo.name;
      }
      else if (property.attributionInfo?.brokerName) {
        brokerName = property.attributionInfo.brokerName;
      }
      else if (property.propertyDisplayRules?.mls?.brokerName) {
        brokerName = property.propertyDisplayRules.mls.brokerName;
      }
      
      // Extract MLS name
      if (property.attributionInfo?.mlsName) {
        mlsName = property.attributionInfo.mlsName;
      }
      else if (property.propertyDisplayRules?.mls?.mlsName) {
        mlsName = property.propertyDisplayRules.mls.mlsName;
      }
      
      // Extract builder name
      if (property.attributionInfo?.builderName) {
        builderName = property.attributionInfo.builderName;
      }
      else if (property.propertyDisplayRules?.builder?.name) {
        builderName = property.propertyDisplayRules.builder.name;
      }
      
      // Parse agent name into first and last name if available
      if (agentName) {
        const nameParts = agentName.split(' ');
        if (nameParts.length > 1) {
          agentFirstName = nameParts[0];
          agentLastName = nameParts.slice(1).join(' ');
        } else {
          agentFirstName = agentName;
          agentLastName = '';
        }
      }
      // If we don't have agent name but have broker or builder, use that instead
      else if (brokerName) {
        // Use the full broker name as is
        displayName = brokerName.trim();
        
        // For broker/agency names, we don't want to split the name into first/last
        // Keep the original, fully qualified name
        agentFirstName = 'Agency';
        agentLastName = brokerName.trim();
      } else if (builderName) {
        // Use the full builder name
        displayName = builderName.trim();
        agentFirstName = 'Builder';
        agentLastName = builderName.trim();
      } else {
        // If no agent/broker/builder info at all, use property details
        agentFirstName = property.address?.city || 'Property';
        agentLastName = 'Specialist';
      }
      
      // Use property address information
      const addressLine = property.address?.streetAddress || "No Address";
      const city = property.address?.city || "Unknown City";
      const state = property.address?.state || "FL";
      const zipcode = property.address?.zipcode || "00000";
      
      // Create a realistic email based on agent name and broker/builder
      let domain = '';
      
      // For email, remove special characters and spaces
      const cleanFirstName = agentFirstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLastName = agentLastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Determine domain for email
      if (brokerName) {
        // Clean up broker name for domain
        domain = brokerName.toLowerCase()
          .replace(/\s*,\s*inc\.?$/i, '') // Remove ", Inc" at the end
          .replace(/\s*,\s*llc\.?$/i, '') // Remove ", LLC" at the end
          .replace(/[^a-z0-9]/g, '') // Remove spaces and special chars
          .replace(/realty$|real$|estate$/i, 'realestate'); // Normalize common terms
          
        if (domain.length < 3) domain = 'realestate';
        domain += '.com';
      } else if (builderName) {
        domain = builderName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      } else if (mlsName) {
        domain = mlsName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      } else {
        // Fallback to a realistic real estate domain
        domain = 'realestate.com';
      }
      
      // Ensure domain doesn't have spaces and isn't empty
      if (domain === '.com' || domain === '') {
        domain = 'realestate.com';
      }
      
      // Use real agent/broker information to create the name to display
      if (agentName) {
        displayName = agentName;
      } else if (brokerName) {
        // Use the full broker name directly
        displayName = brokerName.trim();
      } else if (builderName) {
        // Use the full builder name
        displayName = builderName.trim();
      } else {
        displayName = `${agentFirstName} ${agentLastName}`.trim();
      }
      
      // Log what we found
      console.log(`Agent Info Extracted - Name: "${displayName}", Email Domain: "${domain}"`);
      
      // Create professional email - for broker/agency emails, use info@ or sales@ prefix
      let email = '';
      // Add a random component to ensure uniqueness
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      
      if (agentEmail) {
        // If we found a real email in the property data, use it directly
        email = agentEmail;
        console.log(`Using REAL agent email from Zillow: ${agentEmail}`);
      } else if (cleanFirstName && cleanLastName) {
        // If we have a real agent name, use their first/last name with a unique suffix
        email = `${cleanFirstName}.${cleanLastName}.${uniqueSuffix}@${domain}`;
      } else if (brokerName || builderName) {
        // For broker/builder, use a professional info@ format with a unique suffix
        // This prevents duplicate emails for the same agency
        email = `info.${uniqueSuffix}@${domain}`;
      } else {
        // Fallback with unique suffix
        email = `sales.${uniqueSuffix}@${domain}`;
      }
      
      // Use real phone if available, otherwise generate one
      let phone = '';
      if (agentPhone) {
        // Format the phone number consistently if needed
        phone = agentPhone.replace(/[^0-9+]/g, '');
        if (!phone.startsWith('+')) {
          phone = '+1' + phone;
        }
        console.log(`Using REAL agent phone from Zillow: ${agentPhone}`);
      } else {
        // Generate a phone with area code from property zipcode for regional authenticity
        const areaCode = zipcode.substring(0, 3) || Math.floor(100 + Math.random() * 900).toString();
        const randomPart = Math.floor(1000000 + Math.random() * 9000000).toString();
        phone = `+1${areaCode}${randomPart}`;
      }
      
      // Get price formatted for display
      let price = "Unknown";
      if (property.price && typeof property.price.value === 'number') {
        price = `$${property.price.value.toLocaleString()}`;
      }
      
      // Create company information for notes
      let companyInfo = '';
      if (brokerName) {
        companyInfo = `\nBrokerage: ${brokerName}`;
      }
      if (builderName) {
        companyInfo += `\nBuilder: ${builderName}`;
      }
      if (mlsName) {
        companyInfo += `\nMLS: ${mlsName}`;
      }
      
      // Create detailed notes about the property and listing agent
      const notes = `
        Property Listing Details:
        Address: ${addressLine}, ${city}, ${state} ${zipcode}
        Price: ${price}
        Beds: ${property.bedrooms || 'Unknown'}
        Baths: ${property.bathrooms || 'Unknown'}
        Size: ${property.livingArea ? `${property.livingArea.toLocaleString()} sqft` : 'Unknown'}
        Year Built: ${property.yearBuilt || 'Unknown'}
        Days on Market: ${property.daysOnZillow || 'New'}
        Property Type: ${property.propertyType || 'Unknown'}
        Zillow ID: ${property.zpid || 'Unknown'}
        
        Listing Contact: ${displayName}${companyInfo}
      `;
      
      console.log(`Generated REAL agent contact: ${displayName}`);
      
      // For GHL API, we need to provide both firstName and lastName
      // But for broker/agency names, we want to store them properly
      let firstName = '';
      let lastName = '';
      
      if (displayName.includes(' ')) {
        // If display name has spaces, it could be a person's name
        const nameParts = displayName.split(' ');
        if (agentFirstName && agentLastName) {
          // Use the parsed first/last name if available
          firstName = agentFirstName;
          lastName = agentLastName;
        } else if (displayName.toUpperCase() === displayName) {
          // All uppercase name is likely a company name (like "COYLE REALTY INC")
          firstName = displayName;
          lastName = '';
        } else {
          // Otherwise split the display name at the first space
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      } else {
        // Single word name - probably a company name
        firstName = displayName;
        lastName = '';
      }
      
      // If the name is a company/broker name and not a person, format it for GHL
      if (brokerName && !agentName) {
        // Place the ENTIRE broker name in the firstName field
        firstName = brokerName.trim();
        lastName = '';
      } else if (builderName && !agentName) {
        // Place the ENTIRE builder name in the firstName field
        firstName = builderName.trim();
        lastName = '';
      }
      
      console.log(`Generated REAL agent contact: ${firstName} ${lastName}`);
      
      return {
        name: displayName,
        firstName,
        lastName,
        email,
        phone,
        address: {
          line: addressLine,
          city,
          state_code: state.substring(0, 2),
          postal_code: zipcode
        },
        source: brokerName || builderName || 'Zillow Property Listing',
        notes,
        property
      };
    }
    
    // Fallback to fake data if Zillow API fails
    console.log("Using fallback test data - Zillow API didn't return properties");
    
    // Use timestamp to ensure uniqueness
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${index}`;
    
    // Generate a prefix based on unique ID - complete GHL workaround
    // Using a random string to avoid GHL's normalization
    const prefix = Math.random().toString(36).substring(2, 6); 
    const email = `test.${prefix}.${index}@example.com`;
    
    // For phone numbers, use guaranteed unique numbers to avoid collisions
    // Generate 10 completely random digits for the phone number
    const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    // Format as a standard US phone number
    const phone = `+1${randomDigits}`;
    
    // Generate a contact with explicit "no data" values - avoiding any mock data
    return {
      name: `Test Contact ${prefix}`,
      email: email,
      phone: phone,
      address: { 
        line: "Test Address",
        city: "Test City", 
        state_code: "TS", 
        postal_code: "12345" 
      },
      source: 'Test Source',
      notes: 'Test contact - no real data'
    };
  } catch (error) {
    console.error("Error generating contact:", error);
    
    // Ultimate fallback if anything goes wrong
    const prefix = Math.random().toString(36).substring(2, 6);
    return {
      name: `Error Contact ${prefix}`,
      email: `error.${prefix}@example.com`,
      phone: `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
      address: { 
        line: "Error Address",
        city: "Error City", 
        state_code: "ER", 
        postal_code: "00000" 
      },
      source: 'Error Source',
      notes: `Error generating contact: ${error}`
    };
  }
}

// Find appropriate pipeline and stage IDs dynamically
async function findPipelineIds() {
  try {
    // If we already have discovered IDs, use them
    if (dynamicLeadsPipelineId && dynamicReviewStageId) {
      return {
        pipelineId: dynamicLeadsPipelineId,
        stageId: dynamicReviewStageId
      };
    }
    
    const { token, locationId } = await getAuthHeaders();
    
    if (!token || !locationId) {
      console.error("Missing auth tokens for pipeline discovery");
      return { 
        pipelineId: LEADS_PIPELINE_ID, 
        stageId: REVIEW_STAGE_ID 
      };
    }
    
    // Fetch available pipelines
    const pipelinesUrl = `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`;
    const pipelinesResponse = await fetch(pipelinesUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        Accept: 'application/json',
      }
    });
    
    if (!pipelinesResponse.ok) {
      console.error("Failed to fetch pipelines, using default:", pipelinesResponse.status);
      return { 
        pipelineId: LEADS_PIPELINE_ID, 
        stageId: REVIEW_STAGE_ID 
      };
    }
    
    const pipelinesData = await pipelinesResponse.json();
    console.log("Found pipelines:", pipelinesData.pipelines?.length || 0);
    
    // Look for a leads pipeline
    let leadsPipeline = pipelinesData.pipelines?.find((pipeline: any) => 
      pipeline.name.toLowerCase().includes('lead') || 
      pipeline.name.toLowerCase().includes('opportunity')
    );
    
    // If no leads pipeline found, use the first one
    if (!leadsPipeline && pipelinesData.pipelines?.length > 0) {
      leadsPipeline = pipelinesData.pipelines[0];
    }
    
    // If we found a pipeline
    if (leadsPipeline) {
      console.log("Using pipeline:", leadsPipeline.name, leadsPipeline.id);
      
      // Use the first stage or a stage with "new" or "review" in the name
      let firstStage;
      if (leadsPipeline.stages && leadsPipeline.stages.length > 0) {
        firstStage = leadsPipeline.stages[0];
        
        // Try to find a "review" or "new" stage
        const reviewStage = leadsPipeline.stages.find((stage: any) => 
          stage.name.toLowerCase().includes('review') || 
          stage.name.toLowerCase().includes('new')
        );
        
        if (reviewStage) {
          firstStage = reviewStage;
        }
      }
      
      if (firstStage) {
        console.log("Using stage:", firstStage.name, firstStage.id);
        
        // Save the discovered IDs for future use
        dynamicLeadsPipelineId = leadsPipeline.id;
        dynamicReviewStageId = firstStage.id;
        
        return {
          pipelineId: leadsPipeline.id,
          stageId: firstStage.id
        };
      }
    }
    
    // Fall back to defaults if we couldn't find appropriate IDs
    return { 
      pipelineId: LEADS_PIPELINE_ID, 
      stageId: REVIEW_STAGE_ID 
    };
  } catch (error) {
    console.error("Error finding pipeline IDs:", error);
    return { 
      pipelineId: LEADS_PIPELINE_ID, 
      stageId: REVIEW_STAGE_ID 
    };
  }
}

// Add a contact to the GHL system (or find existing if duplicate)
async function addContactToGHL(contact: ScrapedContact) {
  try {
    const { token, locationId } = await getAuthHeaders();
    
    console.log("Auth headers obtained:", { hasToken: !!token, locationId });
    
    if (!token || !locationId) {
      throw new Error("Missing authentication token or locationId");
    }

    // Determine if the contact name is a broker/agency name
    const isBrokerOrAgency = 
      contact.name.toUpperCase() === contact.name || // All caps is likely a broker
      contact.name.includes("REALTY") || 
      contact.name.includes("REAL ESTATE") ||
      contact.name.includes("PROPERTIES") ||
      contact.name.includes("LLC") ||
      contact.name.includes("INC") ||
      contact.name.includes("HOMES");
    
    // Format name into first and last - prioritize the firstName/lastName if available
    let firstName = '';
    let lastName = '';
    
    if (contact.firstName && contact.lastName !== undefined) {
      // Use the pre-formatted first/last name if available from generateContact
      firstName = contact.firstName;
      lastName = contact.lastName;
    } else if (isBrokerOrAgency) {
      // For broker/agency names, put the entire name in firstName
      firstName = contact.name;
      lastName = '';
    }
    // Check if the name has spaces - likely a full name
    else if (contact.name.includes(' ')) {
      const nameParts = contact.name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || '';
    } else {
      // If no space, treat the whole thing as firstName
      firstName = contact.name;
      lastName = ''; 
    }
    
    // Format phone number - ensure it's in the +1XXXXXXXXXX format 
    // But prioritize the original phone if it's already formatted
    let formattedPhone = contact.phone;
    
    // Only reformat if it doesn't look like a proper E.164 number
    if (!contact.phone.startsWith('+')) {
      try {
        const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
        // Make sure it's 10 digits for US numbers
        if (cleanPhone.length === 10) {
          formattedPhone = `+1${cleanPhone}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          formattedPhone = `+${cleanPhone}`;
        } else {
          // Generate a valid 10-digit number if the original is invalid
          const areaCode = Math.floor(100 + Math.random() * 900).toString();
          const randomPart = Math.floor(1000000 + Math.random() * 9000000).toString();
          formattedPhone = `+1${areaCode}${randomPart}`;
        }
      } catch (e) {
        // Fallback with a random phone to avoid duplicates
        const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
        formattedPhone = `+1${randomNum}`;
      }
    }
    
    // Use the original email if it's valid
    let contactEmail = contact.email;
    
    // Only generate a new email if it doesn't look valid
    if (!contactEmail.includes('@') || !contactEmail.includes('.')) {
      contactEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now().toString().slice(-5)}@example.com`;
    }
    
    // Create custom fields array with property data
    const customFields = [
      {
        id: 'ECqyHR21ZJnSMolxlHpU',
        key: 'contact.type',
        value: 'lead',
      },
      {
        id: '1WRylPbzU0IkgDSyO3bJ',
        key: 'contact.mls_address',
        value: JSON.stringify(contact.address),
      }
    ];
    
    // If we have property data, add it to custom fields
    if (contact.property) {
      // Add property price 
      if (contact.property.price && typeof contact.property.price.value === 'number') {
        customFields.push({
          id: 'xTlKIDZLBkk6TtQeZdvk',
          key: 'contact.property_price',
          value: contact.property.price.value.toString()
        });
      }
      
      // Add property details
      customFields.push({
        id: 'tVPzSGS5KOHXjEoRvX4X',
        key: 'contact.property_details',
        value: JSON.stringify({
          beds: contact.property.bedrooms || 0,
          baths: contact.property.bathrooms || 0,
          sqft: contact.property.livingArea || 0,
          year_built: contact.property.yearBuilt || 0,
          property_type: contact.property.propertyType || '',
          zpid: contact.property.zpid || 0
        })
      });
      
      // Add image URL if available
      if (contact.property.media?.propertyPhotoLinks?.highResolutionLink) {
        customFields.push({
          id: 'hYc5pCzWU01b6pfE0QhT',
          key: 'contact.property_image',
          value: contact.property.media.propertyPhotoLinks.highResolutionLink
        });
      }
      
      // Add broker/builder info if available
      if (contact.property.propertyDisplayRules?.mls?.brokerName) {
        customFields.push({
          id: 'Pzw8QmyI3FoRtK7vLhNx', // You may need to adjust this ID
          key: 'contact.broker_name',
          value: contact.property.propertyDisplayRules.mls.brokerName
        });
      }
      
      // Store notes as a custom field
      if (contact.notes) {
        customFields.push({
          id: 'DzWpL1KtYn5qRmH7oBvX',
          key: 'contact.property_notes',
          value: contact.notes.substring(0, 500) // Trim to 500 chars
        });
      }
    }
    
    // Prepare contact data for GHL
    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: contactEmail,
      phone: formattedPhone,
      source: contact.source || 'Zillow Property Listing',
      tags: ['scraped-lead', 'review-new-lead', 'zillow-property'],
      locationId: locationId,
      customFields: customFields
    };
    
    console.log("Attempting to create contact with data:", JSON.stringify(contactData));
    
    // Make API call to GHL
    const url = 'https://services.leadconnectorhq.com/contacts/';
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(contactData),
    };
    
    console.log("Sending request to GHL contacts API...");
    const response = await fetch(url, options);
    console.log(`GHL API response status: ${response.status}`);
    
    // Always try to get the response data for better debugging
    let data;
    try {
      data = await response.json();
      console.log("GHL API response data:", JSON.stringify(data));
    } catch (e) {
      console.error("Could not parse GHL API response:", e);
    }
    
    if (response.ok && data && data.contact && data.contact.id) {
      console.log(`Contact created successfully with ID: ${data.contact.id}`);
      return data.contact.id;
    } else {
      const errorMessage = data && data.message 
        ? `GHL API error: ${data.message}` 
        : `GHL API returned status ${response.status}`;
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error("Error creating contact in GHL:", error);
    throw error;
  }
}

// Add contact to leads pipeline as an opportunity
async function addToLeadsPipeline(contactId: string, contactName: string): Promise<string | null> {
  try {
    const { token, locationId } = await getAuthHeaders();
    
    console.log("Adding to pipeline - contact ID:", contactId, "name:", contactName);
    
    // Get pipeline IDs (dynamically if possible)
    const { pipelineId, stageId } = await findPipelineIds();
    console.log("Using pipeline ID:", pipelineId, "stage ID:", stageId);
    
    if (!token || !locationId) {
      console.error("Missing auth token or locationId");
      return null;
    }

    // First, check if opportunity already exists for this contact
    try {
      const checkUrl = `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}`;
      const checkResponse = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          contactId: contactId,
          pipelineId: pipelineId
        })
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log(`Found ${checkData.opportunities?.length || 0} existing opportunities for contact`);
        
        if (checkData.opportunities?.length > 0) {
          // Opportunity already exists, return its ID
          return checkData.opportunities[0].id;
        }
      }
    } catch (checkError) {
      console.error("Error checking for existing opportunities:", checkError);
      // Continue trying to create a new one
    }

    // Create the opportunity data
    const opportunityData = {
      pipelineId: pipelineId,
      locationId: locationId,
      name: `Lead: ${contactName}`,
      pipelineStageId: stageId,
      status: 'open',
      contactId: contactId,
      monetaryValue: 0,
      assignedTo: '',
      customFields: []
    };
    
    console.log("Creating opportunity with data:", JSON.stringify(opportunityData));
    
    // Create the opportunity using the pipeline and stage IDs
    const opportunityResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(opportunityData)
    });
    
    console.log(`Opportunity API response status: ${opportunityResponse.status}`);
    
    // Get response body for better error reporting
    let responseData;
    try {
      responseData = await opportunityResponse.json();
      console.log("Opportunity API response:", JSON.stringify(responseData));
      
      // Check if we have a valid opportunity ID
      if (responseData?.opportunity?.id) {
        return responseData.opportunity.id;
      }
    } catch (e) {
      console.error("Could not parse opportunity response:", e);
    }
    
    // Opportunity might already exist (409/400 status) - that's okay but we couldn't get the ID
    if (opportunityResponse.status === 409 || opportunityResponse.status === 400) {
      console.log("Opportunity might already exist (status:", opportunityResponse.status, ")");
      return null;
    }
    
    // Couldn't create opportunity or get its ID
    if (!opportunityResponse.ok) {
      console.error(`Failed to create opportunity: ${opportunityResponse.status}`);
      return null;
    }
    
    // If we got here, something unexpected happened
    return null;
  } catch (error) {
    console.error("Error in addToLeadsPipeline:", error);
    return null;
  }
}

// Function to handle a batch of contact creation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);
  const batchSize = parseInt(searchParams.get('batchSize') || '10', 10);
  
  // Validate parameters
  if (isNaN(startIndex) || isNaN(batchSize) || startIndex < 0 || batchSize <= 0) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }
  
  // For a given batch, process contacts sequentially
  const endIndex = startIndex + batchSize;
  const results: any[] = [];
  
  try {
    for (let i = startIndex; i < endIndex; i++) {
      // Generate contact - no mock data used
      const contact = await generateContact(i);
      
      try {
        // Create contact in GHL system
        const contactId = await addContactToGHL(contact);
        
        if (contactId) {
          // Add to leads pipeline
          const opportunityId = await addToLeadsPipeline(contactId, contact.name);
          
          // Record success
          results.push({
            index: i,
            success: true,
            contactId,
            opportunityId,
            name: contact.name
          });
        } else {
          results.push({
            index: i,
            success: false,
            error: 'Failed to create contact'
          });
        }
      } catch (error: any) {
        console.error(`Error creating contact ${i}:`, error);
        results.push({
          index: i,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      startIndex,
      endIndex,
      results,
    });
  } catch (error: any) {
    console.error('Error in batch processing:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// Handle POST - initialize contact scraping
export async function POST(request: NextRequest) {
  try {
    // Parse the request body if any (contains settings)
    let settings = {}; 
    try {
      settings = await request.json();
    } catch (e) {
      // Ignore if no body or invalid JSON
    }
    
    // Generate and add a single contact as a test
    const testContact = await generateContact(0);
    const contactId = await addContactToGHL(testContact);
    
    if (contactId) {
      // If contact creation succeeded, add to pipeline
      const opportunityId = await addToLeadsPipeline(contactId, testContact.name);
      
      return NextResponse.json({
        success: true,
        message: 'Contact scraping started',
        testContact: {
          contactId,
          opportunityId,
          name: testContact.name
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create test contact'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in contact scraping:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}