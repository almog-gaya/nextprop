import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    const ACTOR_ID = "ENK9p4RZHg0iVso52";
    const API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`;

    console.log("[DEBUG] Starting POST request...");
    console.log("[DEBUG] API_TOKEN exists:", !!API_TOKEN); 

    try {
        // Parse request body
        console.log("[DEBUG] Parsing request body...");
        const { urls, limit } = await req.json();
        console.log("[DEBUG] urls from request:", JSON.stringify(urls));
        const startUrls = urls.map((url: any) => ({
            url,
            method: "GET",
          }));
        // Prepare actor input
        const actorInput = {
            startUrls,
            extractBuildingUnits: "for_sale",
            propertyStatus: "FOR_SALE",
            searchResultsDatasetId: "",
            maxItems: limit,
        };
        console.log("[DEBUG] actorInput:", JSON.stringify(actorInput));

        // Start actor run
        console.log("[DEBUG] Starting actor run...");
        const runResponse = await fetch(`${API_URL}?token=${API_TOKEN}&maxItems=${limit ?? 2}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(actorInput),
        });
        console.log("[DEBUG] runResponse status:", runResponse.status);
        const runData = await runResponse.json();
        console.log("[DEBUG] runData:", JSON.stringify(runData));

        if (!runResponse.ok) {
            const errorText = await runResponse.text();
            throw new Error(`Actor run failed with status: ${runResponse.status} - ${errorText}`);
        }

        const runId = runData.data?.id;
        console.log("[DEBUG] runId:", runId);
        if (!runId) throw new Error("No runId found in runData");

        // Poll actor run status
        console.log("[DEBUG] Polling actor run status...");
        let runStatus;
        do {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusResponse = await fetch(
                `https://api.apify.com/v2/actor-runs/${runId}?token=${API_TOKEN}`
            );
            console.log("[DEBUG] statusResponse status:", statusResponse.status);
            runStatus = await statusResponse.json();
            console.log("[DEBUG] runStatus:", JSON.stringify(runStatus));

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
            }
        } while (runStatus.data?.status === "RUNNING" || runStatus.data?.status === "READY");

        console.log("[DEBUG] Final run status:", runStatus.data?.status);
        if (runStatus.data?.status !== "SUCCEEDED") {
            throw new Error(`Actor run failed with status: ${runStatus.data?.status}`);
        }

        // Fetch dataset items
        const datasetId = runStatus.data?.defaultDatasetId;
        console.log("[DEBUG] datasetId:", datasetId);
        if (!datasetId) throw new Error("No datasetId found in runStatus");

        console.log("[DEBUG] Fetching dataset items...");
        const itemsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${API_TOKEN}`
        );
        console.log("[DEBUG] itemsResponse status:", itemsResponse.status);
        const items = await itemsResponse.json();
        console.log("[DEBUG] Raw items:", JSON.stringify(items));

        if (!itemsResponse.ok) {
            const errorText = await itemsResponse.text();
            throw new Error(`Failed to fetch items: ${itemsResponse.status} - ${errorText}`);
        }

        // Process items
        console.log("[DEBUG] Processing items...");
        const filteredItems = items
            .filter((item: any) => {
                const attributionInfo = item.attributionInfo || {};
                const hasContactInfo = (
                    attributionInfo.agentPhoneNumber ||
                    attributionInfo.brokerPhoneNumber ||
                    attributionInfo.agentEmail ||
                    attributionInfo.brokerEmail
                );
                console.log("[DEBUG] Item filter check:", JSON.stringify({ item, hasContactInfo }));
                return hasContactInfo;
            })
            .map((item: any) => {
                const attributionInfo = item.attributionInfo || {};
                
                // Extract image URL from various possible fields
                let imageUrl = null;
                
                // Check for images in primaryPhotos
                if (item.primaryPhotos && item.primaryPhotos.length > 0) {
                    try {
                        // Parse the primaryPhotos JSON if it's a string
                        const photos = typeof item.primaryPhotos === 'string' 
                            ? JSON.parse(item.primaryPhotos) 
                            : item.primaryPhotos;
                            
                        if (photos[0] && photos[0].url) {
                            imageUrl = photos[0].url;
                        }
                    } catch (e) {
                        console.log("[DEBUG] Error parsing primaryPhotos:", e);
                    }
                }
                
                // Try responsivePhotos if primaryPhotos didn't work
                if (!imageUrl && item.responsivePhotos) {
                    try {
                        // Parse the responsivePhotos JSON if it's a string
                        const photos = typeof item.responsivePhotos === 'string'
                            ? JSON.parse(item.responsivePhotos)
                            : item.responsivePhotos;
                            
                        if (photos && photos[0] && photos[0].url) {
                            imageUrl = photos[0].url;
                        }
                    } catch (e) {
                        console.log("[DEBUG] Error parsing responsivePhotos:", e);
                    }
                }
                
                // Try miniCardPhotos if other methods didn't work
                if (!imageUrl && item.miniCardPhotos) {
                    try {
                        const photos = typeof item.miniCardPhotos === 'string'
                            ? JSON.parse(item.miniCardPhotos)
                            : item.miniCardPhotos;
                            
                        if (photos && photos[0] && photos[0].url) {
                            imageUrl = photos[0].url;
                        }
                    } catch (e) {
                        console.log("[DEBUG] Error parsing miniCardPhotos:", e);
                    }
                }
                
                // Try streetViewTileImageUrl as a last resort
                if (!imageUrl && item.streetViewTileImageUrlMediumAddress) {
                    imageUrl = item.streetViewTileImageUrlMediumAddress;
                }
                
                // Fallback to street view if we have the latitude and longitude
                if (!imageUrl && item.latitude && item.longitude) {
                    imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${item.latitude},${item.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY || ''}`;
                }
                
                const mappedItem = {
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
                    bedrooms: item.bedrooms || null,
                    bathrooms: item.bathrooms || null,
                    description: item.description || null,
                    timeOnZillow: item.timeOnZillow || null,
                    url: item.hdpUrl? "https://www.zillow.com"+item.hdpUrl : null,
                    imageUrl: imageUrl,
                };
                console.log("[DEBUG] Mapped item:", JSON.stringify(mappedItem));
                return mappedItem;
            });

        console.log("[DEBUG] filteredItems:", JSON.stringify(filteredItems));
        console.log("[DEBUG] filteredItems length:", filteredItems.length);

        // Return response
        const response = { success: true, properties: filteredItems };
        console.log("[DEBUG] Final response:", JSON.stringify(response));
        return NextResponse.json(response);

    } catch (error: any) {
        console.error("[DEBUG] Error occurred:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to scrape Zillow",
            detail: error.message || JSON.stringify(error),
        });
    }
}