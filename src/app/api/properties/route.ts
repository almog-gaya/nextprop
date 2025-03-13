import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export async function POST(req: Request) {
  const actorId = "ENK9p4RZHg0iVso52"; // New Actor ID

  try {
    const { query, maxItems: requestedMaxItems } = await req.json();

    // Validate query
    if (!query) {
      throw new Error("Please provide a valid address or query");
    }

    /// [Agent] to scrape search results
    const searchURLs = await zillowSearchScraper(query);
    const startUrls = searchURLs.map((url) => ({
      url,
      method: "GET",
    }));
    // Validate and set maxItems
    let maxItems = requestedMaxItems ?? 1; 

    const actorInput = {
      startUrls: startUrls,
      "extractBuildingUnits": "for_sale",
      "propertyStatus": "FOR_SALE",
      searchResultsDatasetId: "",
      maxItems, // Include maxItems to avoid the error
    };
    // [Agent] to scrape property details
    const run = await client.actor(actorId).call(actorInput);

    // Check if the run succeeded
    if (run.status !== "SUCCEEDED") {
      throw new Error(`Actor run failed with status: ${run.status}`);
    }

    // Fetch the dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Filter items to include only those with required info
    const filteredItems = items
      .filter((item: any) => {
        const attributionInfo = item.attributionInfo || {};
        // Require either agentPhoneNumber, brokerPhoneNumber, agentEmail, or brokerEmail
        return (
          attributionInfo.agentPhoneNumber ||
          attributionInfo.brokerPhoneNumber ||
          attributionInfo.agentEmail ||
          attributionInfo.brokerEmail
        );
      })
      .map((item: any) => {
        const attributionInfo = item.attributionInfo || {};
        return {
          agentName: attributionInfo.agentName || null,
          agentPhoneNumber: attributionInfo.agentPhoneNumber || null,
          brokerName: attributionInfo.brokerName || null,
          brokerPhoneNumber: attributionInfo.brokerPhoneNumber || null,
          agentEmail: attributionInfo.agentEmail || null,
          brokerEmail: attributionInfo.brokerEmail || null,
          homeType: item.homeType || null,
          streetAddress: item.streetAddress || null,
          city: item.city || null,
          state: item.state || null,
          zipcode: item.zipcode || null,
          price: item.price || null,
          listingSubType: item.listingSubType || null,
          zestimate: item.zestimate || null,
        };
      });

    return NextResponse.json({
      success: true,
      properties: filteredItems,
    });
  } catch (error) {
    console.error("Error running Apify Actor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/// An Agent that fetches the search terms for us
const zillowSearchScraper = async (q: string) => {
  function buildZillowUSAURL(query: string, sortBy = "days", daysOnZillow = 90) {
    const usaBounds = {
      west: -125.0,
      east: -66.9,
      south: 24.4,
      north: 49.4
    };

    const searchQueryState = {
      pagination: {},
      isMapVisible: true,
      mapBounds: usaBounds,
      usersSearchTerm: query,
      filterState: {
        sort: { value: sortBy },
        tow: { value: false },
        mf: { value: false },
        con: { value: false },
        land: { value: false },
        apa: { value: false },
        manu: { value: false },
        apco: { value: false },
        doz: { value: daysOnZillow }
      },
      isListVisible: true,
      mapZoom: 12
    };
    return searchQueryState;
  }
  const encodedQuery = encodeURIComponent(JSON.stringify(buildZillowUSAURL(q)));
  const payload = {
    "searchUrls": [
      {
        "url": `https://www.zillow.com/homes/for_sale/?searchQueryState=${encodedQuery}`,
        "method": "GET"
      }
    ],
    "extractionMethod": "PAGINATION_WITH_ZOOM_IN",
    maxItems: 1
  };

  const run = await client.actor("X46xKaa20oUA1fRiP").call(payload);


  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const filteredSearchResults = items
    .map((item) => item.detailUrl)
    .filter(Boolean); // Ensures we only return valid URLs

  return filteredSearchResults;
}