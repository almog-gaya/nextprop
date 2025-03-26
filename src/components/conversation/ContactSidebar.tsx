'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, ChevronDown, ChevronUp, MoreVertical, Plus, X, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateContactById, getContactById } from "@/lib/api";
import toast, { Toaster } from 'react-hot-toast';

interface ContactSidebarProps {
    contactId: string;
}

export default function ContactSidebar({ contactId }: ContactSidebarProps) {
    const [contact, setContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [contactDetails, setContactDetails] = useState<Partial<Contact>>({});
    const [collapsedSections, setCollapsedSections] = useState({
        personal: false,
        address: false,
        tags: false,
        additional: false,
        dnd: false,
    });
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPhoneLabel, setNewPhoneLabel] = useState('Mobile'); 
    const [addingEmail, setAddingEmail] = useState(false);
    const [addingPhone, setAddingPhone] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [showEmailMenu, setShowEmailMenu] = useState<number | null>(null);
    const [showPhoneMenu, setShowPhoneMenu] = useState<number | null>(null);
    const [dndLoading, setDndLoading] = useState<string | null>(null);
    const { user: currentUser } = useAuth();
    useEffect(() => {
        if (contactId) {
            fetchContact();
        }
    }, [contactId]);

    const fetchContact = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getContactById(contactId);
            setContact(response);
            setContactDetails(response);
        } catch (err) {
            setError('Failed to load contact');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateContact = async (field: keyof Contact, value: string | string[]) => {
        if (!contact) return;
        setIsLoading(true);
        setError(null);
        try {
            const updatedContactResponse = await updateContactById(contact!.id, {
                [field]: value
            });

            // Update state with the API response
            setContact(updatedContactResponse);
            setContactDetails(updatedContactResponse);
            setEditingField(null);
        } catch (err: any) { 
            toast.error(err.toString());
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmail = async () => {
        if (!newEmail.trim()) return;
        setIsLoading(true);
        try { 
            const newEmailpayload = {
                "email" : newEmail
            }
            // Call the API to update the contact with the new email
            const updatedContactResponse = await updateContactById(contact!.id, {
                email: contact?.email || newEmail,
                additionalEmails: contact!.additionalEmails 
                    ? [...contact!.additionalEmails, newEmailpayload] 
                    : [newEmailpayload]
            });
            
            // Update state with the API response
            setContact(updatedContactResponse);
            setContactDetails(updatedContactResponse);
            setNewEmail('');
            setAddingEmail(false);
        } catch (err: any) {
            toast.error(err.toString());
            setError('Failed to add email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPhone = async () => {
        if (!newPhone.trim()) return;
        setIsLoading(true);
        try { 
            const newPhoneObj: AdditionalPhone = {
                phone: newPhone,
                phoneLabel: newPhoneLabel 
            };
            
            // Update with the new phone object
            const updatedContactResponse = await updateContactById(contact!.id, {
                phone: contact?.phone || newPhone,
                additionalPhones: contact!.additionalPhones 
                    ? [...contact!.additionalPhones, newPhoneObj] 
                    : [newPhoneObj]
            });
            
            setContact(updatedContactResponse);
            setContactDetails(updatedContactResponse);
            setNewPhone('');
            setNewPhoneLabel('Mobile'); // Reset to default
            setAddingPhone(false);
        } catch (err: any) {
            /// show error as toast
            toast.error(err.toString()); 
            setError('Failed to add phone');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEmail = async (index: number) => {
        if (!contact) return;
        setIsLoading(true);
        try {
            const updatedEmails = [...(contact.additionalEmails || [])];
            updatedEmails.splice(index, 1);
            
            // Call the API to update the contact
            const updatedContactResponse = await updateContactById(contact.id, {
                email: contact.email,
                additionalEmails: updatedEmails
            });
            
            // Update state with the API response
            setContact(updatedContactResponse);
            setContactDetails(updatedContactResponse);
            setShowEmailMenu(null);
        } catch (err: any) {
            toast.error(err.toString());
            setError('Failed to delete email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePhone = async (index: number, isPrimary: boolean) => {
        if (!contact) return;
        setIsLoading(true);
        try { 
            if (isPrimary) {
                const updatedPhones = [...(contact.additionalPhones || [])];
                const newPrimary = updatedPhones.shift();
                const updatedContactResponse = await updateContactById(contact!.id, {
                    phone: newPrimary?.phone || contact!.phone,
                    additionalPhones: updatedPhones
                });

                setContact(updatedContactResponse);
                setContactDetails(updatedContactResponse);
            } else {
                const updatedPhones = [...(contact.additionalPhones || [])];
                updatedPhones.splice(index, 1);
                const updatedContactResponse = await updateContactById(contact!.id, {
                    additionalPhones: updatedPhones,
                    phone: contact!.phone // Always include phone in payload
                });
                
                // Use the API response to update state consistently
                setContact(updatedContactResponse);
                setContactDetails(updatedContactResponse);
            }
            setShowPhoneMenu(null);
        } catch (err) {
            setError('Failed to delete phone');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        setIsLoading(true);
        try {
            const updatedContactResponse = await updateContactById(contact!.id, {
                tags: [...(contact!.tags || []), newTag]
            });

            setContact(updatedContactResponse);
            setContactDetails(updatedContactResponse);
            setNewTag('');
        } catch (err) {
            setError('Failed to add tag');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDndUpdate = async (channel: keyof DndSettings, newStatus: "active" | "inactive") => {
        if (!contact || !contact.dndSettings) return;

        setDndLoading(channel);
        try {
            const currentDateTime = new Date().toISOString();
            const updatedSettings = {
                ...contact.dndSettings,
                [channel]: {
                    status: newStatus,
                    message: `Updated by '${currentUser?.name}' at ${currentDateTime}`,
                    code: contact.dndSettings[channel].code // Preserve existing code
                }
            };

            const isAllInactive = Object.values(updatedSettings).every(setting => setting.status === 'inactive');


            // Simulate POST request - replace with your actual API endpoint
            const updatedContactResponse = await updateContactById(contact.id, {
                dnd: !isAllInactive,
                dndSettings: updatedSettings
            });

            // Update local state after successful request
            setContact(updatedContactResponse);

            // Update overall DND status if any channel is active
            const anyActive = Object.values(updatedContactResponse.dndSettings).some(setting => setting.status === 'active');
            setContact(prev => prev ? { ...prev, dnd: anyActive } : prev);

        } catch (err) {
            console.log(`Error updating ${channel}`, err)
            setError('Failed to update DND settings');
            console.error(err);
        } finally {
            setDndLoading(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return 'Invalid';
        }
    };

    const toggleSection = (section: keyof typeof collapsedSections) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderField = (key: keyof Contact, label: string) => {
        if (key === 'createdBy' || key === 'customFields' || key === 'tags' ||
            key === 'additionalEmails' || key === 'additionalPhones' || key === 'email' || key === 'phone') return null;

        const value = contact?.[key];
        if (editingField === key) {
            return (
                <div key={key} className="flex items-center space-x-2">
                    <input
                        value={(contactDetails[key] as string) || ''}
                        onChange={(e) => setContactDetails({ ...contactDetails, [key]: e.target.value })}
                        className="flex-1 p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                        placeholder={label}
                    />
                    <button
                        onClick={() => handleUpdateContact(key, contactDetails[key] as string)}
                        disabled={isLoading}
                        className={`p-1 text-sm rounded transition-colors ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'
                            }`}
                    >
                        {isLoading ? '...' : 'Save'}
                    </button>
                    <button
                        onClick={() => {
                            setEditingField(null);
                            setContactDetails(contact!);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                    >
                        <X size={14} />
                    </button>
                </div>
            );
        }
        return (
            <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm text-gray-900 truncate">{typeof value === 'string' ? value : 'N/A'}</span>
            </div>
        );
    };

    const renderEmails = () => {
        const primaryEmail = contact?.email;
        const additionalEmails = contact?.additionalEmails || [];
        const allEmails = primaryEmail ? [primaryEmail, ...additionalEmails] : additionalEmails;

        return (
            <div className="space-y-1">
                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-500">Email</span>
                    </div>
                    {!addingEmail && !editingField && (
                        <button
                            onClick={() => setAddingEmail(true)}
                            className="text-purple-500 hover:text-purple-700 text-sm flex items-center"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
                
                {/* Add Email Form */}
                {addingEmail && (
                    <div className="space-y-2 pl-6 py-2 border-t border-gray-100">
                        <input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Enter email address"
                        />
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleAddEmail}
                                disabled={isLoading || !newEmail.trim()}
                                className={`p-1 text-sm rounded transition-colors ${isLoading || !newEmail.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                            >
                                {isLoading ? '...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setAddingEmail(false)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Email List */}
                {allEmails.map((email, index) => {
                    // Handle both string and object email formats
                    const emailValue = typeof email === 'string' ? email : email.email;
                    const isPrimary = index === 0 && primaryEmail !== null;
                    
                    // If editing this email, show edit form
                    if (editingField === `email-${index}`) {
                        return (
                            <div key={index} className="space-y-2 pl-6 py-2 border-t border-gray-100">
                                <input
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    placeholder="Enter email address"
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={async () => {
                                            if (!newEmail.trim()) return;
                                            
                                            if (isPrimary) {
                                                // Update primary email
                                                const updatedContactResponse = await updateContactById(contact!.id, {
                                                    email: newEmail
                                                });
                                                setContact(updatedContactResponse);
                                                setContactDetails(updatedContactResponse);
                                            } else {
                                                // Update additional email
                                                const updatedEmails = [...(contact?.additionalEmails || [])];
                                                const emailIndex = index - (primaryEmail ? 1 : 0);
                                                
                                                if (typeof updatedEmails[emailIndex] === 'string') {
                                                    updatedEmails[emailIndex] = newEmail;
                                                } else {
                                                    updatedEmails[emailIndex] = {
                                                        email: newEmail
                                                    };
                                                }
                                                
                                                const updatedContactResponse = await updateContactById(contact!.id, {
                                                    additionalEmails: updatedEmails
                                                });
                                                
                                                setContact(updatedContactResponse);
                                                setContactDetails(updatedContactResponse);
                                            }
                                            
                                            setNewEmail('');
                                            setEditingField(null);
                                        }}
                                        disabled={isLoading || !newEmail.trim()}
                                        className={`p-1 text-sm rounded transition-colors ${isLoading || !newEmail.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                                    >
                                        {isLoading ? '...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingField(null);
                                            setNewEmail('');
                                        }}
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    
                    // Display mode
                    return (
                        <div key={index} className="relative flex items-center justify-between py-1 pl-6">
                            <div className="flex flex-col">
                                <span className="text-sm text-purple-600 truncate">{emailValue}</span>
                                {isPrimary && <span className="text-xs text-gray-500">Primary</span>}
                            </div>
                            <button
                                onClick={() => setShowEmailMenu(index === showEmailMenu ? null : index)}
                                className="p-1 text-gray-500 hover:text-purple-600"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {showEmailMenu === index && (
                                <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                                    <button
                                        onClick={() => {
                                            setEditingField(`email-${index}`);
                                            setNewEmail(emailValue);
                                            setShowEmailMenu(null);
                                        }}
                                        className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmail(index - (primaryEmail ? 1 : 0))}
                                        className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPhones = () => {
        const primaryPhone = contact?.phone;
        const additionalPhones = contact?.additionalPhones || [];
        const allPhones = primaryPhone ? [primaryPhone, ...additionalPhones] : additionalPhones;
    
        return (
            <div className="space-y-1">
                {/* Header */}
                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-500">Phone</span>
                    </div>
                    {!addingPhone && !editingField && (
                        <button
                            onClick={() => setAddingPhone(true)}
                            className="text-purple-500 hover:text-purple-700 text-sm flex items-center"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
    
                {/* Add Phone Form */}
                {addingPhone && (
                    <div className="space-y-2 pl-6 py-2 border-t border-gray-100">
                        <input
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Enter phone number"
                        />
                        <div className="flex items-center space-x-2">
                            <select
                                value={newPhoneLabel}
                                onChange={(e) => setNewPhoneLabel(e.target.value)}
                                className="flex-1 p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="Mobile">Mobile</option>
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Landline">Landline</option>
                            </select>
                            <button
                                onClick={handleAddPhone}
                                disabled={isLoading || !newPhone.trim()}
                                className={`p-1 text-sm rounded transition-colors ${isLoading || !newPhone.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                            >
                                {isLoading ? '...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setAddingPhone(false)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
    
                {/* Phone List */}
                {allPhones.map((phone, index) => {
                    const phoneObj = typeof phone === 'string'
                        ? { phone, phoneLabel: index === 0 ? 'Primary' : 'Mobile' }
                        : phone;
                    const isPrimary = index === 0 && primaryPhone !== null;
    
                    // If editing this phone, show edit form instead of display
                    if (editingField === `phone-${index}`) {
                        return (
                            <div key={index} className="space-y-2 pl-6 py-2 border-t border-gray-100">
                                <input
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="w-full p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    placeholder="Enter phone number"
                                />
                                {!isPrimary && (
                                    <select
                                        value={newPhoneLabel}
                                        onChange={(e) => setNewPhoneLabel(e.target.value)}
                                        className="w-full p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="Mobile">Mobile</option>
                                        <option value="Home">Home</option>
                                        <option value="Work">Work</option>
                                        <option value="Landline">Landline</option>
                                    </select>
                                )}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={async () => {
                                            if (!newPhone.trim()) return;
    
                                            if (isPrimary) {
                                                await handleUpdateContact('phone', newPhone);
                                            } else {
                                                const updatedPhones = [...(contact?.additionalPhones || [])];
                                                const phoneIndex = index - (primaryPhone ? 1 : 0);
                                                updatedPhones[phoneIndex] = {
                                                    phone: newPhone,
                                                    phoneLabel: newPhoneLabel
                                                };
                                                await updateContactById(contact!.id, {
                                                    additionalPhones: updatedPhones
                                                });
                                                setContact(prev => prev ? {
                                                    ...prev,
                                                    additionalPhones: updatedPhones
                                                } : null);
                                            }
    
                                            setNewPhone('');
                                            setNewPhoneLabel('Mobile');
                                            setEditingField(null);
                                        }}
                                        disabled={isLoading || !newPhone.trim()}
                                        className={`p-1 text-sm rounded transition-colors ${isLoading || !newPhone.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                                    >
                                        {isLoading ? '...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingField(null);
                                            setNewPhone('');
                                            setNewPhoneLabel('Mobile');
                                        }}
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    }
    
                    // Display mode
                    return (
                        <div key={index} className="relative flex items-center justify-between py-1 pl-6">
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-900 truncate">{phoneObj.phone}</span>
                                <span className="text-xs text-gray-500">{isPrimary ? 'Primary' : phoneObj.phoneLabel}</span>
                            </div>
                            <button
                                onClick={() => setShowPhoneMenu(index === showPhoneMenu ? null : index)}
                                className="p-1 text-gray-500 hover:text-purple-600"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {showPhoneMenu === index && (
                                <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                                    <button
                                        onClick={() => {
                                            setEditingField(`phone-${index}`);
                                            setNewPhone(phoneObj.phone);
                                            setNewPhoneLabel(phoneObj.phoneLabel);
                                            setShowPhoneMenu(null);
                                        }}
                                        className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePhone(index - (primaryPhone ? 1 : 0), isPrimary)}
                                        className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTags = () => {
        const tags = contact?.tags || [];
        if (editingField === 'tags') {
            return (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="flex-1 p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                            placeholder="New tag"
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={!newTag.trim() || isLoading}
                            className="p-1 text-purple-500 hover:text-purple-700 disabled:text-gray-400 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setEditingField(null)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-wrap gap-2 py-1">
                {tags.length > 0 ? (
                    tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
                        >
                            {tag}
                        </span>
                    ))
                ) : (
                    <button
                        onClick={() => setEditingField('tags')}
                        className="text-purple-500 hover:text-purple-700 text-sm flex items-center"
                    >
                        <Plus size={16} className="mr-1" /> Add Tag
                    </button>
                )}
            </div>
        );
    };


    return (
        <div className="h-full w-full max-w-md bg-white flex flex-col overflow-hidden font-sans px-6">
            {/* Contact Header */}
            {contact && (
                <div className="py-4 flex flex-col items-center border-b border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium text-xl mb-2">
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {contact.firstName} {contact.lastName}
                        </h2>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 my-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
                {isLoading && !contact ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : contact ? (
                    <>
                        {/* Personal Info */}
                        <div>
                            <button
                                onClick={() => toggleSection('personal')}
                                className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                            >
                                <span>Personal Info</span>
                                {collapsedSections.personal ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.personal && (
                                <div className="mt-2 space-y-1">
                                    {renderEmails()}
                                    {/* Divider with small horizontal padding */}
                                    <div className="px-2 py-1">
                                    </div>
                                    {renderPhones()}
                                </div>
                            )}
                        </div>

                        <hr className="border-gray-200" />

                        {/* Address */}
                        <div>
                            <button
                                onClick={() => toggleSection('address')}
                                className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                            >
                                <span>Address</span>
                                {collapsedSections.address ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.address && (
                                <div className="mt-2 space-y-1">
                                    {renderField('address1', 'Street')}
                                    {renderField('city', 'City')}
                                    {renderField('state', 'State')}
                                    {renderField('country', 'Country')}
                                    {renderField('postalCode', 'Postal Code')}
                                </div>
                            )}
                        </div>

                        <hr className="border-gray-200" />

                        {/* Tags */}
                        <div>
                            <button
                                onClick={() => toggleSection('tags')}
                                className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                            >
                                <span>Tags ({contact.tags.length})</span>
                                {collapsedSections.tags ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.tags && (
                                <div className="mt-2">{renderTags()}</div>
                            )}
                        </div>

                        {/* DND Settings */}
                        <div>
                            <button
                                onClick={() => toggleSection('dnd')}
                                className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                            >
                                <span>DND Settings</span>
                                {collapsedSections.dnd ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.dnd && contact.dndSettings && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm text-gray-500">DND Enabled</span>
                                        <span className="text-sm text-gray-900">{contact.dnd ? 'Yes' : 'No'}</span>
                                    </div>
                                    {Object.entries(contact.dndSettings).map(([channel, settings]) => (
                                        <div key={channel} className="flex items-center justify-between py-1 pl-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">{channel}</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.status === 'active'}
                                                    onChange={(e) => handleDndUpdate(
                                                        channel as keyof DndSettings,
                                                        e.target.checked ? 'active' : 'inactive'
                                                    )}
                                                    disabled={dndLoading === channel}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer  
                                                    peer-checked:bg-purple-600
                                                    after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                                                    after:bg-white after:border-gray-300 after:border
                                                    after:rounded-full after:h-5 after:w-5 after:transition-all
                                                    peer-checked:after:translate-x-full peer-checked:after:border-white">
                                                </div>
                                                {dndLoading === channel && (
                                                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {contact.additionalPhones.length > 0 && <hr className="border-gray-200" />}

                        {/* Additional Info */}
                        {contact.additionalPhones.length > 0 && (
                            <div>
                                <button
                                    onClick={() => toggleSection('additional')}
                                    className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                                >
                                    <span>Additional Info ({contact.additionalPhones.length})</span>
                                    {collapsedSections.additional ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                                {!collapsedSections.additional && (
                                    <div className="mt-2 space-y-1">
                                        {renderField('source', 'Source')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Date Footer */}
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar size={16} className="mr-2" />
                                <span>{formatDate(contact.dateAdded)}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-sm">No contact selected</p>
                    </div>
                )}
            </div>
            <Toaster position="top-right" />
        </div>
    );
}

 interface Contact {
    id: string;
    tags: string[];
    dateAdded: string;
    type: string;
    locationId: string;
    firstName: string;
    firstNameLowerCase: string;
    fullNameLowerCase: string;
    lastName: string;
    lastNameLowerCase: string;
    email?: string;
    emailLowerCase?: string;
    phone?: string;
    address1?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    source?: string;
    createdBy?: {
        source: string;
        channel: string;
        sourceId: string;
        timestamp: string;
    };
    dateUpdated?: string;
    customFields: Array<Record<string, any>>;
    additionalEmails: AdditionalEmail[];
    additionalPhones?: AdditionalPhone[]
    dnd?: boolean;
    dndSettings?: DndSettings
}
interface DndSettings {
    Call: {
        status: "inactive" | "active";
        message: string;
        code: string;
    };
    Email: {
        status: "inactive" | "active";
        message: string;
        code: string;
    };
    SMS: {
        status: "inactive" | "active";
        message: string;
        code: string;
    };
    GMB: {
        status: "inactive" | "active";
        message: string;
        code: string;
    };
    FB: {
        status: "inactive" | "active";
        message: string;
        code: string;
    };
}
interface AdditionalPhone {
    phone: string;
    phoneLabel: string;
}
interface AdditionalEmail {
    email: string;
}