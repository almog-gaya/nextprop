"use client";

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  precision?: number;
  prefix?: string;
  suffix?: string;
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  change,
  trend = 'neutral',
  precision = 0,
  prefix = '',
  suffix = '',
  onClick
}: KpiCardProps) {
  // Format the value if it's a number
  const formattedValue = typeof value === 'number' 
    ? `${prefix}${value.toLocaleString(undefined, { 
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      })}${suffix}`
    : `${prefix}${value}${suffix}`;

  // Determine color and icon based on trend
  const trendConfig = {
    up: {
      icon: <ArrowUpIcon className="h-4 w-4" />,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    down: {
      icon: <ArrowDownIcon className="h-4 w-4" />,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    neutral: {
      icon: <ArrowRightIcon className="h-4 w-4" />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    }
  };

  const { icon, color, bgColor } = trendConfig[trend];

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xs md:text-sm font-medium text-gray-500">{title}</h3>
        </div>
        
        <div className="mt-2">
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{formattedValue}</div>
          
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <div className={`flex items-center ${color} ${bgColor} px-2 py-1 rounded-full text-xs font-medium`}>
                {icon}
                <span className="ml-1">{change}%</span>
              </div>
              <span className="ml-2 text-xs text-gray-500">vs. previous period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 