import { Edit2Icon, Trash } from 'lucide-react';
import React from 'react';

// Mock data for agents
const mockAgents = [
  {
    id: '1',
    name: ' Amir',
    created: 'May 05, 2025',
    voice: 'Female Voice',
    numbers: 'N/A',
    voiceFor: 'Lead',
    company: 'We buy houses in Miami',
    companyNA: 'N/A',
    leadQualifies: 'Do Nothing',
    conversionOutcome: 'Interested in Selling, Address of',
  },
   {
    id: '2',
    name: ' Almog',
    created: 'May 13, 2025',
    voice: 'Male Voice',
    numbers: 'N/A',
    voiceFor: 'Lead',
    company: 'We buy houses in Miami',
    companyNA: 'N/A',
    leadQualifies: 'Do Nothing',
    conversionOutcome: 'Interested in Selling, Address of',
  },
    {
    id: '3',
    name: ' Bahadur',
    created: 'May 16, 2025',
    voice: 'Male Voice',
    numbers: '44',
    voiceFor: 'Lead',
    company: 'We buy houses in UK',
    companyNA: 'ABC',
    leadQualifies: 'Do Nothing',
    conversionOutcome: 'Interested in Selling,',
  },
];

export default function AIAgentListTable() {
  return (
    <div className="bg-[var(--nextprop-surface)] mb-8">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray">
          <tr className="table-header-row">
            <th>Assistant</th>
            <th>Numbers Attached</th>
            <th>Voice AI For</th>
            <th>Company Name</th>
            <th>Lead Qualifies</th>
            <th>Conversion Outcome</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {mockAgents.map((agent) => (
            <tr key={agent.id} className="table-body-row">
              <td>
                <div className=" text-[var(--nextprop-text-primary)]">{agent.name}</div>
                <div className="text-gray-400">Created {agent.created}</div>
                  <div className="text-gray-400">{agent.voice}</div>
              </td>
              <td>{agent.numbers}</td>
              <td>{agent.voiceFor}</td>
              <td>
                <div>{agent.company}</div>
                <div className="text-gray-400">{agent.companyNA}</div>
              </td>
              <td>{agent.leadQualifies}</td>
              <td>{agent.conversionOutcome}</td>
              <td className="py-2">
                <button className="ml-2 mr-2 text-gray-500 hover:text-[var(--nextprop-primary)]" title="Edit">
                 <Edit2Icon className="w-4 h-4 text-grey" />
                </button>
                <button className="text-gray-500 hover:text-red-500" title="Delete">
                  <Trash className="w-4 h-4 text-grey" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 