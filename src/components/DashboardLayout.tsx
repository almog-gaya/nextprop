"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    // Allow time for skeleton loaders to render
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Close sidebar on window resize (if window becomes larger than mobile breakpoint)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="min-h-screen flex bg-[#F7F7F7]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-screen w-16 z-40">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sidebar isMobile isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="md:hidden fixed top-3 left-3 z-50 bg-white p-2 rounded-lg shadow-lg"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="h-5 w-5 text-gray-600" />
        </button>

        <Header title={title} />
        
        <main className="flex-1 pt-16 md:pl-16">
          {children}
        </main>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  );
} 