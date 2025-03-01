"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    isUpward: boolean;
  };
  bgColor?: string;
  href?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  bgColor = 'bg-white',
  href
}: StatsCardProps) {
  const CardContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">{icon}</div>
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-3xl font-extrabold text-[#1e1b4b]">{value}</p>
        
        {trend && (
          <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full ${
            trend.isUpward ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          }`}>
            <span>{trend.isUpward ? '↑' : '↓'} {trend.value}%</span>
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`nextprop-card shadow-lg hover:shadow-xl transition-all ${bgColor} cursor-pointer transform hover:-translate-y-1 duration-200`}>
        <CardContent />
      </Link>
    );
  }

  return (
    <div className={`nextprop-card shadow-lg hover:shadow-xl transition-all ${bgColor}`}>
      <CardContent />
    </div>
  );
} 