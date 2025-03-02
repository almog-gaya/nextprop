"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ApiKeyManager() {
  const { authState, updateGhlApiKey } = useAuth();
  const { user } = authState;
  
  const [apiKey, setApiKey] = useState(user?.ghlApiKey || '');
  const [locationId, setLocationId] = useState(user?.ghlLocationId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };
  
  const handleCancel = () => {
    setApiKey(user?.ghlApiKey || '');
    setLocationId(user?.ghlLocationId || '');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };
  
  const handleSave = async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateGhlApiKey(apiKey, locationId);
      setIsEditing(false);
      setSuccess('API key updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update API key');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="nextprop-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">GoHighLevel API Settings</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
            GoHighLevel API Key
          </label>
          {isEditing ? (
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="nextprop-input py-2 px-3 w-full rounded-md mt-1"
              placeholder="Enter your GoHighLevel API key"
              disabled={isLoading}
            />
          ) : (
            <div className="mt-1 py-2 px-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-700">{user?.ghlApiKey ? '••••••••' + user.ghlApiKey.slice(-4) : 'Not set'}</span>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
            GoHighLevel Location ID (optional)
          </label>
          {isEditing ? (
            <input
              type="text"
              id="locationId"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="nextprop-input py-2 px-3 w-full rounded-md mt-1"
              placeholder="Enter your GoHighLevel Location ID"
              disabled={isLoading}
            />
          ) : (
            <div className="mt-1 py-2 px-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-700">{user?.ghlLocationId || 'Not set'}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
            >
              Edit API Key
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 