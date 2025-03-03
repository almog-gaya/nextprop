'use client';

import React, { useEffect } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CampaignAnalyticsProps {
  campaignId: string;
}

export default function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const { campaignAnalytics, loading, error, fetchCampaignAnalytics } = useInstantly();

  useEffect(() => {
    if (campaignId) {
      fetchCampaignAnalytics(campaignId);
    }
  }, [campaignId, fetchCampaignAnalytics]);

  if (loading.analytics && !campaignAnalytics) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-300 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!campaignAnalytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { name: 'Total Leads', value: campaignAnalytics.leads_count },
    { name: 'Contacted', value: campaignAnalytics.contacted_count },
    { name: 'Emails Sent', value: campaignAnalytics.emails_sent_count },
    { name: 'Opens', value: campaignAnalytics.opens_count },
    { name: 'Clicks', value: campaignAnalytics.clicks_count },
    { name: 'Replies', value: campaignAnalytics.replies_count },
    { name: 'Bounces', value: campaignAnalytics.bounces_count },
    { name: 'Unsubscribes', value: campaignAnalytics.unsubscribes_count },
  ];

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  const rates = [
    { 
      name: 'Open Rate', 
      value: calculateRate(campaignAnalytics.opens_count, campaignAnalytics.emails_sent_count),
      description: 'Percentage of emails that were opened'
    },
    { 
      name: 'Click Rate', 
      value: calculateRate(campaignAnalytics.clicks_count, campaignAnalytics.emails_sent_count),
      description: 'Percentage of emails that were clicked'
    },
    { 
      name: 'Reply Rate', 
      value: calculateRate(campaignAnalytics.replies_count, campaignAnalytics.emails_sent_count),
      description: 'Percentage of emails that received replies'
    },
    { 
      name: 'Bounce Rate', 
      value: calculateRate(campaignAnalytics.bounces_count, campaignAnalytics.emails_sent_count),
      description: 'Percentage of emails that bounced'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Key metrics and engagement rates for your campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rates.map((rate) => (
              <div key={rate.name} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{rate.name}</p>
                <p className="text-2xl font-bold">{rate.value}</p>
                <p className="text-xs text-muted-foreground">{rate.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 