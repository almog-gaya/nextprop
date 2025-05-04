"use client";

import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface WebhookResponse {
  timestamp: string;
  data: any;
}

export default function WebhooksPage() {
  const [webhookResponses, setWebhookResponses] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchWebhookResponses() {
    try {
      setLoading(true);
      const response = await axios.get('/api/webhook/voicemail');
      setWebhookResponses(response.data.responses);
      setError(null);
    } catch (err) {
      setError('Failed to load webhook responses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWebhookResponses();
    
    // Set up a polling interval to fetch new responses every 10 seconds
    const interval = setInterval(fetchWebhookResponses, 10000);
    
    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">VoiceDrop Webhook Responses</h1>
        <button 
          onClick={fetchWebhookResponses}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {loading && webhookResponses.length === 0 ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading webhook responses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
          <button
            onClick={fetchWebhookResponses}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : webhookResponses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No webhook responses yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Send a voicemail and wait for the webhook callback from VoiceDrop. Responses will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Latest Webhook Responses
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Showing the most recent {webhookResponses.length} responses from VoiceDrop.
            </p>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {webhookResponses.map((response, index) => (
              <div key={index} className="px-4 py-5 sm:p-6">
                <div className="mb-2 text-sm text-gray-500">
                  Received: {new Date(response.timestamp).toLocaleString()}
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 