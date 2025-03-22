"use client";

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
 

interface StatsCardProps {
  title: string;
  value: any;
  icon: React.ReactNode;
  iconBgColor?: string; // Add this property
  iconColor?: string;   // Add this property
}

export default function StatsCard({ title, value, icon, iconBgColor = "bg-purple-100", iconColor = "text-purple-600" }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg ">
      <div className="p-8">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-4`}>
            <div className={`h-6 w-6 ${iconColor}`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
