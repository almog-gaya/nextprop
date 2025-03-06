import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const LeadSummary: React.FC = () => {
  // Mock data for lead summary
  const leadData = {
    total: 56,
    newThisWeek: 12,
    conversion: 18.5,
    trends: [
      { label: 'Real Estate', count: 23, change: 8.2, isPositive: true },
      { label: 'Website', count: 18, change: 4.7, isPositive: true },
      { label: 'Referrals', count: 9, change: -2.3, isPositive: false },
      { label: 'Direct', count: 6, change: 1.1, isPositive: true }
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Lead Summary</h3>
        <select className="text-sm border-gray-300 rounded-md">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold">{leadData.total}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">New This Week</p>
          <p className="text-2xl font-bold">{leadData.newThisWeek}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-2xl font-bold">{leadData.conversion}%</p>
        </div>
      </div>
      
      <h4 className="text-sm font-medium text-gray-600 mb-3">Lead Sources</h4>
      <div className="space-y-4">
        {leadData.trends.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">{item.count}</span>
              <div className={`flex items-center text-xs ${item.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {item.isPositive ? 
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> : 
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                }
                {Math.abs(item.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="text-sm text-purple-600 hover:text-blue-800">
          View Detailed Report
        </button>
      </div>
    </div>
  );
};

export default LeadSummary; 