'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, ChevronDown, ChevronUp, MoreVertical, Plus, X, Calendar, Trash as TrashIcon, Pencil as EditIcon, FileText as NotesIcon, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateContactById, getContactById, getContactNotes, createContactNote, updateContactNote, deleteContactNote } from "@/lib/api";
import toast, { Toaster } from 'react-hot-toast';
import { ContactNote } from '@/types/notes';
import { formatDistanceToNow } from 'date-fns';
import NoteSidebar from './NoteSidebar';

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
    const [isNoteSidebarOpen, setIsNoteSidebarOpen] = useState(false);
    
    // Notes related state
    const [notes, setNotes] = useState<ContactNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<ContactNote | null>(null);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteBody, setNoteBody] = useState('');
    const [showNotesSection, setShowNotesSection] = useState(false);
    
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
                "email": newEmail
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

            const isAllInactive = Object.values(updatedSettings).every((setting: any) => setting.status === 'inactive');


            // Simulate POST request - replace with your actual API endpoint
            const updatedContactResponse = await updateContactById(contact.id, {
                dnd: !isAllInactive,
                dndSettings: updatedSettings
            });

            // Update local state after successful request
            setContact(updatedContactResponse);

            // Update overall DND status if any channel is active
            const anyActive = Object.values(updatedContactResponse.dndSettings).some((setting: any) => setting.status === 'active');
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
            <div 
                key={key} 
                className="flex items-center justify-between py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                onClick={() => setEditingField(key)}
            >
                <span className="text-[12px] text-gray-500">{label}</span>
                <span className="text-[12px] text-gray-900 truncate">{typeof value === 'string' ? value : 'N/A'}</span>
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
                        <Mail size={14} className="text-gray-500" />
                        <span className="text-[12px] text-gray-500">Email</span>
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
                                                    updatedEmails[emailIndex] = {
                                                        email: newEmail
                                                    };
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
                                <span className="text-[12px] text-purple-600 truncate">{emailValue}</span>
                                {isPrimary && <span className="text-[12px] text-gray-500">Primary</span>}
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
                        <Phone size={14} className="text-gray-500" />
                        <span className="text-[12px] text-gray-500">Phone</span>
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
                                <span className="text-[12px] text-gray-900 truncate">{phoneObj.phone}</span>
                                <span className="text-[12px] text-gray-500">{isPrimary ? 'Primary' : phoneObj.phoneLabel}</span>
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
                    <div className="flex items-center space-x-1">
                        <input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="w-40 p-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                            placeholder="New tag"
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={!newTag.trim() || isLoading}
                            className="text-purple-500 hover:text-purple-700 disabled:text-gray-400 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setEditingField(null)}
                            className="p-0 text-gray-500 hover:text-gray-700"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className='flex flex-col'>
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
                    ) : null}


                </div>
                <button
                    onClick={() => setEditingField('tags')}
                    className="mt-2 w-20 h-6 text-white rounded-sm hover:text-purple-100 text-[12px] flex items-center justify-center bg-gradient-to-r from-[#7B2FF2] to-[#4B8CFF] "
                >
                    <Plus size={14} className="mr-1" /> Add Tag
                </button>
            </div>

        );
    };

    // Fetch notes
    const fetchNotes = async () => {
        if (!contactId) return;
        
        setNotesLoading(true);
        setNoteError(null);
        try {
            const response = await getContactNotes(contactId);
            setNotes(response.notes || []);
        } catch (err) {
            setNoteError('Failed to load notes');
            console.error(err);
        } finally {
            setNotesLoading(false);
        }
    };

    // Toggle notes section and fetch notes when opened
    useEffect(() => {
        if (showNotesSection) {
            fetchNotes();
        }
    }, [showNotesSection, contactId]);

    // Handle note creation
    const handleCreateNote = async () => {
        if (!noteBody.trim() || !contactId) return;

        setNotesLoading(true);
        setNoteError(null);
        try {
            const response = await createContactNote(contactId, {
                body: noteBody,
                userId: currentUser?.id,
            });
            
            // Add the new note to the list
            setNotes([response.note, ...notes]);
            setNoteBody('');
            setIsEditingNote(false);
            toast.success('Note created successfully');
        } catch (err) {
            setNoteError('Failed to create note');
            toast.error('Failed to create note');
            console.error(err);
        } finally {
            setNotesLoading(false);
        }
    };

    // Handle note update
    const handleUpdateNote = async () => {
        if (!selectedNote || !noteBody.trim() || !contactId) return;

        setNotesLoading(true);
        setNoteError(null);
        try {
            const response = await updateContactNote(contactId, selectedNote.id, {
                body: noteBody,
                userId: currentUser?.id,
            });
            
            // Update the note in the list
            setNotes(notes.map(note => 
                note.id === selectedNote.id ? response.note : note
            ));
            setNoteBody('');
            setSelectedNote(null);
            setIsEditingNote(false);
            toast.success('Note updated successfully');
        } catch (err) {
            setNoteError('Failed to update note');
            toast.error('Failed to update note');
            console.error(err);
        } finally {
            setNotesLoading(false);
        }
    };

    // Handle note deletion
    const handleDeleteNote = async (noteId: string) => {
        if (!contactId) return;
        
        if (window.confirm('Are you sure you want to delete this note?')) {
            setNotesLoading(true);
            setNoteError(null);
            try {
                await deleteContactNote(contactId, noteId);
                
                // Remove the note from the list
                setNotes(notes.filter(note => note.id !== noteId));
                
                // Reset state if the deleted note was selected
                if (selectedNote?.id === noteId) {
                    setSelectedNote(null);
                    setNoteBody('');
                    setIsEditingNote(false);
                }
                toast.success('Note deleted successfully');
            } catch (err) {
                setNoteError('Failed to delete note');
                toast.error('Failed to delete note');
                console.error(err);
            } finally {
                setNotesLoading(false);
            }
        }
    };

    // Edit note helper
    const handleEditNote = (note: ContactNote) => {
        setSelectedNote(note);
        setNoteBody(note.body);
        setIsEditingNote(true);
    };

    // New note helper
    const handleNewNote = () => {
        setSelectedNote(null);
        setNoteBody('');
        setIsEditingNote(true);
    };

    // Cancel editing helper
    const handleCancelNote = () => {
        setSelectedNote(null);
        setNoteBody('');
        setIsEditingNote(false);
    };

    // Format date helper for notes
    const formatNoteDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (e) {
            return 'Unknown date';
        }
    };

    // Render notes section
    const renderNotesSection = () => {
        if (!showNotesSection) return null;

        return (
            <div className="absolute inset-0 bg-white z-10 flex flex-col h-full">
                {/* Notes Header */}
                <div className="flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center">
                        <button
                            onClick={() => setShowNotesSection(false)}
                            className="ml-2 mr-3 p-1 rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="flex mt-6 text-lg font-medium">
                            {isEditingNote
                                ? selectedNote
                                    ? 'Edit Note'
                                    : 'New Note'
                                : selectedNote
                                    ? 'Note Details'
                                    : `Notes (${notes.length})`
                            }
                        </h2>
                    </div>
                    <div className="flex">
                        {!isEditingNote && !selectedNote && (
                            <button
                                onClick={handleNewNote}
                                className="p-2 rounded-full hover:bg-gray-100 mr-2"
                                aria-label="Add note"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Note Error Message */}
                {noteError && (
                    <div className="bg-red-50 text-red-700 p-3 text-sm mx-4 mt-2 rounded">
                        {noteError}
                    </div>
                )}
                
                {/* Notes Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {notesLoading && notes.length === 0 ? (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : isEditingNote ? (
                        <div className="space-y-3">
                            <textarea
                                value={noteBody}
                                onChange={(e) => setNoteBody(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[180px]"
                                placeholder="Write your note here..."
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={handleCancelNote}
                                    className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={selectedNote ? handleUpdateNote : handleCreateNote}
                                    disabled={!noteBody.trim() || notesLoading}
                                    className={`px-4 py-2 text-sm rounded-md ${
                                        !noteBody.trim() || notesLoading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[#7B2FF2] to-[#4B8CFF] text-white hover:bg-purple-700'
                                    }`}
                                >
                                    {notesLoading ? 'Saving...' : selectedNote ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : selectedNote ? (
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="flex items-center text-sm text-purple-600 mb-4"
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                <span>Back to all notes</span>
                            </button>
                            <div className="border border-gray-200 rounded-md p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs text-gray-500">
                                        {formatNoteDate(selectedNote.dateAdded ?? "")}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditNote(selectedNote)}
                                            className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteNote(selectedNote.id)}
                                            className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{selectedNote.body}</p>
                            </div>
                        </div>
                    ) : notes.length > 0 ? (
                        <div className="space-y-3">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className="border border-gray-200 rounded-md p-3 cursor-pointer hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">
                                            {formatNoteDate(note.dateAdded ?? "")}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditNote(note);
                                                }}
                                                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNote(note.id);
                                                }}
                                                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm truncate mt-1">{note.body}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                            <p className="mb-4">No notes yet</p>
                            <button
                                onClick={handleNewNote}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-[#7B2FF2] to-[#4B8CFF] text-white rounded-md hover:bg-purple-700"
                            >
                                Add a note
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full max-w-md bg-white flex flex-col overflow-hidden font-sans px-2 relative">
            {/* Contact Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-1.5 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium text-base">
                            {contact?.firstName?.[0]}{contact?.lastName?.[0]}
                        </div>
                        <div className='flex flex-col items-start min-w-0 flex-1'>
                            <span className="text-[13px] font-semibold text-gray-900 truncate w-full">{contact?.firstName} {contact?.lastName}</span>
                            {contact?.email && (
                                <a href={`mailto:${contact.email}`} className="text-[#2563eb] text-[12px] hover:underline truncate w-full">{contact.email}</a>
                            )}
                        </div>
                        <div className="ml-auto flex items-center flex-shrink-0">
                            <button 
                                onClick={() => {
                                    setShowNotesSection(true);
                                    fetchNotes();
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#2563eb] border border-gray-200 hover:bg-gray-100"
                            >
                                <NotesIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 my-2 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 space-y-5 px-2">
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
                                <span className='text-[13px]'>Personal Info</span>
                                {collapsedSections.personal ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.personal && (
                                <div className="mt-0 space-y-0">
                                    {renderEmails()}
                                    {/* Divider with small horizontal padding */}
                                    <div className="px-2 py-0">
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
                                className="w-full flex items-center justify-between py-0 text-medium font-medium text-gray-700"
                            >
                                <span className='text-[13px]'>Address</span>
                                {collapsedSections.address ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.address && (
                                <div className="mt-1 space-y-0">
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
                                className="w-full flex items-center justify-between py-0 text-medium font-medium text-gray-700"
                            >
                                <span className='text-[13px]'>Tags ({contact.tags.length})</span>
                                {collapsedSections.tags ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.tags && (
                                <div className="mt-2">{renderTags()}</div>
                            )}
                        </div>
                        <hr className="border-gray-200" />

                        {/* DND Settings */}
                        <div>
                            <button
                                onClick={() => toggleSection('dnd')}
                                className="w-full flex items-center justify-between py-0 text-medium font-medium text-gray-700"
                            >
                                <div className="flex items-center">
                                    <span className='text-[13px]'>DND Settings</span>
                                    {contact?.dnd && (
                                        <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 rounded-full">
                                            Active
                                        </span>
                                    )}
                                    {contact?.dndSettings && !contact?.dnd && (
                                        <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                {collapsedSections.dnd ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            {!collapsedSections.dnd && (
                                <div className="mt-2 space-y-2">
                                    {contact?.dndSettings ? (
                                        <>
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-[12px] text-gray-500">DND Status</span>
                                                <span className={`text-[12px] font-medium ${contact?.dnd ? 'text-red-600' : 'text-green-600'}`}>
                                                    {contact?.dnd ? 'Do Not Contact' : 'Available for Contact'}
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-100 pt-2">
                                                <div className="mb-2 text-[11px] text-gray-400">Channel Settings</div>
                                                {Object.entries(contact.dndSettings || {}).map(([channel, settings]) => (
                                                    <div key={channel} className="flex items-center justify-between py-1.5 pl-4">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[12px] text-gray-500">{channel}</span>
                                                            {settings.status === 'active' && (
                                                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                                            )}
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
                                                            <div className="w-10 h-5 bg-gray-200 rounded-full peer  
                                                                peer-checked:bg-red-500
                                                                after:content-[''] after:absolute after:top-0.0 after:left-[2px]
                                                                after:bg-white after:border-gray-300 after:border
                                                                after:rounded-full after:h-5 after:w-5 after:transition-all
                                                                peer-checked:after:translate-x-full peer-checked:after:border-white">
                                                            </div>
                                                            {dndLoading === channel && (
                                                                <div className="ml-2 animate-spin h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                                                            )}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            {contact?.dnd && (
                                                <div className="mt-2 text-[11px] text-red-500 italic">
                                                    This contact will not receive communications through enabled DND channels.
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <p className="text-sm text-gray-500 mb-3">Configure communication preferences for this contact</p>
                                            <button
                                                onClick={() => {
                                                    // Initialize DND settings
                                                    const newDndSettings: DndSettings = {
                                                        Call: { status: 'inactive', message: 'Not configured', code: 'AUTO' },
                                                        Email: { status: 'inactive', message: 'Not configured', code: 'AUTO' },
                                                        SMS: { status: 'inactive', message: 'Not configured', code: 'AUTO' },
                                                        GMB: { status: 'inactive', message: 'Not configured', code: 'AUTO' },
                                                        FB: { status: 'inactive', message: 'Not configured', code: 'AUTO' }
                                                    };
                                                    
                                                    updateContactById(contact!.id, {
                                                        dnd: false,
                                                        dndSettings: newDndSettings
                                                    }).then(updatedContact => {
                                                        setContact(updatedContact);
                                                        setContactDetails(updatedContact);
                                                        toast.success('DND settings initialized');
                                                    }).catch(err => {
                                                        toast.error('Failed to initialize DND settings');
                                                        console.error(err);
                                                    });
                                                }}
                                                className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors font-medium"
                                            >
                                                Set Up DND Preferences
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                            {(contact?.additionalPhones?.length ?? 0) > 0 && <hr className="border-gray-200" />}

                            {/* Additional Info */}
                            {(contact?.additionalPhones?.length ?? 0) > 0 && (
                            <div>
                                <button
                                    onClick={() => toggleSection('additional')}
                                    className="w-full flex items-center justify-between py-2 text-medium font-medium text-gray-700"
                                >
                                    <span className='text-[13px]'>Additional Info ({contact?.additionalPhones?.length ?? 0})</span>
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
            
            {/* Notes Section */}
            {renderNotesSection()}
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