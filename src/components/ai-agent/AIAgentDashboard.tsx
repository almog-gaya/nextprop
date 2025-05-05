'use client';

import React from 'react';
import { 
  UserGroupIcon,
  BoltIcon, 
  CalendarIcon, 
  ChatBubbleLeftIcon,
  InboxIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
    <p className="text-sm text-[var(--nextprop-text-secondary)] mb-2">{title}</p>
    <div className="flex items-center justify-between">
      <h3 className="text-4xl font-bold text-[var(--nextprop-text-primary)]">{value}</h3>
      <div className="text-[var(--nextprop-primary)]">
        {icon}
      </div>
    </div>
  </div>
);

type SuccessIndicatorProps = {
  percentage: number;
};

const SuccessIndicator: React.FC<SuccessIndicatorProps> = ({ percentage }) => (
  <div className="flex items-center">
    <div className="mr-2">
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    </div>
    <span className="text-green-500 font-medium">{percentage}%</span>
  </div>
);

export default function AIAgentDashboard() {
  // This would normally be fetched from an API
  const metrics = {
    uniqueContacts: 0,
    actionsTriggered: 0,
    appointmentsBooked: 0,
    totalMessages: 0,
    avgMessagesPerContact: 0,
    successRate: 0
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Unique Contacts" 
          value={metrics.uniqueContacts}
          icon={<UserGroupIcon className="h-8 w-8" />}
        />
        <MetricCard 
          title="Total Actions Triggered" 
          value={metrics.actionsTriggered}
          icon={<BoltIcon className="h-8 w-8" />}
        />
        <MetricCard 
          title="Total Appointment Booked" 
          value={metrics.appointmentsBooked}
          icon={<CalendarIcon className="h-8 w-8" />}
        />
      </div>

      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm text-[var(--nextprop-text-secondary)] mb-2">Total Messages</p>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-bold text-[var(--nextprop-text-primary)]">{metrics.totalMessages}</h3>
            <ChatBubbleLeftIcon className="h-8 w-8 text-[var(--nextprop-primary)]" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm text-[var(--nextprop-text-secondary)] mb-2">Average Messages per Contact</p>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-bold text-[var(--nextprop-text-primary)]">{metrics.avgMessagesPerContact}</h3>
            <div className="flex items-center">
              <InboxIcon className="h-8 w-8 text-[var(--nextprop-primary)] mr-2" />
              <SuccessIndicator percentage={metrics.successRate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 