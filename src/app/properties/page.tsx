"use client";

import React, { useState } from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/DashboardLayout";

let DAILY_LIMIT = parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT || "2", 10);
if (isNaN(DAILY_LIMIT) || DAILY_LIMIT <= 0) {
  console.error("Invalid NEXT_PUBLIC_DAILY_LIMIT, defaulting to 2");
  DAILY_LIMIT = 2;
}
console.log("DAILY_LIMIT in production:", DAILY_LIMIT);

interface ZillowProperty {
  agentName?: string | null;
  agentPhoneNumber?: string | null;
  brokerName?: string | null;
  brokerPhoneNumber?: string | null;
  agentEmail?: string | null;
  brokerEmail?: string | null;
  homeType?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  price?: string | null;
  listingSubType?: string | null;
  zestimate?: string | null;
}

interface ScrapedResult {
  success: boolean;
  properties?: ZillowProperty[];
  error?: string;
}

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("Miami");
  const [isScraping, setIsScraping] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [scrapedProperties, setScrapedProperties] = useState<ZillowProperty[]>([]);
  const [completionMessage, setCompletionMessage] = useState<{
    title: string;
    message: string;
    actions: { label: string; href: string }[];
  } | null>(null);

  const getScrapedToday = () => {
    try {
      return parseInt(localStorage.getItem("scrapedToday") || "0", 10);
    } catch (e) {
      console.error("Error accessing localStorage scrapedToday:", e);
      return 0;
    }
  };

  const setScrapedToday = (value: number) => {
    try {
      localStorage.setItem("scrapedToday", value.toString());
    } catch (e) {
      console.error("Error setting localStorage scrapedToday:", e);
    }
  };

  const getScrapeDate = () => {
    try {
      return localStorage.getItem("scrapeDate") || new Date().toISOString().split("T")[0];
    } catch (e) {
      console.error("Error accessing localStorage scrapeDate:", e);
      return new Date().toISOString().split("T")[0];
    }
  };

  const setScrapeDate = (date: string) => {
    try {
      localStorage.setItem("scrapeDate", date);
    } catch (e) {
      console.error("Error setting localStorage scrapeDate:", e);
    }
  };

  const addLeadsToContact = async (properties: ZillowProperty[]) => {
    try {
      const transformedLeads = properties.map((prop) => transformLeadToContact(prop));
      for (const lead of transformedLeads) {
        try {
          const response = await fetch("/api/contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(lead),
          });
          if (!response.ok) {
            throw new Error(`Failed to add contact: ${response.statusText}`);
          }
        } catch (error) {
          console.log("Error adding contact:", error);
        }
      }
      return true;
    } catch (error) {
      console.error("Error adding leads to contact:", error);
      return false;
    }
  };

  const transformLeadToContact = (property: ZillowProperty) => {
    const fullName = property.agentName || property.brokerName || "";
    const nameParts = fullName.split(" ");
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: property.agentEmail || property.brokerEmail || "",
      phone: property.agentPhoneNumber || property.brokerPhoneNumber || "",
      address1: property.streetAddress || "",
      city: property.city || "",
      state: property.state || "",
      customFields: [
        {
          id: "ECqyHR21ZJnSMolxlHpU",
          key: "contact.type",
          field_value: "lead",
        },
      ],
      tags: ["scraped-lead", "zillow-property", "Review-new-lead"],
    };
  };

  const handleScrapeProperties = async (count: number = DAILY_LIMIT) => {
    setIsScraping(true);
    setProgressPercentage(0);
    setSuccessCount(0);
    setFailureCount(0);
    setCurrentStatus("");
    setCompletionMessage(null);
    setScrapedProperties([]); // Reset properties

    try {
      const today = new Date().toISOString().split("T")[0];
      let scrapedToday = getScrapedToday();
      const storedDate = getScrapeDate();

      if (storedDate !== today) {
        scrapedToday = 0;
        setScrapeDate(today);
        setScrapedToday(0);
      }

      if (scrapedToday >= DAILY_LIMIT) {
        setCompletionMessage({
          title: "Daily Limit Reached",
          message: `You've reached the daily limit of ${DAILY_LIMIT} properties. Come back tomorrow to scrape more listings!`,
          actions: [
            { label: "View Properties", href: "/properties/list" },
            { label: "View Contacts", href: "/contacts" },
          ],
        });
        return;
      }

      const remainingCount = Math.min(count, DAILY_LIMIT - scrapedToday);
      setCurrentStatus(`Starting to scrape ${remainingCount} properties...`);

      const searchResponse = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: remainingCount,
        }),
      });
      const searchURLbody = await searchResponse.json();
      const searchURLs = searchURLbody.urls;
      if (!searchResponse.ok || !searchURLs) {
        console.error("Raw error response:", searchURLbody);
        let parsedError;
        try {
          parsedError = JSON.parse(searchURLbody);
        } catch (e) {
          throw new Error(`Failed to scrape properties: ${searchResponse.statusText} (Status: ${searchResponse.status})`);
        }
        throw new Error(`Failed to scrape properties: ${parsedError.error || searchResponse.statusText}`);
      }
      const searchDetailResponse = await fetch("/api/properties/detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: searchURLs,
          limit: remainingCount,
        }),
      });
      const searchDetailURLbody = await searchDetailResponse.json();

      const data: ScrapedResult = searchDetailURLbody;
      console.log("Scraped data:", data);

      if (data.success && data.properties) {
        const totalProperties = data.properties.length;
        setSuccessCount(totalProperties);
        setScrapedProperties(data.properties); // Store the properties
        setProgressPercentage(50);

        setCurrentStatus(`Adding ${totalProperties} properties to contacts...`);
        const contactsAdded = await addLeadsToContact(data.properties);

        scrapedToday += totalProperties;
        setScrapedToday(scrapedToday);

        setProgressPercentage(100);
        setCurrentStatus(`Successfully scraped ${totalProperties} properties and added to contacts.`);

        const remaining = DAILY_LIMIT - scrapedToday;
        setCompletionMessage({
          title: "Property Scraping Complete",
          message: `${totalProperties} properties have been scraped from Zillow and ${contactsAdded ? "added to contacts" : "failed to add to contacts"
            } based on your query: "${searchQuery}". You have ${remaining} properties left to scrape today.`,
          actions: [
            { label: "View Properties", href: "/properties/list" },
            { label: "View Contacts", href: "/contacts" },
          ],
        });
      } else {
        throw new Error(data.error || "No properties returned from Apify");
      }
    } catch (error) {
      console.error("Error scraping properties:", error);
      const errorMessage = error instanceof Error ? error.message : String(error) || "An unknown error occurred";
      setFailureCount(1);
      setCurrentStatus(`Error: ${errorMessage}`);
      setCompletionMessage({
        title: "Property Scraping Failed",
        message: `Error: ${errorMessage}`,
        actions: [],
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerateSingleProperty = async () => {
    await handleScrapeProperties(1);
  };

  return (
    <DashboardLayout title="Properties">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg mb-8">
          <div className="p-6 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-3">Scrape Zillow Properties</h2>
            <p className="mb-4">
              Enter a search query and generate up to {DAILY_LIMIT} property listings at a time from Zillow per day, powered by Apify.
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Search Zillow Properties</h2>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
               <input
                  type="text"
                  className="block w-full rounded-md border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                  placeholder="e.g., Miami property under $1,000,000"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isScraping}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleScrapeProperties(DAILY_LIMIT)}
                  disabled={isScraping}
                  className={`flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm text-white font-medium ${isScraping ? "bg-gray-500" : "bg-purple-700 hover:bg-purple-800"
                    }`}
                >
                  {isScraping ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5" />
                      Scrape {DAILY_LIMIT} Properties
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {completionMessage && (
            <div
              className={`mb-6 p-4 border rounded-md text-sm ${completionMessage.title === "Daily Limit Reached"
                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                  : "border-green-200 bg-green-50 text-green-700"
                }`}
            >
              <div className="flex items-start">
                {completionMessage.title === "Daily Limit Reached" ? (
                  <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-yellow-500" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
                )}
                <div>
                  <p className="font-medium mb-1">{completionMessage.title}</p>
                  <p>{completionMessage.message}</p>
                  {completionMessage.actions.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      {completionMessage.actions.map((action, index) => (
                        <a
                          key={index}
                          href={action.href}
                          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${completionMessage.title === "Daily Limit Reached"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                        >
                          {action.label} →
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Display Scraped Properties in a Table */}
          {scrapedProperties.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Scraped Properties</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Home Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scrapedProperties.map((property, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.streetAddress || "N/A"}, {property.city || "N/A"}, {property.state || "N/A"}{" "}
                          {property.zipcode || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.price || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.homeType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.agentName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.agentPhoneNumber || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {isScraping && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Scraping Properties</h3>
              <div className="mb-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-gray-600">{successCount} properties scraped</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                    <span>Successful</span>
                  </div>
                  <span className="font-medium">{successCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                    <span>Failed</span>
                  </div>
                  <span className="font-medium">{failureCount}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <p>{currentStatus}</p>
              </div>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsScraping(false)}
                  disabled={progressPercentage < 100}
                >
                  {progressPercentage < 100 ? "Processing..." : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}