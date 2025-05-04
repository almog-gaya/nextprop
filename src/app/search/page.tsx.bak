import React, { Suspense } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

export const dynamic = 'force-dynamic';

interface Contact { id: string; name: string; email?: string; phone?: string; }
interface Property { id?: string; address?: string; city?: string; price?: number; }

function SearchClient() {
  'use client';

  const { useState, useEffect } = React;
  const { useSearchParams } = require('next/navigation');

  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const doSearch = async () => {
      if (!query) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        const filteredContacts = (data.contacts || []).filter((c: any) => c.email || c.phone);
        const filteredProps = (data.properties || []).filter((p: any) => p.address || p.city);
        setContacts(filteredContacts);
        setProperties(filteredProps);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [query]);

  return (
    <DashboardLayout title={`Search: "${query}"`}>
      <div className="p-6 space-y-8">
        {loading && <p className="text-gray-500">Searching...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {/* Contacts */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Contacts ({contacts.length})
              </h3>
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500">No contacts found.</p>
              ) : (
                <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
                  {contacts.map((c) => (
                    <li key={c.id} className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-600">{c.email || c.phone || 'No additional data'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Properties */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Properties ({properties.length})
              </h3>
              {properties.length === 0 ? (
                <p className="text-sm text-gray-500">No properties found.</p>
              ) : (
                <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
                  {properties.map((p, idx) => (
                    <li key={idx} className="px-4 py-3">
                      <p className="font-medium">{p.address || 'Unknown address'}</p>
                      <p className="text-xs text-gray-600">{p.city}</p>
                      {p.price && <p className="text-xs text-gray-600">${p.price.toLocaleString()}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {!loading && !error && contacts.length === 0 && properties.length === 0 && (
          <p className="text-gray-500">Try a different search term.</p>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SearchPageWrapper() {
  return <SearchClient />;
} 