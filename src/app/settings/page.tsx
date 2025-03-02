"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ApiKeyManager from '@/components/ApiKeyManager';
import { useAuth } from '@/context/AuthContext';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { authState, logout } = useAuth();
  const { user } = authState;
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
    }, 500);
  };
  
  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        {/* Account Info */}
        <div className="nextprop-card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          
          <div className="flex items-start space-x-3 mb-6">
            <div className="h-12 w-12 bg-[#7c3aed] rounded-full flex items-center justify-center text-white">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Email</h3>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Member Since</h3>
              <p className="mt-1 text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Last Login</h3>
              <p className="mt-1 text-gray-900">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isLoggingOut ? (
                'Logging out...'
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Log out
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* API Key Manager */}
        <ApiKeyManager />
      </div>
    </DashboardLayout>
  );
} 