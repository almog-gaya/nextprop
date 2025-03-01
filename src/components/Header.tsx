"use client";

import React from 'react';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between border-b border-gray-200">
      <h1 className="text-2xl font-extrabold nextprop-gradient-text">{title}</h1>
      
      <div className="flex items-center space-x-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent text-sm w-64"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
        
        <button className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors">
          <BellIcon className="h-6 w-6 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-[#8b5cf6] rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
          <div className="h-10 w-10 nextprop-gradient rounded-full flex items-center justify-center text-white font-bold shadow-md">
            <UserCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#1e1b4b] font-semibold text-sm">John Doe</span>
            <span className="text-gray-500 text-xs">Property Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
} 