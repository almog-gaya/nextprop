'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Contact } from '@/types';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: ''
  }); 
  
  // Add a helper function to get the token
  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('ghl_access_token='));
    if (tokenCookie) {
      return tokenCookie.trim().split('=')[1];
    }
    console.warn('No access token found in cookies');
    return null;
  };
  
  // Update useEffect to handle token absence
  useEffect(() => {
    const validateAndFetch = async () => {
      try {
        // const response = await axios.get('/api/auth/validate');
        // const token = response.data.token;
        // console.log('Token:', token);
        // if (!token) {
        //   router.push('/auth/login?error=invalid_token');
        //   return;
        // }
        fetchContacts();
      } catch (error) {
        console.error('Token validation failed:', error);
        router.push('/auth/login?error=validation_failed');
      }
    };
    validateAndFetch();
  }, [router]);
  
  const fetchContacts = async (forceRefresh = false) => {
    try {
      // setIsLoading(true);
      // const token = getAuthToken();
      
      // if (!token) {
      //   throw new Error('Authentication token not found');
      // }
  
      // const header = {
      //   'Authorization': `Bearer ${token}`
      // };
  
      // console.log('Auth header:', header);
      const response = await axios.get(`/api/contacts${forceRefresh ? '?forceRefresh=true' : ''}`, {
        // headers: header
      });
      
      console.log('Raw contacts response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data || !Array.isArray(response.data.contacts)) {
        console.error('Invalid contacts response structure:', response.data);
        throw new Error('Invalid contacts data received');
      }
      
      // Process contacts to ensure proper display
      const processedContacts = response.data.contacts.map((contact: Contact) => {
        console.log('Processing contact:', contact);
        
        // If the contact has a name, use it
        if (contact.name) {
          return {
            ...contact,
            tags: contact.tags || ['full dnd']
          };
        }
        
        // If no name, generate one from the phone number
        if (contact.phone) {
          return {
            ...contact,
            name: `Contact ${contact.phone.slice(-4)}`,
            tags: contact.tags || ['full dnd']
          };
        }
        
        // Fallback for contacts with no name or phone
        return {
          ...contact,
          name: 'Unknown Contact',
          tags: contact.tags || ['full dnd']
        };
      });
      
      console.log('Final processed contacts:', processedContacts);
      setContacts(processedContacts);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error details:', err.response?.data || err);
      setError(err.message || 'Failed to fetch contacts');
      setIsLoading(false);
    }
  };

  const handleEdit = async (contact: Contact) => {
    try {
      const updatedName = window.prompt('Enter new name:', contact.name || '');
      if (!updatedName) return;

      // Split name into first and last name
      const nameParts = updatedName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;
      
      // Make the API call first
      const response = await axios.put(`/api/contacts/${contact.id}`, 
        {
          name: updatedName,
          firstName,
          lastName
        }, 
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );

      if (response.data) {
        // Update with the server response data
        const updatedContact = {
          ...contact,
          ...response.data,
          name: response.data.name || updatedName,
          tags: response.data.tags || contact.tags || ['full dnd']
        };

        setContacts(prevContacts => 
          prevContacts.map(c => 
            c.id === contact.id ? updatedContact : c
          )
        );
        toast.success('Contact updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating contact:', err);
      toast.error(err.response?.data?.error || 'Failed to update contact');
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(`Are you sure you want to delete ${contact.name || 'this contact'}?`)) {
      return;
    }

    // Store current contacts for rollback if needed
    const currentContacts: Contact[] = [...contacts];
    
    try {
      // Optimistically remove the contact from UI
      setContacts(prevContacts => 
        prevContacts.filter(c => c.id !== contact.id)
      );

      // Make the API call
      const response = await axios.delete(`/api/contacts/${contact.id}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.success) {
        toast.success('Contact deleted successfully');
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      toast.error(err.response?.data?.error || 'Failed to delete contact');
      
      // Revert to original state on error
      setContacts(currentContacts);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newContact.name) {
      toast.error('Name is required');
      return;
    }

    try {
      // Split name into first and last name
      const nameParts = newContact.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      // Format phone number
      let phone = newContact.phone?.trim();
      if (phone) {
        // Remove any non-digit characters
        phone = phone.replace(/\D/g, '');
        // Ensure it starts with country code
        if (phone.length === 10) {
          phone = '1' + phone;
        }
      }

      // Close modal and reset form first
      setIsAddModalOpen(false);
      setNewContact({
        name: '',
        email: '',
        phone: ''
      });

      // Make API call
      console.log('Adding contact with data:', {
        firstName,
        lastName,
        email: newContact.email?.trim() || undefined,
        phone: phone || undefined
      });
      
      const response = await axios.post('/api/contacts/add-lead', 
        {
          firstName,
          lastName,
          email: newContact.email?.trim() || undefined,
          phone: phone || undefined
        }, 
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );

      console.log('Add contact response:', response.data);

      if (response.data && response.data.id) {
        // Add the new contact with data from the API
        const newContactData = {
          ...response.data,
          name: `${firstName} ${lastName || ''}`.trim(),
          tags: response.data.tags || ['full dnd']
        };

        // Update the contacts list immediately
        setContacts(prevContacts => [newContactData as Contact, ...prevContacts]);
        toast.success('Contact added successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error adding contact:', err);
      toast.error(err.response?.data?.error || 'Failed to add contact');
      
      // Reopen the modal with the previous data if there was an error
      setIsAddModalOpen(true);
      setNewContact(prevContact => ({
        name: prevContact.name,
        email: prevContact.email,
        phone: prevContact.phone
      }));
    }
  };

  return (
    <DashboardLayout title="Contacts">
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-card-title">All Contacts</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            Add Contact
          </button>
        </div>

        {/* Add Contact Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
              <form onSubmit={handleAdd}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setNewContact({ name: '', email: '', phone: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                  >
                    Add Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <p>{error}</p>
          </div>
        ) : contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags && contact.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(contact)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(contact)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No contacts found.</p>
        )}
      </div>
    </DashboardLayout>
  );
}