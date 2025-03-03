'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { useInstantly } from '@/contexts/InstantlyContext';
import { useAuth } from '@/contexts/AuthContext';
import { CreateCampaignRequest } from '@/types/instantly';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CAMPAIGN_DATA: CreateCampaignRequest = {
  name: '',
  daily_limit: 100,
  email_gap: 5,
  email_list: 'Test List',
  template: 'Default Template',
  email_template: 'Hi {{firstName}},\n\nI hope this email finds you well.\n\nSincerely,\nYour Name',
  sequences: 'Sequence 1',
};

export default function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
  const { createCampaign, loading } = useInstantly();
  const { user } = useAuth(); // Get the current user
  const [formData, setFormData] = useState<CreateCampaignRequest>(DEFAULT_CAMPAIGN_DATA);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'daily_limit' || name === 'email_gap' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    try {
      // Add user's email to the campaign name if the user is logged in
      const updatedFormData = { ...formData };
      if (user?.email && !formData.name.includes(`[${user.email}]`)) {
        updatedFormData.name = `[${user.email}] ${formData.name}`;
      }

      await createCampaign(updatedFormData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>
            Create a new email campaign. This campaign will only be visible to your account
            {user?.email && ` (${user.email})`}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="daily_limit">Daily Limit</Label>
              <Input
                id="daily_limit"
                name="daily_limit"
                type="number"
                value={formData.daily_limit.toString()}
                onChange={handleInputChange}
                min={1}
                max={1000}
              />
              <p className="text-sm text-gray-500">Maximum emails to send per day</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email_gap">Email Gap (minutes)</Label>
              <Input
                id="email_gap"
                name="email_gap"
                type="number"
                value={formData.email_gap.toString()}
                onChange={handleInputChange}
                min={1}
                max={120}
              />
              <p className="text-sm text-gray-500">Minutes between each email</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email_list">Email List</Label>
              <Select name="email_list" value={formData.email_list} onChange={handleSelectChange}>
                <SelectItem value="Test List">Test List</SelectItem>
                <SelectItem value="Marketing Leads">Marketing Leads</SelectItem>
                <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email_template">Email Template</Label>
              <Textarea
                id="email_template"
                name="email_template"
                value={formData.email_template}
                onChange={handleInputChange}
                placeholder="Enter email template"
                rows={5}
              />
              <p className="text-sm text-gray-500">
                Use {'{{'} firstName {'}}'}, {'{{'} lastName {'}}'}, etc. for personalization
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading?.campaigns}>
              {loading?.campaigns ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 