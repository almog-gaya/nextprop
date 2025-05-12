"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BellIcon, Cog6ToothIcon, ChevronDownIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotificationTray from '@/components/NotificationTray';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
}

interface SimpleContact { id: string; name: string; email?: string; phone?: string; }

export default function Header({ title }: HeaderProps) {
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SimpleContact[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Fetch suggestions (debounced)
  useEffect(() => {
    if (!searchValue.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchValue)}&limit=5`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const contactsRaw = data.contacts || [];
          const mapped: SimpleContact[] = contactsRaw.map((c: any) => ({
            id: c.id || c.contactId || c._id || '',
            name: c.name || c.contactName || c.firstName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
            email: c.email,
            phone: c.phone || c.phoneNumber,
          }));
          setSuggestions(mapped.filter(c => c.id && c.name));
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSelect = (contactId: string) => {
    setShowDropdown(false);
    setSearchValue('');
    router.push(`/contacts/${contactId}`);
  };

  return (
    <header className="fixed top-0 left-0 md:left-50 right-0 bg-white h-16 border-b border-gray-200 z-50">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center h-full">
          <h2 className="text-lg font-semibold mt-6">{title}</h2>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const query = searchValue.trim();
              if (query) {
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="search"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true); }}
                placeholder="Search"
                className="h-7 w-40 pl-10 pr-4 rounded-lg bg-gray-50 border-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none"
              />

              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                      onMouseDown={() => handleSelect(s.id)}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email || s.phone}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>

          {/* Notification Bell */}
          <button 
            onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)} 
            className="w-10 h-10 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center justify-center relative"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Balance
          <button className="h-10 px-4 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center">
            <span className="text-sm font-medium text-gray-700">Balance</span>
          </button> */}

          {/* Profile Dropdown */}
          <ProfileDropdown user={user} onLogout={logout} />
        </div>
      </div>

      {/* Notification Tray */}
      <NotificationTray 
        isOpen={isNotificationTrayOpen} 
        onClose={() => setIsNotificationTrayOpen(false)} 
      />
    </header>
  );
} 