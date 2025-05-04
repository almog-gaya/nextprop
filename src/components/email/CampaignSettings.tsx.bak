'use client';

import React, { useEffect, useState } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { UpdateCampaignRequest } from '@/types/instantly';

interface CampaignSettingsProps {
  campaignId: string;
}

export default function CampaignSettings({ campaignId }: CampaignSettingsProps) {
  const { selectedCampaign, loading, error, fetchCampaign, updateCampaign } = useInstantly();
  
  const [formData, setFormData] = useState<UpdateCampaignRequest>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedCampaign) {
      setFormData({
        name: selectedCampaign.name,
        daily_limit: selectedCampaign.daily_limit,
        email_gap: selectedCampaign.email_gap,
        email_list: selectedCampaign.email_list,
        template: selectedCampaign.template,
        email_template: selectedCampaign.email_template,
        sequences: selectedCampaign.sequences,
      });
    }
  }, [selectedCampaign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'daily_limit' || name === 'email_gap' ? Number(value) : value,
    }));
    setSaveSuccess(false);
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    
    try {
      const result = await updateCampaign(campaignId, formData);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      setSaveError('Failed to update campaign settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading.selectedCampaign && !selectedCampaign) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedCampaign) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Campaign not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
          <CardDescription>
            Configure your campaign settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="Campaign name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email_list">Email List</Label>
              <Select
                name="email_list"
                value={formData.email_list || ''}
                onValueChange={handleSelectChange('email_list')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Test List">Test List</SelectItem>
                  <SelectItem value="Main List">Main List</SelectItem>
                  <SelectItem value="Secondary List">Secondary List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="daily_limit">Daily Email Limit</Label>
              <Input
                id="daily_limit"
                name="daily_limit"
                type="number"
                min="1"
                max="1000"
                value={formData.daily_limit || ''}
                onChange={handleInputChange}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of emails to send per day
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email_gap">Email Gap (minutes)</Label>
              <Input
                id="email_gap"
                name="email_gap"
                type="number"
                min="1"
                max="60"
                value={formData.email_gap || ''}
                onChange={handleInputChange}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between emails in minutes
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email_template">Email Template</Label>
            <Textarea
              id="email_template"
              name="email_template"
              value={formData.email_template || ''}
              onChange={handleInputChange}
              placeholder="Enter your email template here"
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Use &#123;&#123;firstName&#125;&#125;, &#123;&#123;lastName&#125;&#125;, &#123;&#123;company&#125;&#125; as placeholders for personalization
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {saveSuccess && (
            <p className="text-sm font-medium text-green-600">
              Settings saved successfully!
            </p>
          )}
          
          {saveError && (
            <p className="text-sm font-medium text-red-500">
              {saveError}
            </p>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || loading.selectedCampaign}
            className="ml-auto flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 