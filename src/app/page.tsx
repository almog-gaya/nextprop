'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RealEstateWidget from '@/components/RealEstateWidget';
import { 
  UserGroupIcon, 
  HomeModernIcon, 
  PhoneIcon, 
  ArrowUpIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

// TypeScript interface for KPI Card props
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  colorClass: string;
}

export default function DashboardPage() {
  // Simple KPI Card component
  const KpiCard = ({ title, value, icon, change, colorClass }: KpiCardProps) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClass} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-xl font-bold">{value}</p>
            {change && (
              <span className="ml-2 text-xs font-medium flex items-center text-green-600">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboard">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-6">Real Estate Dashboard</h2>
      
        {/* KPI Cards focusing on contacts rather than revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KpiCard 
            title="Total Contacts" 
            value="427" 
            change="+22%" 
            icon={<UserGroupIcon className="h-6 w-6" />}
            colorClass="bg-blue-100 text-blue-600"
          />
          <KpiCard 
            title="New Leads" 
            value="54" 
            change="+12%" 
            icon={<UserGroupIcon className="h-6 w-6" />}
            colorClass="bg-green-100 text-green-600"
          />
          <KpiCard 
            title="Active Properties" 
            value="142" 
            change="+5%" 
            icon={<HomeModernIcon className="h-6 w-6" />}
            colorClass="bg-purple-100 text-purple-600"
          />
          <KpiCard 
            title="Contact Rate" 
            value="68%" 
            change="+7%" 
            icon={<PhoneIcon className="h-6 w-6" />}
            colorClass="bg-yellow-100 text-yellow-600"
          />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main content - spans 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real Estate Widget */}
            <div className="bg-white rounded-lg shadow">
              <RealEstateWidget />
            </div>
          
            {/* Recent Contacts - Simple version */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Contacts</h3>
              <div className="divide-y">
                {[
                  { name: 'John Smith', email: 'john.smith@example.com', status: 'New' },
                  { name: 'Sarah Johnson', email: 'sarah.j@example.com', status: 'Active' },
                  { name: 'Michael Brown', email: 'michael.b@example.com', status: 'New' },
                  { name: 'Emma Davis', email: 'emma.d@example.com', status: 'Active' },
                  { name: 'Robert Miller', email: 'robert.m@example.com', status: 'New' }
                ].map((contact, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contact.status === 'New' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>{contact.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        
          {/* Sidebar content */}
          <div className="space-y-6">
            {/* Lead Summary - Simple version */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Lead Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">New Leads</p>
                  <p className="text-2xl font-bold">54</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold">18.5%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Response Time</p>
                  <p className="text-2xl font-bold">2.3 hrs</p>
                </div>
              </div>
            </div>
          
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-gray-900">Recent Contact Activity</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Last 7 days of contact interactions</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  {[
                    { name: 'Sarah Johnson', type: 'Call', date: 'Today', status: 'Completed', notes: 'Interested in waterfront property' },
                    { name: 'Michael Brown', type: 'Email', date: 'Yesterday', status: 'Replied', notes: 'Requested virtual tour' },
                    { name: 'Emma Davis', type: 'Meeting', date: '2 days ago', status: 'Completed', notes: 'Property visit scheduled' },
                    { name: 'Robert Miller', type: 'Call', date: '3 days ago', status: 'Missed', notes: 'Will follow up tomorrow' },
                    { name: 'David Wilson', type: 'Email', date: '5 days ago', status: 'Pending', notes: 'Sent listing details' }
                  ].map((activity, index) => (
                    <div key={index} className="px-4 py-3 sm:px-6">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-900">{activity.name}</dt>
                        <dd className="text-sm text-gray-500">{activity.date}</dd>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <dd className="text-sm text-gray-900 flex items-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            activity.type === 'Call' 
                              ? 'bg-blue-100 text-blue-800' 
                              : activity.type === 'Email' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                          } mr-2`}>
                            {activity.type}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            activity.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : activity.status === 'Missed'
                                ? 'bg-red-100 text-red-800'
                                : activity.status === 'Replied'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        </dd>
                      </div>
                      <div className="mt-1">
                        <dd className="text-xs text-gray-500">{activity.notes}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
