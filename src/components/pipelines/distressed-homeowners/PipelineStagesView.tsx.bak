"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Contact {
  id: string;
  name: string;
  phone: string;
  address: string;
  stage: number;
  lastContact: string;
  notes: string;
}

const PIPELINE_STAGES = [
  { id: 1, name: "Voicemail Received", count: 42 },
  { id: 2, name: "Undeliverable", count: 8 },
  { id: 3, name: "Call Back", count: 18 },
  { id: 4, name: "SMS Back", count: 24 },
  { id: 5, name: "Motivation (Lead)", count: 42 },
  { id: 6, name: "Second Engagement", count: 27 },
  { id: 7, name: "Contact Made", count: 22 },
  { id: 8, name: "Meeting Scheduled", count: 15 },
  { id: 9, name: "Follow Up", count: 12 },
  { id: 10, name: "Negotiation", count: 10 },
  { id: 11, name: "Contract Sent", count: 8 },
  { id: 12, name: "DD (Contract Signed)", count: 5 },
  { id: 13, name: "Money in Escrow", count: 3 },
  { id: 14, name: "Closed", count: 3 }
];

// Sample data for demonstration
const SAMPLE_CONTACTS: Contact[] = [
  { 
    id: "c1", 
    name: "John Smith", 
    phone: "(555) 123-4567", 
    address: "123 Main St, Anytown, CA", 
    stage: 5, 
    lastContact: "2023-03-15", 
    notes: "Interested in selling but needs time to think" 
  },
  { 
    id: "c2", 
    name: "Sarah Johnson", 
    phone: "(555) 987-6543", 
    address: "456 Oak Ave, Somewhere, CA", 
    stage: 8, 
    lastContact: "2023-03-17", 
    notes: "Meeting scheduled for next Tuesday" 
  },
  { 
    id: "c3", 
    name: "Robert Williams", 
    phone: "(555) 321-7654", 
    address: "789 Pine Rd, Nowhere, CA", 
    stage: 11, 
    lastContact: "2023-03-16", 
    notes: "Contract has been sent via email" 
  },
];

export default function PipelineStagesView() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  
  // Filter contacts by selected stage
  const stageContacts = selectedStage 
    ? SAMPLE_CONTACTS.filter(contact => contact.stage === selectedStage)
    : [];
    
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Pipeline Stages</h2>
        <p className="text-muted-foreground">
          Track contacts through the 14 stages of the distressed homeowners pipeline
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map(stage => (
          <Card 
            key={stage.id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedStage === stage.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedStage(stage.id === selectedStage ? null : stage.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{stage.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-sm text-muted-foreground">contacts</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedStage && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">
            Contacts in {PIPELINE_STAGES.find(s => s.id === selectedStage)?.name}
          </h3>
          
          <div className="bg-white rounded-md shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stageContacts.length > 0 ? (
                  stageContacts.map(contact => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastContact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.notes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No contacts in this stage
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 