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
import { format, subDays, subMonths, subWeeks, subYears } from 'date-fns';

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

// Custom Report Response Interface
interface StatusCount {
  label: string;
  value: number;
}

interface CustomReportData {
  total: number;
  totalValue: number;
  counts: StatusCount[];
}

interface CustomReportResponse {
  data: CustomReportData;
  comparisonData: CustomReportData;
  stats: {
    total: number;
    comparisonTotal: number;
    totalValue: number;
    comparisonTotalValue: number;
    percentageChange: number;
    percentageChangeValue: number;
    percentageChangeWonValue: number;
  };
  traceId: string;
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [reportData, setReportData] = useState<CustomReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');

  // Fetch custom report data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoadingCharts(true);
      setError(null); // Clear previous errors
      try {
        // Calculate date ranges based on selected time filter
        const endDate = format(new Date(), 'yyyy-MM-dd');
        let startDate;
        let comparisonStartDate;
        let comparisonEndDate;

        if (timeFilter === 'today') {
          startDate = endDate;
          comparisonEndDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
          comparisonStartDate = comparisonEndDate;
        } else if (timeFilter === 'week') {
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
          comparisonEndDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
          comparisonStartDate = format(subDays(new Date(), 13), 'yyyy-MM-dd');
        } else if (timeFilter === 'month') {
          startDate = format(subDays(new Date(), 29), 'yyyy-MM-dd');
          comparisonEndDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          comparisonStartDate = format(subDays(new Date(), 59), 'yyyy-MM-dd');
        } else if (timeFilter === 'year') {
          startDate = format(subDays(new Date(), 364), 'yyyy-MM-dd');
          comparisonEndDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
          comparisonStartDate = format(subDays(new Date(), 729), 'yyyy-MM-dd');
        }

        const requestBody = {
          startDate,
          endDate,
          chartType: 'opportunities-status-summary',
          comparisonStartDate,
          comparisonEndDate,
          dateProperty: 'last_status_change_date'
        };

        console.log('Sending API request with:', requestBody);

        const response = await fetch(`/api/reports/custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          cache: 'no-store' // Ensure we don't use cached responses
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch report data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        if (!data || !data.data) {
          console.error('API returned invalid data structure:', data);
          setError('The API returned an invalid response structure');
          return;
        }

        setReportData(data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(`Failed to load report data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoadingCharts(false);
      }
    };

