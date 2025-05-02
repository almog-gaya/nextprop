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
    <header className="fixed top-0 left-0 md:left-50 right-0 bg-white h-16 border-b border-gray-200 z-50">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center h-full">
          <h2 className="text-lg font-semibold mt-6">{title}</h2>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search"
              className="h-7 w-40 pl-10 pr-4 rounded-lg bg-gray-50 border-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Notification Bell */}
          <button 
            onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)} 
            className="w-10 h-10 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center justify-center relative"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
          </button>

          {/* Balance */}
          <button className="h-10 px-4 rounded-lg bg-[#ECD0FFBF] hover:bg-[#e5c1ff] transition-colors duration-200 flex items-center">
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