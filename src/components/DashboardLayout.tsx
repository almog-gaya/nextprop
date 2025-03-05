"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Allow time for skeleton loaders to render
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1 flex flex-col">
        <Header title={title} />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <div className="nextprop-gradient h-1 w-32 rounded-full mb-1"></div>
          </div>
          
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
} 