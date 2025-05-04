'use client';

import React, { useEffect, useState } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, Eye, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CampaignEmailsProps {
  campaignId: string;
}

export default function CampaignEmails({ campaignId }: CampaignEmailsProps) {
  const { emails, loading, error, fetchEmails } = useInstantly();
  
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchEmails(campaignId);
    }
  }, [campaignId, fetchEmails]);

  const handleRefresh = () => {
    if (campaignId) {
      fetchEmails(campaignId);
    }
  };

  const handleViewEmail = (emailId: string, content: string) => {
    setSelectedEmail(emailId);
    setEmailContent(content);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sent Emails</h2>
          <p className="text-muted-foreground">
            View emails sent from this campaign
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loading.emails}
          className="flex items-center gap-2"
        >
          {loading.emails ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sent Emails</CardTitle>
          <CardDescription>
            A list of all emails sent from this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading.emails && emails.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No emails have been sent yet
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">{email.to_email}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{formatDate(email.sent_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {email.opened_at && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-300">
                              Opened
                            </span>
                          )}
                          {email.clicked_at && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-300">
                              Clicked
                            </span>
                          )}
                          {email.replied_at && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-300">
                              Replied
                            </span>
                          )}
                          {!email.opened_at && !email.clicked_at && !email.replied_at && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300">
                              Sent
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewEmail(email.id, email.body)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">View email</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email View Modal */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Details
            </DialogTitle>
            <DialogDescription>
              {emails.find(e => e.id === selectedEmail)?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">From:</p>
                <p>{emails.find(e => e.id === selectedEmail)?.from_email}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">To:</p>
                <p>{emails.find(e => e.id === selectedEmail)?.to_email}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Sent:</p>
                <p>{emails.find(e => e.id === selectedEmail)?.sent_at && 
                   formatDate(emails.find(e => e.id === selectedEmail)!.sent_at)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: emailContent || '' }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 