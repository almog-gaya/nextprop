'use client';

import React, { useEffect, useState } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, RefreshCw, Search, UserPlus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddLeadRequest, BulkAddLeadsRequest } from '@/types/instantly';
import { useRouter } from 'next/navigation';

interface CampaignLeadsProps {
  campaignId: string;
}

export default function CampaignLeads({ campaignId }: CampaignLeadsProps) {
  const router = useRouter();
  const { leads, loading, error, fetchLeads, addLead, addLeadsBulk } = useInstantly();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Omit<AddLeadRequest, 'campaignId'>>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
  });
  const [bulkLeadsText, setBulkLeadsText] = useState('');
  const [addLeadError, setAddLeadError] = useState<string | null>(null);
  const [bulkAddError, setBulkAddError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchLeads(campaignId);
    }
  }, [campaignId, fetchLeads]);

  const filteredLeads = leads.filter(lead => 
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.first_name && lead.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (lead.last_name && lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = () => {
    if (campaignId) {
      fetchLeads(campaignId);
    }
  };

  const handleAddLead = async () => {
    setAddLeadError(null);
    
    if (!newLead.email.trim()) {
      setAddLeadError('Email is required');
      return;
    }
    
    try {
      const result = await addLead({
        campaignId,
        ...newLead
      });
      
      if (result) {
        setIsAddLeadModalOpen(false);
        setNewLead({
          email: '',
          firstName: '',
          lastName: '',
          company: '',
        });
      }
    } catch (error) {
      setAddLeadError('Failed to add lead');
      console.error(error);
    }
  };

  const handleBulkAdd = async () => {
    setBulkAddError(null);
    
    if (!bulkLeadsText.trim()) {
      setBulkAddError('Please enter at least one email address');
      return;
    }
    
    try {
      // Parse the bulk text (assuming one email per line, optionally with name)
      const lines = bulkLeadsText.split('\n').filter(line => line.trim());
      const parsedLeads = lines.map(line => {
        const parts = line.split(',').map(part => part.trim());
        const email = parts[0];
        const firstName = parts[1] || '';
        const lastName = parts[2] || '';
        const company = parts[3] || '';
        
        return { email, firstName, lastName, company };
      });
      
      // Validate emails
      const invalidEmails = parsedLeads.filter(lead => !lead.email.includes('@'));
      if (invalidEmails.length > 0) {
        setBulkAddError(`Invalid email format for: ${invalidEmails.map(lead => lead.email).join(', ')}`);
        return;
      }
      
      const result = await addLeadsBulk({
        campaignId,
        leads: parsedLeads
      });
      
      if (result) {
        setIsBulkAddModalOpen(false);
        setBulkLeadsText('');
      }
    } catch (error) {
      setBulkAddError('Failed to add leads');
      console.error(error);
    }
  };

  const getLeadStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'bounced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleLeadClick = (leadId: string) => {
    router.push(`/contacts/${leadId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Campaign Leads</h2>
          <p className="text-muted-foreground">
            Manage leads for this email campaign
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsAddLeadModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsBulkAddModalOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Bulk Add
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loading.leads}
          className="flex items-center gap-2"
        >
          {loading.leads ? (
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
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            A list of all leads in this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading.leads && leads.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {searchQuery ? 'No leads match your search' : 'No leads found'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleLeadClick(lead.id)}
                          className="text-left hover:text-purple-600 transition-colors"
                        >
                          {lead.first_name || lead.last_name 
                            ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() 
                            : '-'}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLeadStatusClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(lead.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="col-span-3"
                placeholder="email@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={newLead.firstName || ''}
                onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                className="col-span-3"
                placeholder="John"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={newLead.lastName || ''}
                onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                className="col-span-3"
                placeholder="Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                value={newLead.company || ''}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                className="col-span-3"
                placeholder="Acme Inc."
              />
            </div>
          </div>
          
          {addLeadError && (
            <div className="text-sm font-medium text-red-500 mb-4">
              {addLeadError}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddLead} disabled={loading.leads}>
              {loading.leads ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Lead'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Modal */}
      <Dialog open={isBulkAddModalOpen} onOpenChange={setIsBulkAddModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Bulk Add Leads</DialogTitle>
            <DialogDescription>
              Add multiple leads at once. Enter one email per line.
              Format: email,firstName,lastName,company
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={bulkLeadsText}
              onChange={(e) => setBulkLeadsText(e.target.value)}
              placeholder="john@example.com,John,Doe,Acme Inc.
jane@example.com,Jane,Smith,XYZ Corp."
              rows={10}
            />
          </div>
          
          {bulkAddError && (
            <div className="text-sm font-medium text-red-500 mb-4">
              {bulkAddError}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBulkAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleBulkAdd} disabled={loading.leads}>
              {loading.leads ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Leads'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 