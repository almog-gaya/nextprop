"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

export default function DashboardMetricsView() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Sample data for pipeline stage distribution
  const pipelineStageData = {
    labels: [
      'Voicemail Received',
      'Undeliverable',
      'Call Back',
      'SMS Back',
      'Motivation (Lead)',
      'Second Engagement',
      'Contact Made',
      'Meeting Scheduled',
      'Follow Up',
      'Negotiation',
      'Contract Sent',
      'DD (Contract Signed)',
      'Money in Escrow',
      'Closed'
    ],
    datasets: [
      {
        label: 'Contacts',
        data: [42, 8, 18, 24, 42, 27, 22, 15, 12, 10, 8, 5, 3, 3],
        backgroundColor: [
          'rgba(123, 104, 238, 0.8)',
          'rgba(123, 104, 238, 0.75)',
          'rgba(123, 104, 238, 0.7)',
          'rgba(123, 104, 238, 0.65)',
          'rgba(255, 107, 136, 0.8)',
          'rgba(255, 107, 136, 0.75)',
          'rgba(255, 107, 136, 0.7)',
          'rgba(255, 107, 136, 0.65)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(76, 175, 80, 0.75)',
          'rgba(76, 175, 80, 0.7)',
          'rgba(76, 175, 80, 0.65)',
          'rgba(76, 175, 80, 0.6)',
          'rgba(76, 175, 80, 0.55)',
        ],
        borderColor: [
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Sample data for contact status distribution
  const contactStatusData = {
    labels: ['With Voicemail', 'Without Voicemail', 'Undeliverable', 'Leads'],
    datasets: [
      {
        label: 'Contact Status',
        data: [84, 156, 8, 42],
        backgroundColor: [
          'rgba(123, 104, 238, 0.8)',
          'rgba(123, 104, 238, 0.6)',
          'rgba(255, 107, 136, 0.8)',
          'rgba(76, 175, 80, 0.8)',
        ],
        borderColor: [
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Sample data for contact list depletion
  const listDepletionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Contacts Remaining',
        data: [500, 425, 340, 252, 150, 0],
        borderColor: 'rgba(123, 104, 238, 1)',
        backgroundColor: 'rgba(123, 104, 238, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Estimated Depletion',
        data: [500, 425, 340, 252, 150, 0],
        borderColor: 'rgba(123, 104, 238, 0.5)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
      },
    ],
  };
  
  // Sample data for sends and responses
  const sendsAndResponsesData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Voicemails Sent',
        data: [75, 85, 90, 82, 78, 75],
        backgroundColor: 'rgba(123, 104, 238, 0.8)',
        borderColor: 'rgba(123, 104, 238, 1)',
        borderWidth: 1,
      },
      {
        label: 'Responses Received',
        data: [12, 15, 18, 22, 19, 16],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Sample data for conversion funnel
  const conversionData = {
    labels: [
      'Total Contacts',
      'Voicemail Received',
      'Responses',
      'Leads',
      'Meetings',
      'Contracts',
      'Closed Deals'
    ],
    datasets: [
      {
        label: 'Conversion Funnel',
        data: [500, 248, 84, 42, 15, 8, 3],
        backgroundColor: [
          'rgba(123, 104, 238, 0.8)',
          'rgba(123, 104, 238, 0.7)',
          'rgba(123, 104, 238, 0.6)',
          'rgba(255, 107, 136, 0.8)',
          'rgba(255, 107, 136, 0.7)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(76, 175, 80, 0.7)',
        ],
        borderColor: [
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(123, 104, 238, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(255, 107, 136, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Dashboard Metrics</h2>
        <p className="text-muted-foreground">
          Key metrics for the distressed homeowners pipeline
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 mb-4">
        <button 
          className={`px-3 py-1 rounded-md ${timeframe === 'daily' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setTimeframe('daily')}
        >
          Daily
        </button>
        <button 
          className={`px-3 py-1 rounded-md ${timeframe === 'weekly' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setTimeframe('weekly')}
        >
          Weekly
        </button>
        <button 
          className={`px-3 py-1 rounded-md ${timeframe === 'monthly' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setTimeframe('monthly')}
        >
          Monthly
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stage Distribution</CardTitle>
            <CardDescription>Number of contacts in each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={pipelineStageData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        display: false,
                      },
                    },
                  },
                }} 
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pipelineStageData.labels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: pipelineStageData.datasets[0].backgroundColor[index] }}
                  />
                  <span className="text-xs truncate">{label}</span>
                  <span className="text-xs font-medium ml-auto">{pipelineStageData.datasets[0].data[index]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Status Distribution</CardTitle>
            <CardDescription>Breakdown of contact list status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex justify-center">
              <Doughnut 
                data={contactStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {contactStatusData.labels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: contactStatusData.datasets[0].backgroundColor[index] }}
                  />
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-medium ml-auto">{contactStatusData.datasets[0].data[index]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact List Depletion</CardTitle>
            <CardDescription>Forecast of contact list usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={listDepletionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.parsed.y} contacts`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Contacts Remaining'
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span className="font-medium">Current Remaining:</span> 252 contacts
              </div>
              <div className="text-sm">
                <span className="font-medium">Est. Depletion:</span> Apr 15, 2024
              </div>
              <div className="text-sm">
                <span className="font-medium">Depletion Rate:</span> ~85/month
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sends and Responses</CardTitle>
            <CardDescription>Weekly voicemails sent and responses received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={sendsAndResponsesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span className="font-medium">Total Sent:</span> 485 voicemails
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Responses:</span> 102 (21.0%)
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Conversion rates through the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={conversionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }}
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mt-4">
              {conversionData.labels.map((label, index) => {
                const percentage = index === 0 
                  ? '100%' 
                  : `${((conversionData.datasets[0].data[index] / conversionData.datasets[0].data[0]) * 100).toFixed(1)}%`;
                
                return (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div 
                      className="w-4 h-4 rounded-full mb-1" 
                      style={{ backgroundColor: conversionData.datasets[0].backgroundColor[index] }}
                    />
                    <span className="text-xs">{label}</span>
                    <span className="text-xs font-medium">{conversionData.datasets[0].data[index]}</span>
                    <span className="text-xs text-muted-foreground">{percentage}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 