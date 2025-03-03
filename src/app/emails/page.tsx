'use client';

import { useState, useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import EmailForm from '@/components/EmailForm';
import EmailLogsList from '@/components/EmailLogsList';

type EmailLog = {
  id: string;
  to: string;
  subject: string;
  status: 'delivered' | 'failed' | 'pending';
  createdAt: string;
  contactName?: string;
};

export default function EmailsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchEmailLogs = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/logs');
      const data = await response.json();
      
      if (data.status === 'success') {
        setEmailLogs(data.logs || []);
      } else {
        console.error('Error fetching email logs:', data.message);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const handleEmailSubmit = async (emailData: any) => {
    setIsSending(true);
    
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      const data = await response.json();
      
      // After successful send, refresh the logs
      if (data.status === 'success') {
        await fetchEmailLogs();
        setIsSending(false);
        return { success: true };
      } else {
        console.error('Error sending email:', data.message);
        setIsSending(false);
        return { success: false, error: data.message || 'Failed to send email' };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setIsSending(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return (
    <DashboardLayout title="Email Messaging">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1e1b4b]">Email Messaging</h1>
          <a 
            href="/emails/bulk" 
            className="nextprop-outline-button flex items-center"
          >
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Bulk Email Campaign
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <EmailForm onEmailSubmit={handleEmailSubmit} isLoading={isSending} />
          </div>
          <div className="md:col-span-1">
            <EmailLogsList emails={emailLogs} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 