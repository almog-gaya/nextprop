import { ZillowProperty } from "@/types/properties";
import React from "react";

interface PropertyTableProps {
  scrapedProperties: ZillowProperty[];
  handleRowClick: (property: ZillowProperty) => void;
}

export default function PropertyTable({ scrapedProperties, handleRowClick }: PropertyTableProps) {
  if (scrapedProperties.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Scraped Properties</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scrapedProperties.map((property, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(property)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {property.streetAddress || "N/A"}, {property.city || "N/A"}, {property.state || "N/A"} {property.zipcode || ""}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.price || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.homeType || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.agentName || property.brokerName || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.agentPhoneNumber || property.brokerPhoneNumber || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}