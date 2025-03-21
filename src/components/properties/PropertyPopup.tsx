
import { ZillowProperty } from "@/types/properties";
import React from "react";

interface PropertyPopupProps {
  selectedProperty: ZillowProperty | null;
  closePopup: () => void;
}

export default function PropertyPopup({ selectedProperty, closePopup }: PropertyPopupProps) {
  if (!selectedProperty) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Property Details</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Address:</strong> {selectedProperty.streetAddress || "N/A"}, {selectedProperty.city || "N/A"}, {selectedProperty.state || "N/A"} {selectedProperty.zipcode || ""}</p>
          <p><strong>Price:</strong> {selectedProperty.price || "N/A"}</p>
          <p><strong>Zestimate:</strong> {selectedProperty.zestimate || "N/A"}</p>
          <p><strong>Home Type:</strong> {selectedProperty.homeType || "N/A"}</p>
          <p><strong>Bedrooms:</strong> {selectedProperty.bedrooms || "N/A"}</p>
          <p><strong>Bathrooms:</strong> {selectedProperty.bathrooms || "N/A"}</p>
          <p><strong>Agent Name:</strong> {selectedProperty.agentName || "N/A"}</p>
          <p><strong>Agent Phone:</strong> {selectedProperty.agentPhoneNumber || "N/A"}</p>
          <p><strong>Agent Email:</strong> {selectedProperty.agentEmail || "N/A"}</p>
          <p><strong>Broker Name:</strong> {selectedProperty.brokerName || "N/A"}</p>
          <p><strong>Broker Phone:</strong> {selectedProperty.brokerPhoneNumber || "N/A"}</p>
          <p><strong>Broker Email:</strong> {selectedProperty.brokerEmail || "N/A"}</p>
          <p>
            <strong>Listing SubType:</strong>{" "}
            {selectedProperty.listingSubType
              ? typeof selectedProperty.listingSubType === "string"
                ? selectedProperty.listingSubType
                : Object.entries(selectedProperty.listingSubType)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => key.replace("is", ""))
                    .join(", ") || "None"
              : "N/A"}
          </p>
          <p><strong>Time on Zillow:</strong> {selectedProperty.timeOnZillow || "N/A"}</p>
          <p><strong>Description:</strong> {selectedProperty.description || "N/A"}</p>
          <p><strong>URL:</strong> {selectedProperty.url ? <a href={selectedProperty.url} className="text-purple-600 hover:underline">{selectedProperty.url}</a> : "N/A"}</p>
        </div>
        <div className="mt-6 flex justify-between">
          {selectedProperty.url && (
            <button
              onClick={() => window.open(selectedProperty.url, "_blank")}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-800"
            >
              View on Website
            </button>
          )}
          <button
            onClick={closePopup}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}