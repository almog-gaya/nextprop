"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PipelineStagesView from '@/components/pipelines/distressed-homeowners/PipelineStagesView';
import TaskManagementView from '@/components/pipelines/distressed-homeowners/TaskManagementView';
import DashboardMetricsView from '@/components/pipelines/distressed-homeowners/DashboardMetricsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BellAlertIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Sample data for quick stats visualization
const pipelineData = {
  labels: ['Voicemail', 'Call Back', 'SMS Back', 'Motivation', 'Engagement', 'Meeting', 'Contract', 'Closed'],
  datasets: [
    {
      label: 'Number of Contacts',
      data: [42, 18, 24, 42, 27, 15, 8, 3],
      backgroundColor: 'rgba(123, 104, 238, 0.6)',
      borderColor: 'rgba(123, 104, 238, 1)',
      borderWidth: 1,
    }
  ],
};

// Sample data for response rate visualization
const responseRateData = {
  labels: ['Voicemails', 'Responses', 'No Response'],
  datasets: [
    {
      data: [248, 84, 164],
      backgroundColor: [
        'rgba(123, 104, 238, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(210, 210, 210, 0.8)',
      ],
      borderColor: [
        'rgba(123, 104, 238, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(180, 180, 180, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

// Sample data for contact list depletion trend
const depletionTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Remaining Contacts',
      data: [500, 425, 340, 252, 150, 0],
      borderColor: 'rgba(123, 104, 238, 1)',
      backgroundColor: 'rgba(123, 104, 238, 0.2)',
      fill: true,
      tension: 0.4,
    },
  ],
};

export default function DistressedHomeownersDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <DashboardLayout title="Distressed Homeowners Pipeline">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distressed Homeowners Pipeline</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track the pipeline for distressed homeowner engagement
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview" className="px-5 py-2">Overview</TabsTrigger>
          <TabsTrigger value="pipeline" className="px-5 py-2">Pipeline Stages</TabsTrigger>
          <TabsTrigger value="tasks" className="px-5 py-2">Task Management</TabsTrigger>
          <TabsTrigger value="metrics" className="px-5 py-2">Dashboard Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-indigo-700">Active Contacts</p>
                    <p className="text-3xl font-bold mt-1">248</p>
                    <p className="text-sm text-slate-500 mt-1">49.6% of total list</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <UserGroupIcon className="w-6 h-6 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-50 to-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-violet-700">Leads (Motivation)</p>
                    <p className="text-3xl font-bold mt-1">42</p>
                    <p className="text-sm text-slate-500 mt-1">16.9% conversion rate</p>
                  </div>
                  <div className="p-3 bg-violet-100 rounded-full">
                    <BellAlertIcon className="w-6 h-6 text-violet-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-50 to-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-pink-700">Response Rate</p>
                    <p className="text-3xl font-bold mt-1">33.9%</p>
                    <p className="text-sm text-slate-500 mt-1">84 responses received</p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-full">
                    <PhoneIcon className="w-6 h-6 text-pink-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Closed Deals</p>
                    <p className="text-3xl font-bold mt-1">3</p>
                    <p className="text-sm text-slate-500 mt-1">$547,000 total value</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Pipeline Flow Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Flow</CardTitle>
              <CardDescription>Contact distribution across key pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar 
                  data={pipelineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="grid grid-cols-4 gap-2 w-full">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Initial Contact</p>
                  <p className="text-xl font-bold text-indigo-700">84</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Engaged</p>
                  <p className="text-xl font-bold text-violet-700">69</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Negotiation</p>
                  <p className="text-xl font-bold text-pink-700">22</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Closing</p>
                  <p className="text-xl font-bold text-emerald-700">11</p>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          {/* Two Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Response Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Distribution</CardTitle>
                <CardDescription>Voicemail campaign response analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex justify-center">
                  <Doughnut 
                    data={responseRateData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Sent</p>
                    <p className="text-lg font-semibold">248</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Responded</p>
                    <p className="text-lg font-semibold text-emerald-600">84</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Rate</p>
                    <p className="text-lg font-semibold text-indigo-600">33.9%</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            {/* Contact List Depletion */}
            <Card>
              <CardHeader>
                <CardTitle>Contact List Depletion</CardTitle>
                <CardDescription>Estimated depletion trend and forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line 
                    data={depletionTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex justify-between w-full text-sm">
                  <div>
                    <span className="font-medium">Current:</span> 252 contacts
                  </div>
                  <div>
                    <span className="font-medium">Depletion:</span> ~April 15, 2024
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span> 85/month
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Action Items and Critical Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Priority Tasks */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Priority Tasks</CardTitle>
                <CardDescription>Tasks requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="flex items-center p-4 hover:bg-slate-50">
                    <div className="p-2 bg-red-100 rounded-full mr-4">
                      <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Client review for Robert Williams contract</p>
                      <p className="text-sm text-slate-500">Contract terms need client approval</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Overdue</span>
                      <p className="text-sm text-slate-500 mt-1">Mar 16, 2023</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 hover:bg-slate-50">
                    <div className="p-2 bg-amber-100 rounded-full mr-4">
                      <PhoneIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Call back Sarah Johnson</p>
                      <p className="text-sm text-slate-500">Missed call at 3:45 PM</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Medium</span>
                      <p className="text-sm text-slate-500 mt-1">Mar 17, 2023</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 hover:bg-slate-50">
                    <div className="p-2 bg-indigo-100 rounded-full mr-4">
                      <EnvelopeIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Respond to John Smith SMS</p>
                      <p className="text-sm text-slate-500">Client asked about the selling process</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">High</span>
                      <p className="text-sm text-slate-500 mt-1">Mar 18, 2023</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t p-4">
                <button className="text-indigo-600 text-sm font-medium hover:underline">
                  View all tasks
                </button>
              </CardFooter>
            </Card>
            
            {/* Right Column: Upload Contacts/Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Actions Needed</CardTitle>
                <CardDescription>System recommendations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="p-4 hover:bg-slate-50">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-orange-100 rounded-full mr-3">
                        <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="font-medium">Upload New Contact List</p>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Current list depletion at 50.4%. Recommended to upload new contacts before April 1st.</p>
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors">
                      Upload Contacts
                    </button>
                  </div>
                  
                  <div className="p-4 hover:bg-slate-50">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="font-medium">Schedule Follow-up Calls</p>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">5 leads in the Motivation stage waiting for follow-up calls.</p>
                    <button className="w-full px-4 py-2 bg-white border border-slate-300 rounded-md text-sm hover:bg-slate-50 transition-colors">
                      Schedule Calls
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pipeline">
          <PipelineStagesView />
        </TabsContent>
        
        <TabsContent value="tasks">
          <TaskManagementView />
        </TabsContent>
        
        <TabsContent value="metrics">
          <DashboardMetricsView />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
} 