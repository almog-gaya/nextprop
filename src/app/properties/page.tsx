"use client";

import React, { useState } from "react";
import { MagnifyingGlassIcon, ArrowPathIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/DashboardLayout";

// Define response types
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
  const [searchQuery, setSearchQuery] = useState("Miami property under $1,000,000");
  const [isScraping, setIsScraping] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [completionMessage, setCompletionMessage] = useState<{
    title: string;
    message: string;
    actions: { label: string; href: string }[];
  } | null>(null);

  const addLeadsToContact = async (properties: ZillowProperty[]) => {
    try {
      const transformedLeads = properties
        .map(prop => transformLeadToContact(prop));

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
        } catch (_) {
          console.log("error adding contact", _);
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
      /// treating scraped data as leads
      customFields: [
        {
          "id": "ECqyHR21ZJnSMolxlHpU",
          "key": "contact.type",
          "field_value": "lead"
        }
      ],
      tags: [
        'scraped-lead',
        'zillow-property',
        'Review-new-lead'
      ]

    };
  };

  const handleScrapeProperties = async (count: number = 100) => {
    setIsScraping(true);
    setProgressPercentage(0);
    setSuccessCount(0);
    setFailureCount(0);
    setCurrentStatus("");
    setCompletionMessage(null);

    try {
      setCurrentStatus(`Starting to scrape ${count} properties...`);

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to scrape properties: ${errorData.error || response.statusText}`);
      }

      const data: ScrapedResult = await response.json();
      console.log("Scraped data:", data);

      if (data.success && data.properties) {
        const totalProperties = data.properties.length;
        setSuccessCount(totalProperties);
        setProgressPercentage(50);

        setCurrentStatus(`Adding ${totalProperties} properties to contacts...`);

        const contactsAdded = await addLeadsToContact(data.properties);

        setProgressPercentage(100);
        setCurrentStatus(`Successfully scraped ${totalProperties} properties and added to contacts.`);

        setCompletionMessage({
          title: "Property Scraping Complete",
          message: `${totalProperties} properties have been scraped from Zillow and ${contactsAdded ? "added to contacts" : "failed to add to contacts"} based on your query: "${searchQuery}".`,
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
      setFailureCount(1);
      setCurrentStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setCompletionMessage({
        title: "Property Scraping Failed",
        message: `Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
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
              Enter a search query and generate up to 100 property listings from Zillow with one click, powered by Apify.
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
                  onClick={() => handleScrapeProperties(100)}
                  disabled={isScraping}
                  className={`flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm text-white font-medium ${isScraping ? "bg-gray-500" : "bg-purple-700 hover:bg-purple-800"}`}
                >
                  {isScraping ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5" />
                      Scrape 2 Properties
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerateSingleProperty}
                  disabled={isScraping}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Test (1 Property)
                </button>
              </div>
            </div>
          </div>

          {completionMessage && (
            <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md text-sm text-green-700">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium mb-1">{completionMessage.title}</p>
                  <p>{completionMessage.message}</p>
                  {completionMessage.actions.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      {completionMessage.actions.map((action, index) => (
                        <a
                          key={index}
                          href={action.href}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200"
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