import React from 'react';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
}

const ContactList: React.FC = () => {
  // Mock contacts data
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(305) 555-1234',
      source: 'Real Estate Lead',
      status: 'New'
    },
    {
      id: '2',
      name: 'Maria Rodriguez',
      email: 'maria.r@example.com',
      phone: '(305) 555-5678',
      source: 'Website Form',
      status: 'Contacted'
    },
    {
      id: '3',
      name: 'Robert Johnson',
      email: 'robert.j@example.com',
      phone: '(305) 555-9012',
      source: 'Real Estate Lead',
      status: 'New'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      phone: '(305) 555-3456',
      source: 'Referral',
      status: 'Qualified'
    }
  ];

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-medium">Recent Contacts</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {contact.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {contact.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contact.source}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Call</button>
                  <button className="text-blue-600 hover:text-blue-900">Email</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactList; 