"use client";

import React, { useEffect, useState } from "react";
import {
  UserGroupIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="text-[var(--nextprop-primary)]">{icon}</div>
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
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    uniqueContactsEngaged: 0,
    dealsInProcess: 0,
    leadsQualified: 0,
    notInterested: 0,
    totalMessages: 0,
    avgMessagesPerContact: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const locationId = user?.locationId;
        console.log("[AIAgentDashboard] Fetching metrics for location:", locationId);

        // Fetch contacts count
        const contactsSnapshot = await getCountFromServer(collection(db, `multi-agent-configs/${locationId}/contacts`));
        const uniqueContactsEngaged = contactsSnapshot.data().count;
        console.log("[AIAgentDashboard] Unique contacts engaged:", uniqueContactsEngaged);

        // Create queries for each status
        const inProcessQuery = query(
          collection(db, `multi-agent-configs/${locationId}/opportunities`),
          where("status", "==", "in_process")
        );
        const qualifiedQuery = query(
          collection(db, `multi-agent-configs/${locationId}/opportunities`),
          where("status", "==", "human_needed")
        );
        const notInterestedQuery = query(
          collection(db, `multi-agent-configs/${locationId}/opportunities`),
          where("status", "==", "not_interested")
        );

        // Fetch counts concurrently
        console.log("[AIAgentDashboard] Fetching opportunity counts...");
        const [inProcessSnapshot, qualifiedSnapshot, notInterestedSnapshot] = await Promise.all([
          getCountFromServer(inProcessQuery),
          getCountFromServer(qualifiedQuery),
          getCountFromServer(notInterestedQuery),
        ]);
        console.log(`>>>${JSON.stringify(inProcessSnapshot.data())}`);
        const dealsInProcess = inProcessSnapshot.data().count;
        const leadsQualified = qualifiedSnapshot.data().count;
        const notInterested = notInterestedSnapshot.data().count;
        console.log("[AIAgentDashboard] Opportunity counts:", {
          
        });

        // Fetch total messages
        const messagesSnapshot = await getCountFromServer(collection(db, `multi-agent-configs/${locationId}/messages`));
        const totalMessages = messagesSnapshot.data().count;
        console.log("[AIAgentDashboard] Total messages:", totalMessages);

        // Calculate average messages per contact
        const avgMessagesPerContact = uniqueContactsEngaged > 0 ? (totalMessages / uniqueContactsEngaged).toFixed(1) : 0;
        console.log("[AIAgentDashboard] Average messages per contact:", avgMessagesPerContact);

        // Calculate success rate (qualified leads / total contacts)
        const successRate = uniqueContactsEngaged > 0 ? ((leadsQualified / uniqueContactsEngaged) * 100).toFixed(1) : 0;
        console.log("[AIAgentDashboard] Success rate:", successRate);

        setMetrics({
          uniqueContactsEngaged,
          dealsInProcess,
          leadsQualified,
          notInterested,
          totalMessages,
          avgMessagesPerContact: Number(avgMessagesPerContact),
          successRate: Number(successRate),
        });
        console.log("[AIAgentDashboard] Metrics updated successfully");
      } catch (error) {
        console.error("[AIAgentDashboard] Error fetching metrics:", error);
      }
    };

    if (user?.locationId) {
      console.log("[AIAgentDashboard] Starting metrics fetch...");
      fetchMetrics();
    } else {
      console.log("[AIAgentDashboard] No locationId available, skipping metrics fetch");
    }
  }, [user?.locationId]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Unique Contacts Engaged"
          value={metrics.uniqueContactsEngaged}
          icon={<UserGroupIcon className="h-8 w-8" />}
        />
        <MetricCard title="Deals Still in Process" value={metrics.dealsInProcess} icon={<ClockIcon className="h-8 w-8" />} />
        <MetricCard title="Total Leads Qualified" value={metrics.leadsQualified} icon={<UserIcon className="h-8 w-8" />} />
        <MetricCard title="Not Interested" value={metrics.notInterested} icon={<XCircleIcon className="h-8 w-8" />} />
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
              <InboxIcon className="h-8 w-8 text-[var(--nextprop-primary)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
