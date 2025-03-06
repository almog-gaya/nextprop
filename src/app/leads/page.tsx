'use client';

import React, { useState, useEffect } from 'react';
import { UserPlusIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import { LeadsPageSkeleton } from '@/components/SkeletonLoaders';

// Mock leads data
const mockLeads = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(305) 555-1234',
    property: '123 Ocean Drive, Miami FL',
    price: '$845,000',
    status: 'New',
    date: '2023-09-15'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    email: 'maria.r@example.com',
    phone: '(305) 555-5678',
    property: '456 Palm Avenue, Miami Beach FL',
    price: '$1,200,000',
    status: 'Contacted',
    date: '2023-09-14'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.j@example.com',
    phone: '(305) 555-9012',
    property: '789 Biscayne Blvd, Miami FL',
    price: '$650,000',
    status: 'New',
    date: '2023-09-13'
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah.w@example.com',
    phone: '(305) 555-3456',
    property: '321 Collins Ave, Miami Beach FL',
    price: '$925,000',
    status: 'Qualified',
    date: '2023-09-12'
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    phone: '(305) 555-7890',
    property: '555 NE 15th St, Miami FL',
    price: '$780,000',
    status: 'Contacted',
    date: '2023-09-11'
  }
];

// Function to get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'New':
      return 'bg-blue-100 text-blue-800';
    case 'Contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'Qualified':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<typeof mockLeads>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate API call to fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLeads(mockLeads);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Leads">
        <LeadsPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Real Estate Leads</h1>
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Lead
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-500">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.property}</div>
                      <div className="text-sm font-medium text-gray-900">{lead.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-purple-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-purple-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 