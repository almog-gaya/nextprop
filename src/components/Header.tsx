"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
   
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <header className="bg-white shadow-sm mobile-header-padding py-5 flex items-center justify-between border-b border-gray-200">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold nextprop-gradient-text">{title}</h1>
        {user && (
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Welcome back, <span className="font-semibold">{user.name || user.email.split('@')[0]}</span>!
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-6">  
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 pl-3 border-l border-gray-200 focus:outline-none"
          >
            <div className="h-8 w-8 md:h-10 md:w-10 nextprop-gradient rounded-full flex items-center justify-center text-white font-bold shadow-md">
              <UserCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="hidden md:flex md:flex-col md:items-start">
              <span className="text-[#1e1b4b] font-semibold text-sm">{user?.name || 'User'}</span>
              <span className="text-gray-500 text-xs">
                {user?.email ? user.email.split('@')[0] : 'user'}
              </span>
            </div>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              
              <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Cog6ToothIcon className="h-4 w-4 mr-2 text-gray-500" />
                Settings
              </Link>
              
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-gray-500" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 