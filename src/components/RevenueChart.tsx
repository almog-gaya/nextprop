import React from 'react';

const RevenueChart: React.FC = () => {
  // This is a simplified mock chart component
  // In a real application, you would use a library like Chart.js, Recharts, or D3.js
  
  // Mock data for chart
  const monthlyData = [
    { month: 'Jan', value: 25 },
    { month: 'Feb', value: 40 },
    { month: 'Mar', value: 30 },
    { month: 'Apr', value: 50 },
    { month: 'May', value: 45 },
    { month: 'Jun', value: 65 },
  ];
  
  // Calculate max value for scaling
  const maxValue = Math.max(...monthlyData.map(item => item.value));
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
      
      <div className="mt-4">
        <div className="flex items-end space-x-2 h-44">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t-md"
                style={{ 
                  height: `${(data.value / maxValue) * 100}%`,
                  minHeight: '10px'
                }}
              ></div>
              <span className="text-xs mt-1 text-gray-600">{data.month}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-4">
          <div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl font-bold">$42,500</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Growth</p>
            <p className="text-xl font-bold text-green-500">+12.5%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart; 