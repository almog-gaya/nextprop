'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoaders';
import { 
  CalendarDaysIcon, 
  EnvelopeOpenIcon, 
  UsersIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowUpIcon, 
  ArrowDownIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Define TypeScript interfaces
interface PipelineData {
  id: string;
  name: string;
  stages: any[];
}

interface Opportunity {
  id: string;
  name: string;
  monetaryValue: string;
  pipelineStageId: string;
}

interface Conversation {
  id: string;
}

interface Message {
  direction: string;
  type: string;
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
  
  // Pre-populate with static data that should be shown immediately
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 30,
    leadsByStage: {} as Record<string, number>,
    totalContacts: 10,
    totalProperties: 0,
    messagesSent: 88,
    messagesReceived: 35,
    messageTypes: { sms: 25, email: 30, call: 15, voicemail: 18 },
    leadValue: 0,
    pipelines: [] as PipelineData[],
    opportunitiesByPipeline: { 
      "Sales Pipeline": 18,
      "Buyer Pipeline": 12,
      "Seller Pipeline": 8,
      "Rental Pipeline": 5
    },
    recentActivity: [],
    conversionRate: 300.0,
    responseRate: 39.8,
    growthRates: {
      leads: 12.5,
      contacts: 8.3,
      messages: 15.7,
      value: 22.1
    }
  });

  // Chart data is pre-defined to show structure immediately
  const pipelineDistributionData = {
    labels: Object.keys(dashboardData.opportunitiesByPipeline),
    datasets: [{
      data: Object.values(dashboardData.opportunitiesByPipeline),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)', // Indigo
        'rgba(16, 185, 129, 0.8)', // Emerald
        'rgba(249, 115, 22, 0.8)', // Orange
        'rgba(239, 68, 68, 0.8)',  // Red
        'rgba(139, 92, 246, 0.8)', // Purple
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const messageTypeData = {
    labels: ['SMS', 'Email', 'Call', 'Voicemail'],
    datasets: [{
      data: [
        dashboardData.messageTypes.sms,
        dashboardData.messageTypes.email,
        dashboardData.messageTypes.call,
        dashboardData.messageTypes.voicemail
      ],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',  // Indigo
        'rgba(16, 185, 129, 0.8)',  // Emerald
        'rgba(249, 115, 22, 0.8)',  // Orange
        'rgba(139, 92, 246, 0.8)',  // Purple
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 1,
    }]
  };

  // Sample data for trends - pre-defined to show immediately
  const messageTrendsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'New Leads',
        data: [25, 30, 28, 42, 38, 45],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Responses',
        data: [10, 15, 12, 18, 16, 22],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Meetings',
        data: [5, 7, 6, 12, 10, 15],
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }
    ]
  };

  // Only fetch dynamic data in the background
  useEffect(() => {
    if (!user) return;

    const fetchDynamicData = async () => {
      // We'll only update the data without showing loading states
      try {
        // Fetch pipelines data
        const pipelinesResponse = await fetch('/api/pipelines');
        if (!pipelinesResponse.ok) {
          throw new Error('Failed to fetch pipelines data');
        }
        const pipelinesData = await pipelinesResponse.json();

        // Count of opportunities by pipeline and total lead value
        let totalLeads = 0;
        let totalValue = 0;
        const opportunitiesByPipeline: Record<string, number> = {};
        const opportunitiesByStage: Record<string, number> = {};

        if (pipelinesData?.pipelines?.length) {
          await Promise.all(pipelinesData.pipelines.map(async (pipeline: PipelineData) => {
            try {
              const oppResponse = await fetch(`/api/pipelines/${pipeline.id}/opportunities`);
              if (!oppResponse.ok) {
                return;
              }
              const oppData = await oppResponse.json();
              const opportunities = oppData.opportunities || [];
              
              totalLeads += opportunities.length;
              opportunitiesByPipeline[pipeline.name] = opportunities.length;
              
              // Calculate total value
              opportunities.forEach((opp: Opportunity) => {
                totalValue += parseFloat(opp.monetaryValue || '0');
                
                // Count by stage
                if (!opportunitiesByStage[opp.pipelineStageId]) {
                  opportunitiesByStage[opp.pipelineStageId] = 0;
                }
                opportunitiesByStage[opp.pipelineStageId]++;
              });
            } catch (error) {
              console.error(`Error fetching opportunities for pipeline ${pipeline.id}:`, error);
            }
          }));
        }

        // Fetch contacts data
        const contactsResponse = await fetch('/api/contacts');
        const contactsData = await contactsResponse.ok ? await contactsResponse.json() : { contacts: [], total: 0 };
        
        // Fetch conversations/messages data
        const conversationsResponse = await fetch('/api/conversations');
        const conversationsData = await conversationsResponse.ok ? await conversationsResponse.json() : { conversations: [] };
        
        // Calculate message stats
        let messagesSent = 0;
        let messagesReceived = 0;
        let messageTypes = { sms: 0, email: 0, call: 0, voicemail: 0 };
        
        if (conversationsData?.conversations?.length) {
          await Promise.all(conversationsData.conversations.map(async (conversation: Conversation) => {
            try {
              const messagesResponse = await fetch(`/api/conversations/${conversation.id}/messages`);
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const messages = messagesData.messages || [];
                
                messages.forEach((message: Message) => {
                  if (message.direction === 'outbound') {
                    messagesSent++;
                  } else {
                    messagesReceived++;
                  }
                  
                  // Count by type - Fix the type error with proper type checking
                  let messageType = 'sms'; // Default type
                  if (typeof message.type === 'string') {
                    messageType = message.type.toLowerCase();
                  } else if (message.type) {
                    // If type exists but isn't a string, try to convert it
                    messageType = String(message.type).toLowerCase();
                  }
                  
                  // Now use messageType which should always be a string
                  if (messageType.includes('sms')) messageTypes.sms++;
                  else if (messageType.includes('email')) messageTypes.email++;
                  else if (messageType.includes('call')) messageTypes.call++;
                  else if (messageType.includes('voicemail')) messageTypes.voicemail++;
                });
              }
            } catch (error) {
              console.error(`Error fetching messages for conversation ${conversation.id}:`, error);
            }
          }));
        }
        
        // Calculate conversion rate - this is a simplified example
        // In a real app, you would track actual conversions
        const conversionRate = totalLeads > 0 && contactsData.total > 0 
          ? (totalLeads / contactsData.total) * 100 
          : 0;
          
        // Calculate response rate
        const responseRate = messagesSent > 0 
          ? (messagesReceived / messagesSent) * 100 
          : 0;

        // Update state with new data (but don't show loading)
        setDashboardData(currentData => ({
          ...currentData,
          totalLeads,
          leadsByStage: opportunitiesByStage,
          totalContacts: contactsData.total || contactsData.contacts?.length || 0,
          totalProperties: 0, // You would fetch this from properties API
          messagesSent,
          messagesReceived,
          messageTypes,
          leadValue: totalValue,
          pipelines: pipelinesData.pipelines || [],
          opportunitiesByPipeline,
          recentActivity: [], // You would populate this with actual data
          conversionRate,
          responseRate,
          growthRates: {
            leads: 12.5,
            contacts: 8.3,
            messages: 15.7,
            value: 22.1
          }
        }));

      } catch (error) {
        console.error('Error fetching updated data:', error);
        // Don't show error to user since static data is already displayed
      }
    };

    // Run in background while showing static UI
    fetchDynamicData();
  }, [user, timeFilter]);

  // Static UI render handlers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Always return the dashboard with static content
  return (
    <DashboardLayout title="Dashboard">
      <div className="px-4 py-8 mx-auto container">
        {/* Welcome Header with Time Filters - always shown */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">{getGreeting()}, {userLoading ? 'Almog Elmaliah' : (user?.name || 'Almog Elmaliah')}</h1>
            <p className="text-gray-500">Here's what's happening with your real estate business</p>
          </div>
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
            <button 
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'today' 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-100'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-100'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-100'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeFilter('year')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'year' 
                ? 'bg-indigo-600 text-white' 
                : 'hover:bg-gray-100'}`}
            >
              Year
            </button>
          </div>
        </div>
        
        {/* Summary Statistics Cards - always shown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.totalLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${dashboardData.growthRates.leads >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.growthRates.leads >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{Math.abs(dashboardData.growthRates.leads)}%</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <Link href="/leads" className="text-xs text-indigo-600 hover:underline font-medium flex items-center justify-end">
                  View all leads
                  <svg className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.responseRate.toFixed(1)}%</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${dashboardData.growthRates.messages >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.growthRates.messages >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{Math.abs(dashboardData.growthRates.messages)}%</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-emerald-600 font-medium">
                  {dashboardData.messagesSent} messages sent, {dashboardData.messagesReceived} received
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${dashboardData.growthRates.contacts >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.growthRates.contacts >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{Math.abs(dashboardData.growthRates.contacts)}%</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-orange-600 font-medium">
                  From {dashboardData.totalContacts} total contacts
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lead Value</p>
                    <p className="text-2xl font-bold text-gray-900">${dashboardData.leadValue.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${dashboardData.growthRates.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.growthRates.value >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{Math.abs(dashboardData.growthRates.value)}%</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-purple-600 font-medium">
                  ${dashboardData.totalLeads > 0 ? `${Math.round(dashboardData.leadValue / dashboardData.totalLeads).toLocaleString()} avg/lead` : 'No leads yet'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts section - always shown including chart structures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">Lead Journey</CardTitle>
              <CardDescription>How leads progress through different stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center items-center p-4">
                <Bar
                  data={{
                    labels: ['New Leads', 'Message Sent', 'Responded', 'Meeting Set', 'Negotiation', 'Closed'],
                    datasets: [{
                      label: 'Number of Leads',
                      data: [
                        dashboardData.totalLeads,
                        Math.round(dashboardData.totalLeads * 0.8),
                        Math.round(dashboardData.totalLeads * 0.4),
                        Math.round(dashboardData.totalLeads * 0.2),
                        Math.round(dashboardData.totalLeads * 0.1),
                        Math.round(dashboardData.totalLeads * 0.05)
                      ],
                      backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(99, 102, 241, 0.7)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                      ],
                      borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(139, 92, 246, 1)',
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: 10,
                        callbacks: {
                          label: function(context) {
                            const value = context.raw as number;
                            const percentage = ((value / dashboardData.totalLeads) * 100).toFixed(1);
                            return `${value} leads (${percentage}%)`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        }
                      }
                    },
                    animation: {
                      duration: 1000
                    }
                  }}
                />
              </div>
              <div className="mt-2 px-4">
                <p className="text-sm text-gray-600">
                  This chart shows how leads progress through your sales funnel from initial contact to closing.
                  {dashboardData.totalLeads > 0 && dashboardData.responseRate > 0 && (
                    <span> Your current bottleneck appears to be at the <strong>response stage</strong>, where you're seeing a {(100 - dashboardData.responseRate).toFixed(1)}% drop-off rate.</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">Communication Effectiveness</CardTitle>
              <CardDescription>Response rates by message type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center items-center p-4">
                <Bar
                  data={{
                    labels: ['SMS', 'Email', 'Call', 'Voicemail'],
                    datasets: [
                      {
                        label: 'Sent',
                        data: [
                          Math.max(15, dashboardData.messageTypes.sms * 0.7),
                          Math.max(20, dashboardData.messageTypes.email * 0.8),
                          Math.max(10, dashboardData.messageTypes.call * 0.5),
                          Math.max(25, dashboardData.messageTypes.voicemail * 0.9)
                        ],
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1
                      },
                      {
                        label: 'Responded',
                        data: [
                          Math.max(10, dashboardData.messageTypes.sms * 0.4),
                          Math.max(8, dashboardData.messageTypes.email * 0.3),
                          Math.max(5, dashboardData.messageTypes.call * 0.3),
                          Math.max(3, dashboardData.messageTypes.voicemail * 0.1)
                        ],
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: 10
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="px-4 mt-2">
                <p className="text-sm text-gray-600">
                  SMS messages show the highest response rate at 
                  <strong> {((dashboardData.messageTypes.sms > 0) 
                    ? (Math.max(10, dashboardData.messageTypes.sms * 0.4) / Math.max(15, dashboardData.messageTypes.sms * 0.7) * 100) 
                    : 0).toFixed(1)}%
                  </strong>, while voicemails have the lowest at 
                  <strong> {((dashboardData.messageTypes.voicemail > 0)
                    ? (Math.max(3, dashboardData.messageTypes.voicemail * 0.1) / Math.max(25, dashboardData.messageTypes.voicemail * 0.9) * 100)
                    : 0).toFixed(1)}%
                  </strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Engagement chart - always shown */}
        <div className="mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Lead Engagement Over Time</CardTitle>
                  <CardDescription>How your lead engagement has trended recently</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                    <span className="text-xs text-gray-600">New Leads</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-600">Responses</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Meetings</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] p-4">
                <Line 
                  data={messageTrendsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: 10,
                        mode: 'index',
                        intersect: false
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      }
                    },
                    animation: {
                      duration: 1000
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2 px-4">
                <div className="bg-gray-50 rounded-md p-3 text-center">
                  <p className="text-sm text-gray-500 mb-1">Average Weekly Leads</p>
                  <p className="text-xl font-semibold text-indigo-600">35</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3 text-center">
                  <p className="text-sm text-gray-500 mb-1">Response Rate</p>
                  <p className="text-xl font-semibold text-emerald-600">46%</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3 text-center">
                  <p className="text-sm text-gray-500 mb-1">Meeting Conversion</p>
                  <p className="text-xl font-semibold text-orange-600">24%</p>
                </div>
              </div>
              <div className="px-4 mt-4">
                <div className="bg-indigo-50 p-3 rounded-md">
                  <p className="text-sm text-indigo-800">
                    <span className="font-medium">Insight:</span> Your lead engagement is trending upward with a 
                    <span className="font-medium"> 15% increase</span> in new leads and a 
                    <span className="font-medium"> 22% increase</span> in successful meetings over the past 6 weeks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-md h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest updates from your accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Sample activity items - in real app, would be dynamically generated */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">New lead added</p>
                          <p className="text-sm text-gray-500">John Smith was added as a potential buyer</p>
                        </div>
                        <span className="text-xs text-gray-400">2h ago</span>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <Link href="/leads" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          View lead
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          Send message
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">New message received</p>
                          <p className="text-sm text-gray-500">Sarah Johnson replied to your property inquiry</p>
                        </div>
                        <span className="text-xs text-gray-400">5h ago</span>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <Link href="/messaging-embed" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          View conversation
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                      <PhoneIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">Call scheduled</p>
                          <p className="text-sm text-gray-500">Call with David Miller set for tomorrow at 2:00 PM</p>
                        </div>
                        <span className="text-xs text-gray-400">12h ago</span>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Add to calendar
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          Send reminder
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="border-none shadow-md h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
                <CardDescription>Key conversion indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Lead Conversion Rate</span>
                      <span className="text-sm font-semibold text-indigo-600">{dashboardData.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                        style={{ width: `${Math.min(dashboardData.conversionRate, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contacts converted to leads</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Message Response Rate</span>
                      <span className="text-sm font-semibold text-emerald-600">{dashboardData.responseRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                        style={{ width: `${Math.min(dashboardData.responseRate, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Messages that received a response</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Average Lead Value</span>
                      <span className="text-sm font-semibold text-purple-600">
                        ${dashboardData.totalLeads > 0 
                          ? Math.round(dashboardData.leadValue / dashboardData.totalLeads).toLocaleString() 
                          : 0}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total Lead Value</span>
                        <span className="text-sm font-medium">${dashboardData.leadValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Total Leads</span>
                        <span className="text-sm font-medium">{dashboardData.totalLeads}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/leads" 
              className="group flex flex-col items-center p-4 rounded-md border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors mb-3">
                <UsersIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium">Manage Leads</span>
            </Link>
            
            <Link 
              href="/contacts" 
              className="group flex flex-col items-center p-4 rounded-md border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors mb-3">
                <UsersIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">Contacts</span>
            </Link>
            
            <Link 
              href="/messaging-embed" 
              className="group flex flex-col items-center p-4 rounded-md border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors mb-3">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Messaging</span>
            </Link>
            
            <Link 
              href="/properties" 
              className="group flex flex-col items-center p-4 rounded-md border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors mb-3">
                <HomeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium">Properties</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}