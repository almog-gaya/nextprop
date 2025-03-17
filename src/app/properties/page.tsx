"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout"; 
import CompletionMessage from "@/components/properties/CompletionMessage";
import SearchBar from "@/components/properties/searchBar";
import PropertyTable from "@/components/properties/PropertyTable";
import PropertyPopup from "@/components/properties/PropertyPopup";
import ScrapingProgress from "@/components/properties/ScrapingProcess";
import { ScrapedResult, ZillowProperty } from "@/types/properties";
 
let DAILY_LIMIT = parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT || "2", 10);
if (isNaN(DAILY_LIMIT) || DAILY_LIMIT <= 0) {
  console.error("Invalid NEXT_PUBLIC_DAILY_LIMIT, defaulting to 2");
  DAILY_LIMIT = 2;
}
console.log("DAILY_LIMIT in production:", DAILY_LIMIT);

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
  const [selectedProperty, setSelectedProperty] = useState<ZillowProperty | null>(null);

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
    // Initial state reset
    const resetState = () => {
      setIsScraping(true);
      setProgressPercentage(0);
      setSuccessCount(0);
      setFailureCount(0);
      setCurrentStatus("");
      setCompletionMessage(null);
      setScrapedProperties([]);
    };
  
    // Check and reset daily scrape count
    const checkDailyLimit = (): number | null => {
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
        return null;
      }
  
      return Math.min(count, DAILY_LIMIT - scrapedToday);
    };
  
    // Fetch properties from Zillow API
    const fetchProperties = async (limit: number): Promise<ZillowProperty[]> => {
      setCurrentStatus(`Starting to scrape ${limit} properties...`);
  
      const searchResponse = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit }),
      });
  
      const searchURLbody = await searchResponse.json();
      const searchURLs = searchURLbody.urls;
  
      if (!searchResponse.ok || !searchURLs) {
        console.error("Search API error response:", searchURLbody);
        throw new Error(
          searchURLbody.error ||
            `Failed to scrape properties: ${searchResponse.statusText} (Status: ${searchResponse.status})`
        );
      }
  
      const detailResponse = await fetch("/api/properties/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: searchURLs, limit }),
      });
  
      const data: ScrapedResult = await detailResponse.json();
      console.log("Scraped data:", data);
  
      if (!data.success || !data.properties) {
        throw new Error(data.error || "No properties returned from Apify");
      }
  
      return data.properties;
    };
  
    // Process scraped properties
    const processProperties = async (properties: ZillowProperty[]) => {
      const totalProperties = properties.length;
      setSuccessCount(totalProperties);
      setScrapedProperties(properties);
      setProgressPercentage(50);
  
      setCurrentStatus(`Adding ${totalProperties} properties to contacts...`);
      const contactsAdded = await addLeadsToContact(properties);
  
      const scrapedToday = getScrapedToday() + totalProperties;
      setScrapedToday(scrapedToday);
  
      setProgressPercentage(100);
      setCurrentStatus(`Successfully scraped ${totalProperties} properties and added to contacts.`);
  
      const remaining = DAILY_LIMIT - scrapedToday;
      setCompletionMessage({
        title: "Property Scraping Complete",
        message: `${totalProperties} properties have been scraped from Zillow and ${
          contactsAdded ? "added to contacts" : "failed to add to contacts"
        } based on your query: "${searchQuery}". You have ${remaining} properties left to scrape today.`,
        actions: [
          { label: "View Properties", href: "/properties/list" },
          { label: "View Contacts", href: "/contacts" },
        ],
      });
    };
  
    // Handle errors
    const handleError = (error: unknown) => {
      console.error("Error scraping properties:", error);
      const errorMessage = error instanceof Error ? error.message : String(error) || "An unknown error occurred";
      setFailureCount(1);
      setCurrentStatus(`Error: ${errorMessage}`);
      setCompletionMessage({
        title: "Property Scraping Failed",
        message: `Error: ${errorMessage}`,
        actions: [],
      });
    };
  
    // Main execution
    try {
      resetState();
      const remainingCount = checkDailyLimit();
      if (remainingCount === null) return;
  
      const properties = await fetchProperties(remainingCount);
      await processProperties(properties);
    } catch (error) {
      handleError(error);
    } finally {
      setIsScraping(false);
    }
  };

  const handleRowClick = (property: ZillowProperty) => {
    setSelectedProperty(property);
  };

  const closePopup = () => {
    setSelectedProperty(null);
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
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isScraping={isScraping}
            handleScrapeProperties={handleScrapeProperties}
            dailyLimit={DAILY_LIMIT}
          />
          <CompletionMessage completionMessage={completionMessage} />
          <PropertyTable scrapedProperties={scrapedProperties} handleRowClick={handleRowClick} />
        </div>

        <PropertyPopup selectedProperty={selectedProperty} closePopup={closePopup} />
        <ScrapingProgress
          isScraping={isScraping}
          progressPercentage={progressPercentage}
          successCount={successCount}
          failureCount={failureCount}
          currentStatus={currentStatus}
          setIsScraping={setIsScraping}
        />
      </div>
    </DashboardLayout>
  );
}