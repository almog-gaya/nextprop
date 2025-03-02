import React from 'react';
import { UserGroupIcon, HomeModernIcon, PhoneIcon, CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface Kpi {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface KpiCardsProps {
  kpis?: Kpi[];
}

const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  // Default KPIs if none provided
  const defaultKpis: Kpi[] = [
    { title: 'Total Contacts', value: '238', change: '+12%', trend: 'up' },
    { title: 'New Leads', value: '23', change: '+5%', trend: 'up' },
    { title: 'Calls Made', value: '65', change: '-3%', trend: 'down' },
    { title: 'Active Properties', value: '42', change: '+8%', trend: 'up' }
  ];

  const displayKpis = kpis || defaultKpis;

  // Map KPI titles to appropriate icons
  const getIconForKpi = (title: string) => {
    const lowercaseTitle = title.toLowerCase();
    
    if (lowercaseTitle.includes('contact') || lowercaseTitle.includes('lead')) {
      return <UserGroupIcon className="h-6 w-6" />;
    } else if (lowercaseTitle.includes('call') || lowercaseTitle.includes('phone')) {
      return <PhoneIcon className="h-6 w-6" />;
    } else if (lowercaseTitle.includes('propert') || lowercaseTitle.includes('house') || lowercaseTitle.includes('home')) {
      return <HomeModernIcon className="h-6 w-6" />;
    } else {
      return <CurrencyDollarIcon className="h-6 w-6" />;
    }
  };

  // Get appropriate colors based on KPI trend
  const getColorClasses = (index: number, trend?: 'up' | 'down' | 'neutral') => {
    const baseColors = [
      'bg-blue-100 text-blue-600',  // blue
      'bg-green-100 text-green-600', // green
      'bg-yellow-100 text-yellow-600', // yellow
      'bg-purple-100 text-purple-600', // purple
    ];
    
    // Use trend to override colors if specified
    if (trend === 'up') {
      return 'bg-green-100 text-green-600';
    } else if (trend === 'down') {
      return 'bg-red-100 text-red-600';
    }
    
    // Default to base colors
    return baseColors[index % baseColors.length];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayKpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${getColorClasses(index, kpi.trend)} mr-4`}>
              {getIconForKpi(kpi.title)}
            </div>
            <div>
              <p className="text-sm text-gray-600">{kpi.title}</p>
              <div className="flex items-center">
                <p className="text-xl font-bold">{kpi.value}</p>
                {kpi.change && (
                  <span className={`ml-2 text-xs font-medium flex items-center ${
                    kpi.trend === 'up' ? 'text-green-600' : 
                    kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {kpi.trend === 'up' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                    {kpi.trend === 'down' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    {kpi.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards; 