    if (user) {
      fetchReportData();
    }
  }, [user, timeFilter]);

  // Prepare chart data based on the API response
  const prepareStatusDistributionData = () => {
    if (!reportData || !reportData.data || !reportData.data.counts) return null;

    // Create data for current period
    const currentPeriodData = {
      labels: reportData.data.counts.map(item => item.label.charAt(0).toUpperCase() + item.label.slice(1)),
      datasets: [{
        data: reportData.data.counts.map(item => item.value),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)', // Indigo - Open
          'rgba(249, 115, 22, 0.8)', // Orange - Abandoned 
          'rgba(239, 68, 68, 0.8)',  // Red - Lost
          'rgba(16, 185, 129, 0.8)', // Emerald - Won
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 1,
      }]
    };

    return currentPeriodData;
  };

  const prepareComparisonData = () => {
    if (!reportData || !reportData.data || !reportData.comparisonData) return null;

    // Format data for comparison chart (current vs previous period)
    const comparisonChartData = {
      labels: ['Current Period', 'Previous Period'],
      datasets: [
        {
          label: 'Total Leads',
          data: [reportData.data.total, reportData.comparisonData.total],
          backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(156, 163, 175, 0.8)'],
          borderColor: ['rgba(99, 102, 241, 1)', 'rgba(156, 163, 175, 1)'],
          borderWidth: 1
        },
        {
          label: 'Total Value',
          data: [reportData.data.totalValue || 0, reportData.comparisonData.totalValue || 0],
          backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(209, 213, 219, 0.8)'],
          borderColor: ['rgba(16, 185, 129, 1)', 'rgba(209, 213, 219, 1)'],
          borderWidth: 1
        }
      ]
    };

    return comparisonChartData;
  };

  const prepareStatusComparison = () => {
    if (!reportData || !reportData.data || !reportData.data.counts || !reportData.comparisonData || !reportData.comparisonData.counts) return null;

    // Get all unique statuses from both periods
    const allStatuses = new Set([
      ...reportData.data.counts.map(item => item.label),
      ...reportData.comparisonData.counts.map(item => item.label)
    ]);

    // Format labels to be capitalized
    const labels = Array.from(allStatuses).map(
      status => status.charAt(0).toUpperCase() + status.slice(1)
    );

    // Prepare datasets
    const currentValues = labels.map(label => {
      const statusItem = reportData.data.counts.find(
        item => item.label.toLowerCase() === label.toLowerCase()
      );
      return statusItem ? statusItem.value : 0;
    });

    const comparisonValues = labels.map(label => {
      const statusItem = reportData.comparisonData.counts.find(
        item => item.label.toLowerCase() === label.toLowerCase()
      );
      return statusItem ? statusItem.value : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Current Period',
          data: currentValues,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1
        },
        {
          label: 'Previous Period',
          data: comparisonValues,
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1
        }
      ]
    };
  };

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
      <div className="px-4 py-4 mx-auto container">

        {/* Welcome Header with Time Filters - always shown */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">

            <div></div>
            <h1 className="text-3xl font-bold">{getGreeting()}, {userLoading ? ' ' : (user?.name || ' ')}</h1>
            <p className="text-gray-500">Here's what's happening with your real estate business</p>
          </div>
        </div>

        {/* Display any API errors */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics Cards - always shown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.data?.total || '—'}</p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${(reportData?.stats?.percentageChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(reportData?.stats?.percentageChange ?? 0) >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{reportData?.stats?.percentageChange !== undefined ? Math.abs(reportData.stats.percentageChange).toFixed(1) : '0'}%</span>
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
                    <p className="text-sm font-medium text-gray-500">Previous Period</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.comparisonData?.total || '—'}</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold">Period comparison</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-emerald-600 font-medium">
                  {reportData && reportData.data && reportData.comparisonData ?
                    (reportData.comparisonData.total - reportData.data.total) :
                    '0'
                  } difference
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">${reportData?.data?.totalValue?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center ${(reportData?.stats?.percentageChangeValue ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(reportData?.stats?.percentageChangeValue ?? 0) >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold">{reportData?.stats?.percentageChangeValue !== undefined ? Math.abs(reportData.stats.percentageChangeValue).toFixed(1) : '0'}%</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-orange-600 font-medium">
                  Previous: ${reportData?.comparisonData?.totalValue?.toLocaleString() || '0'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-white p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Open Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData?.data?.counts?.find(c => c.label === 'open')?.value || '—'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {reportData && reportData.data && reportData.comparisonData &&
                    reportData.data.counts && reportData.comparisonData.counts &&
                    reportData.comparisonData.counts.find(c => c.label === 'open') && (
                      <>
                        <div className={`flex items-center ${(reportData.data.counts.find(c => c.label === 'open')?.value || 0) >=
                          (reportData.comparisonData.counts.find(c => c.label === 'open')?.value || 0) ? 'text-green-600' : 'text-red-600'}`}>
                          {(reportData.data.counts.find(c => c.label === 'open')?.value || 0) >=
                            (reportData.comparisonData.counts.find(c => c.label === 'open')?.value || 0) ? (
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs font-semibold">
                            {reportData ? Math.abs(((reportData.data.counts.find(c => c.label === 'open')?.value || 0) -
                              (reportData.comparisonData.counts.find(c => c.label === 'open')?.value || 0)) /
                              (reportData.comparisonData.counts.find(c => c.label === 'open')?.value || 1) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 ml-1">vs previous {timeFilter}</span>
                      </>
                    )}
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <span className="text-xs text-purple-600 font-medium">
                  Previous: {reportData?.comparisonData?.counts?.find(c => c.label === 'open')?.value || '0'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts section - always shown including chart structures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
              <CardDescription>Current period leads statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center items-center p-4">
                {isLoadingCharts ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : reportData && reportData.data && reportData.data.counts ? (
                  <Doughnut
                    data={prepareStatusDistributionData() || {
                      labels: [],
                      datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          callbacks: {
                            label: function (context) {
                              const value = context.raw as number;
                              const total = reportData.data.total;
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                              return `${value} leads (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">Period Comparison</CardTitle>
              <CardDescription>Current vs Previous Period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center items-center p-4">
                {isLoadingCharts ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : reportData && reportData.data && reportData.comparisonData ? (
                  <Bar
                    data={prepareComparisonData() || {
                      labels: [],
                      datasets: []
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
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status comparison chart */}
        <div className="mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Status Comparison</CardTitle>
                  <CardDescription>Comparing statuses between current and previous periods</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] p-4">
                {isLoadingCharts ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : reportData && reportData.data && reportData.comparisonData &&
                  reportData.data.counts && reportData.comparisonData.counts ? (
                  <Bar
                    data={prepareStatusComparison() || {
                      labels: [],
                      datasets: []
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
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
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
              {reportData && reportData.data && reportData.comparisonData && (
                <div className="grid grid-cols-2 gap-4 mt-2 px-4">
                  <div className="bg-gray-50 rounded-md p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Current Period Total</p>
                    <p className="text-xl font-semibold text-indigo-600">{reportData.data.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Previous Period Total</p>
                    <p className="text-xl font-semibold text-gray-600">{reportData.comparisonData.total}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}