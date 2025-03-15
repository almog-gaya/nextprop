"use client";

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  textColor?: string;
  onClick?: () => void;
}

const StatsCard = ({ title, value, change, trend, icon, textColor = 'text-[#7c3aed]', onClick }: StatsCardProps) => {
  const trendIcon = trend === 'up' ? (
    <ArrowUpIcon className="h-4 w-4 text-green-500" />
  ) : trend === 'down' ? (
    <ArrowDownIcon className="h-4 w-4 text-red-500" />
  ) : null;

  const cardClass = onClick 
    ? 'stat-card cursor-pointer transition-all hover:-translate-y-1 hover:shadow'
    : 'stat-card';

  return (
    <div 
      className={cardClass}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs md:text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-[#7c3aed]">{icon}</div>}
      </div>
      
      <div className={`text-xl md:text-3xl font-bold ${textColor}`}>
        {value}
      </div>
      
      {(change !== undefined && trend) && (
        <div className="flex items-center mt-2 text-xs">
          {trendIcon}
          <span className={`ml-1 font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {change}%
          </span>
          <span className="ml-1 text-gray-500">from previous period</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard; 