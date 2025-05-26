"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  PhoneIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  MicrophoneIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsPopup from "@/components/bulk-actions/StatsPopup";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import classNames from "classnames";
import SearchBarProperties from "@/components/properties/SearchBar";
import PropertyTable from "@/components/properties/PropertyTable";
import PropertyPopup from "@/components/properties/PropertyPopup";
import ScrapingProgress from "@/components/properties/ScrapingProcess";
import CompletionMessage from "@/components/properties/CompletionMessage";
import { ScrapedResult, ZillowProperty } from "@/types/properties";
import toast from "react-hot-toast";
import axios from "axios";
import BillingTab from "@/components/settings/tabs/BillingTab";

// Define Pipeline interface
interface Pipeline {
  id: string;
  name: string;
  stages: {
    id: string;
    name: string;
  }[];
}

let DAILY_LIMIT = parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT || "2", 10);
if (isNaN(DAILY_LIMIT) || DAILY_LIMIT <= 0) {
  console.error("Invalid NEXT_PUBLIC_DAILY_LIMIT, defaulting to 2");
  DAILY_LIMIT = 2;
}
console.log("DAILY_LIMIT in production:", DAILY_LIMIT);

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Bulk Actions tab
  const [bulkActionsData, setBulkActionsData] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingBulkActions, setLoadingBulkActions] = useState(true);
  const [bulkActionsError, setBulkActionsError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("account");

  // Properties tab state
  const [searchMode, setSearchMode] = useState<"query" | "zipcode">("zipcode");
  const [isScraping, setIsScraping] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [link, setLink] = useState<string>("https://www.redfin.com/zipcode/32754/filter/min-days-on-market=3m");
  const [priceMin, setPriceMin] = useState<number>(500000);
  const [priceMax, setPriceMax] = useState<number>(700000);
  const [types, setTypes] = useState<string>("");
  const [daysOnZillow, setDaysOnZillow] = useState<string>("3mo");
  const [scrapedProperties, setScrapedProperties] = useState<ZillowProperty[]>([]);
  const [completionMessage, setCompletionMessage] = useState<{
    title: string;
    message: string;
    actions: { label: string; href: string }[];
  } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<ZillowProperty | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Notifications tab state
  const [notificationPreferences, setNotificationPreferences] = useState<any>({
    newCall: [],
    newSMS: [],
    leadStatusChange: [],
    newLeadAssigned: [],
  });
  const [hasNotificationDocument, setHasNotificationDocument] = useState(false);
  const [notificationHasChanges, setNotificationHasChanges] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<any>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [pipelines, setPipelines] = useState<any[]>([]);

  // Add Phone Numbers tab state
  const [phoneNumbersData, setPhoneNumbersData] = useState<any[]>([]);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(true);
  const [phoneNumbersError, setPhoneNumbersError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);

  // Analytics tab state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Billing tab state
  const [currentBalance, setCurrentBalance] = useState<number>(125);
  const [phoneNumberCount, setPhoneNumberCount] = useState<number>(0);
  const [billingData, setBillingData] = useState({
    baseSubscription: 1000,
    smsUsage: 2000,
    smsUnitPrice: 0.01,
    rvmUsage: 500,
    rvmUnitPrice: 0.05,
    emailUsage: 4000,
    emailUnitPrice: 0.002,
    otherIntegrations: 200,
    phoneNumberUnitPrice: 7,
  });

  // Properties functions
  const handleRowClick = (property: ZillowProperty) => {
    setSelectedProperty(property);
  };

  const closePopup = () => {
    setSelectedProperty(null);
  };

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

  const addContactsToPipeline = async (pipelineId: string, stageId: string, contacts: any[]) => {
    try {
      const results = await Promise.allSettled(
        contacts.map(async (contact: any) => {
          try {
            const response = await fetch("/api/opportunities", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                pipelineId: pipelineId,
                pipelineStageId: stageId,
                contactId: contact.id,
                status: "open",
                name: `${contact.firstName} ${contact.lastName} - ${contact.address1 ?? `${contact.street}, ${contact.city}, ${contact.state} ${contact.zipCode}`}`.trim(),
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { contact, success: true };
          } catch (error) {
            console.error(`Failed to add contact ${contact.id} to pipeline:`, error);
            return { contact, success: false, error };
          }
        })
      );

      const successful = results.filter((result) => result.status === "fulfilled" && result.value.success);
      const failed = results.filter((result) => result.status === "rejected" || !result.value.success);

      if (failed.length > 0) {
        toast.error(`${failed.length} contacts failed to add to pipeline`);
      }

      if (successful.length > 0) {
        toast.success(`${successful.length} contacts added to pipeline successfully`);
      }

      return { successful, failed };
    } catch (error) {
      console.error("Unexpected error in addContactsToPipeline:", error);
      toast.error("An unexpected error occurred while adding contacts to pipeline");
      return { successful: [], failed: contacts.map((contact) => ({ contact, success: false, error })) };
    }
  };

  const handleBulkUpload = async (properties: ZillowProperty[]) => {
    try {
      const uploadResults = await Promise.all(
        properties.map(async (prop: any) => {
          try {
            const response = await axios.post("/api/contacts", transformLeadToContact(prop));
            return { success: true, contact: response.data.contact };
          } catch (error) {
            console.warn(`Failed to upload contact "${prop?.firstName || prop?.phone}":`, error);
            return { success: false, contact: null };
          }
        })
      );

      const successfulUploads = uploadResults.filter((result) => result.success);
      const processedContacts = successfulUploads.map((result) => result.contact);

      toast.success(`${successfulUploads.length} contacts added successfully`);

      if (selectedPipeline && selectedStage) {
        addContactsToPipeline(selectedPipeline, selectedStage, processedContacts);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add contacts");
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

  const _searchByZipCodes = async (limit: number) => {
    return await fetch("/api/properties/search-by-zipcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        limit,
        link,
      }),
    });
  };

  const getUserLocationId = async () => {
    const response = await fetch("/api/auth/ghl/location-id");
    const data = await response.json();
    return data.locationId;
  };

  const handleScrapeProperties = async (count: number = DAILY_LIMIT) => {
    if (selectedPipeline == null || selectedStage == null) {
      toast.error("Please select a pipeline and stage");
      return;
    }
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
    // Skipping daily limits for specific users
    const UNLIMITED_USERS = ["s3mNHrFuDyGiI7oUVisU", "rhJba4qZDxLza65WYvnW"];

    // Modify the checkDailyLimit function
    const checkDailyLimit = async (): Promise<number | null> => {
      const today = new Date().toISOString().split("T")[0];
      let scrapedToday = getScrapedToday();
      const storedDate = getScrapeDate();

      // Get current user email (you'll need to implement this based on your auth system)
      const userEmail = await getUserLocationId(); // Implement this function to get current user's email

      // Check if user is in unlimited list
      if (UNLIMITED_USERS.includes(userEmail)) {
        return count; // Return the requested count without daily limit check
      }

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
      if (!link) {
        toast.error("No link provided");
        throw new Error("No link provided");
      }

      setCurrentStatus(`Starting to scrape ${limit} properties...`);
      const searchResponse = await _searchByZipCodes(limit);
      const searchURLbody = await searchResponse.json();
      return convertToZillowProperty(searchURLbody.data).properties || [];
    };
    // Process scraped properties
    const processProperties = async (properties: ZillowProperty[]) => {
      const totalProperties = properties.length;
      setSuccessCount(totalProperties);
      setScrapedProperties(properties);
      setProgressPercentage(50);

      setCurrentStatus(`Adding ${totalProperties} properties to contacts...`);
      const contactsAdded = await handleBulkUpload(properties);
      const scrapedToday = getScrapedToday() + totalProperties;
      setScrapedToday(scrapedToday);

      setProgressPercentage(100);
      setCurrentStatus(`Successfully scraped ${totalProperties} properties and added to contacts.`);

      const remaining = DAILY_LIMIT - scrapedToday;
      setCompletionMessage({
        title: "Property Scraping Complete",
        message: `${totalProperties} properties have been scraped from Redfin and based on your link: "${link}". You have ${remaining > 0 ? remaining : 0} properties left to scrape today.`,
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
      const remainingCount = await checkDailyLimit();
      if (remainingCount === null) return;
      const properties = await fetchProperties(remainingCount);
      await processProperties(properties);
    } catch (error) {
      handleError(error);
    } finally {
      setIsScraping(false);
    }
  };

  const getPhoto = (photos: any) => {
    try {
      const url = photos[0].photoUrls || {};
      return url.fullScreenPhotoUrl;
    } catch (e) {
      console.error("Error getting photo:", e);
      return null;
    }
  };

  function convertToZillowProperty(results: any[]): ScrapedResult {
    try {
      const properties: ZillowProperty[] = (results || []).map((result = {}) => {
        const priceValue = result.price || {};
        const mainHouseInfo = result.mainHouseInfo || {};
        const amenitiesInfo = result.amenitiesInfo || {};

        const photos = result.mediaBrowserInfo.photos || [];
        const publicRecords = result.publicRecordsInfo?.latestListingInfo || {};
        const listingAgents = Array.isArray(mainHouseInfo.listingAgents) ? mainHouseInfo.listingAgents : [];
        const listingAgent = listingAgents[0]?.agentInfo || {};
        const listingBroker = listingAgents[0] || {};
        const propertyAddress = mainHouseInfo.propertyAddress || {};

        const mlsDisclaimerInfo = amenitiesInfo?.mlsDisclaimerInfo;
        const mlsListingAgentName = mlsDisclaimerInfo?.listingAgentName || null;
        const mlsListingAgentPhone = mlsDisclaimerInfo?.listingAgentNumber || null;
        const mlsListingBrokerName = mlsDisclaimerInfo?.listingBrokerName || null;
        const mlsListingBrokerPhone = mlsDisclaimerInfo?.listingBrokerNumber || null;

        // Safely construct street address from propertyAddress components
        const streetComponents = [
          propertyAddress.streetNumber,
          propertyAddress.directionalPrefix,
          propertyAddress.streetName,
          propertyAddress.streetType,
          propertyAddress.directionalSuffix,
        ].filter(Boolean); // Remove null/undefined values
        const constructedStreetAddress = streetComponents.length > 0 ? streetComponents.join(" ").trim() : null;

        // Fallback address parsing
        const fullAddress = mainHouseInfo.fullStreetAddress || "";
        const addressParts = fullAddress.split(", ").filter(Boolean);
        const stateZip = (addressParts[2] || "").split(" ").filter(Boolean);

        return {
          agentName: mlsListingAgentName ?? listingAgent.agentName ?? null,
          agentPhoneNumber: mlsListingAgentPhone ?? listingBroker.agentPhoneNumber?.phoneNumber ?? null,
          brokerName: mlsListingBrokerName ?? listingBroker.brokerName ?? null,
          brokerPhoneNumber: mlsListingBrokerPhone ?? listingBroker.brokerPhoneNumber?.phoneNumber ?? null,
          agentEmail: listingBroker.agentEmailAddress ?? null,
          brokerEmail: listingBroker.brokerEmailAddress ?? null,
          homeType: publicRecords.propertyTypeName ?? null,
          streetAddress: constructedStreetAddress ?? mainHouseInfo.streetAddress ?? null,
          city: propertyAddress.city ?? (addressParts[1] || null),
          state: propertyAddress.stateOrProvinceCode ?? (stateZip[0] || null),
          zipcode: propertyAddress.postalCode ?? (stateZip[1] || null),
          price: priceValue.value ?? null,
          listingSubType: null,
          zestimate: null,
          bedrooms: publicRecords.beds != null ? String(publicRecords.beds) : null,
          bathrooms: publicRecords.baths != null ? String(publicRecords.baths) : null,
          description: result.listingRemarks,
          timeOnZillow: result?.addressSectionInfo?.cumulativeDaysOnMarket ?? "N/A" + " days",
          url: "https://www.redfin.com" + result.url,
          imageUrl: getPhoto(photos),
        };
      });

      return {
        success: true,
        properties: properties,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during conversion",
      };
    }
  }

  // This effect should fetch pipelines for both notifications and properties
  useEffect(() => {
    if ((activeTab === "notifications" || activeTab === "bulk-actions") && user?.locationId) {
      fetchPipelines();
      if (activeTab === "notifications") {
        fetchNotificationPreferences();
      }
    }
  }, [activeTab, user?.locationId]);

  const fetchPipelines = async () => {
    try {
      const response = await fetch("/api/pipelines");
      const json = await response.json();
      const fetchedPipelines = json?.pipelines || [];
      setPipelines(fetchedPipelines);

      // Set the first pipeline as default if there are pipelines
      if (fetchedPipelines.length > 0) {
        setSelectedPipeline(fetchedPipelines[0].id);
        setSelectedStage(fetchedPipelines[0].stages[0].id);
      }
    } catch (error) {
      console.error("Failed to load pipelines", error);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user?.locationId) return;

    try {
      setLoadingNotifications(true);
      const docRef = doc(db, "app-notifications", user.locationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setNotificationPreferences(data.preferences);
        setInitialPreferences(data.preferences);
        setHasNotificationDocument(true);
      } else {
        setHasNotificationDocument(false);
        setNotificationPreferences({
          newCall: [],
          newSMS: [],
          leadStatusChange: [],
          newLeadAssigned: [],
        });
        setInitialPreferences(null);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Check for changes in notification preferences
  useEffect(() => {
    if (initialPreferences) {
      const hasChanged = JSON.stringify(notificationPreferences) !== JSON.stringify(initialPreferences);
      setNotificationHasChanges(hasChanged);
    }
  }, [notificationPreferences, initialPreferences]);

  const updateLocalPreference = (type: string, pipelineId: string, stageId: string, enabled: boolean) => {
    // Find pipeline and stage names
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const stage = pipeline?.stages?.find((s: { id: string }) => s.id === stageId);

    const newPreference = {
      pipelineId,
      pipelineName: pipeline?.name || "",
      stageId: type === "newLeadAssigned" ? "" : stageId, // Don't set stageId for newLeadAssigned
      stageName: type === "newLeadAssigned" ? "" : stage?.name || "", // Don't set stageName for newLeadAssigned
      enabled,
    };

    // Update the specific preference type, maintaining only one item in the array
    setNotificationPreferences((prev: any) => ({
      ...prev,
      [type]: [newPreference], // Always set as single item array
    }));
  };

  const toggleNotification = (type: string) => {
    const currentPreference = notificationPreferences[type][0];
    if (currentPreference) {
      // If we have a preference, toggle its enabled state
      updateLocalPreference(type, currentPreference.pipelineId, currentPreference.stageId, !currentPreference.enabled);
    } else {
      // If no preference exists, create a new one with enabled=true but no pipeline/stage
      setNotificationPreferences((prev: any) => ({
        ...prev,
        [type]: [
          {
            pipelineId: "",
            pipelineName: "",
            stageId: "",
            stageName: "",
            enabled: true,
          },
        ],
      }));
    }
  };

  const handleUpdateNotificationSettings = async () => {
    if (!user?.locationId) return;

    setIsUpdatingNotifications(true);
    try {
      const docRef = doc(db, "app-notifications", user.locationId);
      await updateDoc(docRef, {
        preferences: notificationPreferences,
        updatedAt: new Date(),
      });
      setInitialPreferences(notificationPreferences);
      setNotificationHasChanges(false);
      // Here you would add the workflow handling
    } catch (error) {
      console.error("Error updating notification settings:", error);
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user?.locationId) return;

    try {
      const docRef = doc(db, "app-notifications", user.locationId);
      const initialPrefs = {
        newCall: [],
        newSMS: [],
        leadStatusChange: [],
        newLeadAssigned: [],
      };

      await setDoc(docRef, {
        locationId: user.locationId,
        preferences: initialPrefs,
        updatedAt: new Date(),
      });

      setNotificationPreferences(initialPrefs);
      setInitialPreferences(initialPrefs);
      setHasNotificationDocument(true);
      setNotificationHasChanges(false);
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  // Fetch phone numbers when the tab becomes active
  useEffect(() => {
    if (activeTab === "phone-numbers" && user?.locationId) {
      fetchPhoneNumbers();
      fetchRegistrationStatus();
    }
  }, [activeTab, user?.locationId]);

  const fetchPhoneNumbers = async () => {
    try {
      setLoadingPhoneNumbers(true);
      const response = await fetch("/api/voicemail/phone-numbers");

      if (!response.ok) {
        throw new Error("Failed to fetch phone numbers");
      }

      const data = await response.json();
      if (data && Array.isArray(data.numbers)) {
        setPhoneNumbersData(data.numbers);
      } else {
        setPhoneNumbersData([]);
      }
    } catch (error: any) {
      setPhoneNumbersError(error.message);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    if (!user?.locationId) return;

    try {
      // In a real implementation, we would fetch the actual registration status
      // For now, we'll assume there's no registration in progress
      setRegistrationStatus(null);

      // The commented code below would be used if we wanted to show mock in-progress data
      /*
      setRegistrationStatus({
        steps: {
          customerProfile: { status: 'approved', message: 'Customer profile verified' },
          trustProduct: { status: 'approved', message: 'Trust product approved' },
          brandRegistration: { status: 'pending', message: 'Brand registration in progress' },
          messagingService: { status: 'pending', message: 'Messaging service setup pending' },
          campaign: { status: 'pending', message: 'Campaign registration pending' }
        }
      });
      */
    } catch (error) {
      console.error("Error fetching registration status:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const renderStatusStep = (title: string, step: { status: string; message: string }) => (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 last:border-b-0">
      <div className="mt-1">{getStatusIcon(step.status)}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{step.message}</p>
      </div>
    </div>
  );

  // Set initial date range for analytics
  useEffect(() => {
    if (activeTab === "analytics" && !startDate && !endDate) {
      // Set default date range to last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setStartDate(start);
      setEndDate(end);
    }
  }, [activeTab, startDate, endDate]);

  // Fetch analytics data when tab becomes active or date range changes
  useEffect(() => {
    if (activeTab === "analytics" && startDate && endDate) {
      fetchAnalytics();
    }
  }, [activeTab, startDate, endDate]);

  const fetchAnalytics = async () => {
    if (!user?.locationId || !startDate || !endDate) return;

    try {
      setLoadingAnalytics(true);
      const response = await fetch(`/api/reports/message-analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "";
    return `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/locations", { method: "GET" });

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data = await response.json();
        console.log(`[Location]: ${JSON.stringify(data)}`);
        setLocationData(data.data); // Set to data.data since response wraps everything in "data"
      } catch (error: any) {
        console.error("Error fetching location data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, []);

  // Fetch bulk actions when the bulk actions tab is active
  useEffect(() => {
    if (activeTab === "bulk-actions") {
      fetchBulkActions();
    }
  }, [activeTab]);

  const fetchBulkActions = async () => {
    try {
      setLoadingBulkActions(true);
      const response = await fetch("/api/bulk-actions/request/fetch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bulk actions");
      }

      const data = await response.json();
      setBulkActionsData(data.list || []);
    } catch (err: any) {
      setBulkActionsError(err.message);
    } finally {
      setLoadingBulkActions(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
    }, 500);
  };

  // Function to format field names (e.g., camelCase to Title Case)
  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Fields to exclude from display
  const excludedFields = ["id", "companyId", "settings", "social", "business", "dateAdded", "automaticMobileAppInvite"];

  // Separate account and business fields dynamically
  const renderFields = (data: any, isBusiness = false) => {
    if (!data) return null;

    const fields = Object.entries(data)
      .filter(([key]) => !excludedFields.includes(key))
      .map(([key, value]) => {
        // Skip if value is an object or null/empty
        if (typeof value === "object" || value === null || value === "") return null;

        return (
          <div key={key}>
            <h3 className="text-sm font-medium text-gray-700">{formatFieldName(key)}</h3>
            <p className="mt-1 text-gray-900">{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</p>
          </div>
        );
      })
      .filter(Boolean);

    return fields.length > 0 ? fields : <p className="text-gray-500">No {isBusiness ? "business" : "account"} data available</p>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredActions = bulkActionsData.filter((action) => filterStatus === "all" || action.status === filterStatus);

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Custom Nav */}
          <div className="mb-6 border-b border-[var(--nextprop-border)]">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {[
                { key: "account", label: "Account Information" },
                { key: "bulk-actions", label: "Bulk Actions" },
                { key: "notifications", label: "Notifications" },
                { key: "phone-numbers", label: "Phone Numbers" },
                { key: "analytics", label: "Analytics" },
                { key: "billing", label: "Billing" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0
                    ${
                      activeTab === tab.key
                        ? "border-[var(--nextprop-primary)] text-[var(--nextprop-primary)]"
                        : "border-transparent text-[var(--nextprop-text-secondary)] hover:text-[var(--nextprop-text-primary)] hover:border-[var(--nextprop-border)]"
                    }
                  `}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Account Information Tab */}
          <TabsContent value="account" className="nextprop-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

            <div className="flex items-start space-x-3 mb-6">
              <div className="h-12 w-12 bg-[#7c3aed] rounded-full flex items-center justify-center text-white">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {user?.name || (locationData && locationData.firstName && locationData.lastName)
                    ? (user?.name ?? `${locationData?.firstName} ${locationData?.lastName}`)
                    : "Loading..."}
                </p>
                <p className="text-gray-500">{(user?.email ?? locationData?.email) || "Loading..."}</p>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading account data...</p>
            ) : error ? (
              <p className="text-red-500">Error: {error}</p>
            ) : locationData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderFields(locationData)}</div>
            ) : (
              <p className="text-gray-500">No account data available</p>
            )}

            {/* Business Information */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              {loading ? (
                <p className="text-gray-500">Loading business data...</p>
              ) : error ? (
                <p className="text-red-500">Error: {error}</p>
              ) : locationData?.business ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderFields(locationData.business, true)}</div>
              ) : (
                <p className="text-gray-500">No business data available</p>
              )}
            </div>
          </TabsContent>

          {/* Bulk Actions Tab */}
          <TabsContent value="bulk-actions" className="nextprop-card">
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Bulk Actions History</h2>
                <p className="text-sm text-gray-500">View and manage your bulk operations history</p>
              </div>
              {/* Refresh */}
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  onClick={() => fetchBulkActions()}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Refresh
                </button>
              </div>
              {/* Filter */}
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <select
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="complete">Complete</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {loadingBulkActions && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading bulk actions...</p>
              </div>
            )}
            {bulkActionsError && (
              <div className="text-center py-10 text-red-600">
                <p>Error: {bulkActionsError}</p>
              </div>
            )}

            {!loadingBulkActions && !bulkActionsError && (
              <div className="bg-white shadow sm:rounded-lg mb-10">
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            Processed
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Completed On
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredActions.map((action) => (
                          <tr key={action.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-0">
                              <div className="line-clamp-8 break-words" title={action.title}>
                                {action.title}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(action.status)}`}
                              >
                                {action.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {action.processedCount}/{action.totalCount}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 break-words">
                              {action.processingCompletedOn
                                ? new Date(action.processingCompletedOn).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Not completed"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              <button
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                onClick={() => setSelectedRequestId(action.id)}
                              >
                                Stats
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Search Redfin Properties</h2>

              {/* Pipeline dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Pipeline Selector */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="border border-gray-200 rounded-md">
                    <select
                      value={selectedPipeline || ""}
                      onChange={(e) => setSelectedPipeline(e.target.value)}
                      disabled={isScraping}
                      className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {pipelines.length === 0 ? (
                        <option value="">Loading pipelines...</option>
                      ) : (
                        pipelines.map((pipeline) => (
                          <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                            {pipeline.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Select where contacts will be organized</p>
                </div>

                {/* Stage Selector */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="border border-gray-200 rounded-md">
                    <select
                      value={selectedStage || ""}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      disabled={isScraping || !selectedPipeline}
                      className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {!selectedPipeline ? (
                        <option value="">Select pipeline first</option>
                      ) : (
                        pipelines
                          .find((p) => p.id === selectedPipeline)
                          ?.stages?.map((stage: { id: string; name: string }) => (
                            <option key={stage.id} value={stage.id} className="text-gray-700">
                              {stage.name}
                            </option>
                          ))
                      )}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Choose the stage for new contacts</p>
                </div>
              </div>

              <SearchBarProperties
                link={link}
                setLink={setLink}
                priceMin={priceMin}
                setPriceMin={setPriceMin}
                priceMax={priceMax}
                setPriceMax={setPriceMax}
                daysOnZillow={daysOnZillow}
                setDaysOnZillow={setDaysOnZillow}
                isScraping={isScraping}
                handleScrapeProperties={handleScrapeProperties}
                dailyLimit={DAILY_LIMIT}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                types={types}
                setTypes={setTypes}
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
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="nextprop-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <div className="flex items-center gap-4">
                  {!loadingNotifications && !hasNotificationDocument && (
                    <button
                      onClick={handleEnableNotifications}
                      className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] transition-colors"
                    >
                      Enable Notifications
                    </button>
                  )}
                  {!loadingNotifications && hasNotificationDocument && (
                    <button
                      onClick={handleUpdateNotificationSettings}
                      disabled={!notificationHasChanges || isUpdatingNotifications}
                      className={classNames(
                        "px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2",
                        notificationHasChanges && !isUpdatingNotifications
                          ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9] cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {isUpdatingNotifications ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Updating...
                        </>
                      ) : (
                        "Update Settings"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {loadingNotifications ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]"></div>
                </div>
              ) : !hasNotificationDocument ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-600 mb-4">Notifications are currently disabled</p>
                  <button
                    onClick={handleEnableNotifications}
                    className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] transition-colors"
                  >
                    Enable Notifications
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* New SMS from lead */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">New SMS from lead</span>
                        <button
                          onClick={() => toggleNotification("newSMS")}
                          disabled={!hasNotificationDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            notificationPreferences.newSMS[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasNotificationDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              notificationPreferences.newSMS[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline and Stage Selectors */}
                    <div
                      className={classNames(
                        "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200",
                        notificationPreferences.newSMS[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Pipeline Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={notificationPreferences.newSMS[0]?.pipelineId || ""}
                            onChange={(e) => {
                              const pipelineId = e.target.value;
                              if (pipelineId) {
                                updateLocalPreference("newSMS", pipelineId, "", true);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Pipeline</option>
                            {pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Stage Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={notificationPreferences.newSMS[0]?.stageId || ""}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              const pipelineId = notificationPreferences.newSMS[0]?.pipelineId;
                              if (pipelineId && stageId) {
                                updateLocalPreference("newSMS", pipelineId, stageId, true);
                              }
                            }}
                            disabled={!notificationPreferences.newSMS[0]?.pipelineId}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Stage</option>
                            {pipelines
                              .find((p) => p.id === notificationPreferences.newSMS[0]?.pipelineId)
                              ?.stages?.map((stage: any) => (
                                <option key={stage.id} value={stage.id} className="text-gray-700">
                                  {stage.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead status change */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">Lead status change</span>
                        <button
                          onClick={() => toggleNotification("leadStatusChange")}
                          disabled={!hasNotificationDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            notificationPreferences.leadStatusChange[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasNotificationDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              notificationPreferences.leadStatusChange[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline and Stage Selectors */}
                    <div
                      className={classNames(
                        "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-200",
                        notificationPreferences.leadStatusChange[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Pipeline Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={notificationPreferences.leadStatusChange[0]?.pipelineId || ""}
                            onChange={(e) => {
                              const pipelineId = e.target.value;
                              if (pipelineId) {
                                updateLocalPreference("leadStatusChange", pipelineId, "", true);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Pipeline</option>
                            {pipelines.map((pipeline) => (
                              <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                                {pipeline.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Stage Selector */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Stage</h3>
                        </div>
                        <div className="border border-gray-200 rounded-md">
                          <select
                            value={notificationPreferences.leadStatusChange[0]?.stageId || ""}
                            onChange={(e) => {
                              const stageId = e.target.value;
                              const pipelineId = notificationPreferences.leadStatusChange[0]?.pipelineId;
                              if (pipelineId && stageId) {
                                updateLocalPreference("leadStatusChange", pipelineId, stageId, true);
                              }
                            }}
                            disabled={!notificationPreferences.leadStatusChange[0]?.pipelineId}
                            className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Stage</option>
                            {pipelines
                              .find((p) => p.id === notificationPreferences.leadStatusChange[0]?.pipelineId)
                              ?.stages?.map((stage: any) => (
                                <option key={stage.id} value={stage.id} className="text-gray-700">
                                  {stage.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New lead assigned */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">New lead assigned</span>
                        <button
                          onClick={() => toggleNotification("newLeadAssigned")}
                          disabled={!hasNotificationDocument}
                          className={classNames(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2",
                            notificationPreferences.newLeadAssigned[0]?.enabled ? "bg-[#7c3aed]" : "bg-gray-200",
                            !hasNotificationDocument && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={classNames(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              notificationPreferences.newLeadAssigned[0]?.enabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Pipeline Selector Only */}
                    <div
                      className={classNames(
                        "bg-gray-50 p-4 rounded-lg shadow-sm transition-opacity duration-200",
                        notificationPreferences.newLeadAssigned[0]?.enabled ? "opacity-100" : "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Pipeline</h3>
                      </div>
                      <div className="border border-gray-200 rounded-md">
                        <select
                          value={notificationPreferences.newLeadAssigned[0]?.pipelineId || ""}
                          onChange={(e) => {
                            const pipelineId = e.target.value;
                            if (pipelineId) {
                              updateLocalPreference("newLeadAssigned", pipelineId, "", true);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Select Pipeline</option>
                          {pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.id} className="text-gray-700">
                              {pipeline.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Phone Numbers Tab */}
          <TabsContent value="phone-numbers">
            <div className="nextprop-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Phone Numbers</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Phone Numbers List */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Your Active Phone Numbers</h3>
                    </div>

                    {loadingPhoneNumbers ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]"></div>
                      </div>
                    ) : phoneNumbersError ? (
                      <div className="p-4 text-red-500">Error: {phoneNumbersError}</div>
                    ) : phoneNumbersData.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 mb-4">You don't have any phone numbers yet</p>
                        <button className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9]">Add New Number</button>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Capabilities
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {phoneNumbersData.map((number, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {number.phoneNumber || number.sid}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {number.capabilities ? (
                                    <div className="flex space-x-2">
                                      {number.capabilities.sms && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">SMS</span>
                                      )}
                                      {number.capabilities.voice && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">Voice</span>
                                      )}
                                      {number.capabilities.mms && (
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs">MMS</span>
                                      )}
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Status */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">10DLC Registration</h3>
                    </div>

                    {registrationStatus ? (
                      <div className="p-4 space-y-1">
                        {registrationStatus.steps && (
                          <>
                            {renderStatusStep("Customer Profile", registrationStatus.steps.customerProfile)}
                            {renderStatusStep("Trust Product", registrationStatus.steps.trustProduct)}
                            {renderStatusStep("Brand Registration", registrationStatus.steps.brandRegistration)}
                            {renderStatusStep("Messaging Service", registrationStatus.steps.messagingService)}
                            {renderStatusStep("Campaign", registrationStatus.steps.campaign)}
                          </>
                        )}

                        <div className="pt-4 mt-4 border-t border-gray-200">
                          <a
                            href="/phone-numbers"
                            className="px-4 py-2 text-sm bg-[#7c3aed] text-white rounded hover:bg-[#6d28d9] inline-block"
                          >
                            Manage Registration
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <div className="mb-4">
                          <UserIcon className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                          <p className="text-gray-700 font-medium">10DLC Registration Required</p>
                          <p className="text-gray-500 text-sm mt-2 mb-4">
                            North American Telecom Operators require registration for 10-digit long code messaging. Registration ensures
                            better deliverability and throughput for your SMS campaigns.
                          </p>
                        </div>
                        <a href="/phone-numbers" className="px-4 py-2 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] inline-block">
                          Start Registration
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="nextprop-card">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-semibold text-gray-900">Messaging Analytics</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 flex items-center">
                    <span className="text-sm text-gray-600">{formatDateRange(startDate, endDate)}</span>
                  </div>
                </div>
              </div>

              {loadingAnalytics ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
                </div>
              ) : !user ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Please log in to view analytics</p>
                </div>
              ) : !user.locationId ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No location ID found. Please contact support to set up your location.</p>
                </div>
              ) : !startDate || !endDate ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Please select a date range to view analytics</p>
                </div>
              ) : analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-full bg-green-50">
                          <PaperAirplaneIcon className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline">
                          <h3 className="text-4xl font-semibold text-gray-700">{analyticsData?.results?.sent?.value || 0}</h3>
                          <span className="ml-2 text-sm text-green-600">
                            {calculatePercentage(analyticsData?.results?.sent?.value || 0, analyticsData?.total || 0)}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Sent</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-full bg-green-50">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline">
                          <h3 className="text-4xl font-semibold text-gray-700">{analyticsData?.results?.delivered?.value || 0}</h3>
                          <span className="ml-2 text-sm text-green-600">
                            {calculatePercentage(analyticsData?.results?.delivered?.value || 0, analyticsData?.total || 0)}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Delivered</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-full bg-red-50">
                          <XCircleIcon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline">
                          <h3 className="text-4xl font-semibold text-gray-700">{analyticsData?.results?.failed?.value || 0}</h3>
                          <span className="ml-2 text-sm text-red-600">
                            {calculatePercentage(analyticsData?.results?.failed?.value || 0, analyticsData?.total || 0)}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Failed</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load analytics data</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <a
                  href="/analytics"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Detailed Analytics
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              "Logging out..."
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Log out
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Popup */}
      {selectedRequestId && <StatsPopup requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />}
    </DashboardLayout>
  );
}
