"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BellIcon, Cog6ToothIcon, ChevronDownIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotificationTray from '@/components/NotificationTray';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 md:left-16 right-0 bg-white h-16 border-b border-gray-200 z-50">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="NextProp AI"
              width={120}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Center - Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search"
              className="h-8 w-[250px] pl-10 pr-4 rounded-lg bg-gray-50 border-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Add Button */}
          <button className="h-10 bg-gradient-to-r from-[#3045FF] to-[#9A04FF] hover:opacity-90 text-white rounded-lg transition-all duration-200 flex items-center text-sm font-medium">
            <div className="flex items-center gap-2 px-3">
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Add</span>
            </div>
            <div className="h-10 w-[2px] bg-black/20"></div>
            <div className="px-2">
              <ChevronDownIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>

          {/* Calendar Icon */}
          <button className="w-10 h-10 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>

          {/* Notification Bell */}
          <button 
            onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)} 
            className="w-10 h-10 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center justify-center relative"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Balance */}
          <button className="ml-10 h-10 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] px-4 transition-colors duration-200 flex items-center">
            <span className="text-sm font-medium text-gray-700">Balance</span>
          </button>

          {/* Profile Dropdown */}
          {user && <ProfileDropdown user={user} onLogout={logout} />}
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