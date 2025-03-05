"use client";

import React from 'react';

export function StatsCardSkeleton() {
  return (
    <div className="nextprop-card animate-pulse shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-end justify-between">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  const columnWidths = ['25%', '20%', '15%', '20%', '20%'];

  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array(columns).fill(0).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded" style={{ width: columnWidths[i] }}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array(rows).fill(0).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array(columns).fill(0).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  {colIndex === columns - 1 ? (
                    <div className="flex justify-end space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    </div>
                  ) : colIndex === 3 ? (
                    <div className="inline-flex px-2 py-1 rounded-full bg-gray-200 h-5 w-16"></div>
                  ) : (
                    <div className="h-4 bg-gray-200 rounded" style={{ width: columnWidths[colIndex] }}></div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CallLogsSkeleton() {
  return (
    <div className="nextprop-card animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-gray-200 rounded w-40"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      </div>
      
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CallFormSkeleton() {
  return (
    <div className="nextprop-card animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-gray-200 rounded w-48"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}

export function ContactListSkeleton() {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array(8).fill(0).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-36"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-3">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PropertyListingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex items-center mb-2">
                <div className="h-5 bg-gray-200 rounded w-1/3 mr-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/4 mr-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/5"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded-full w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpportunityListSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-10 bg-gray-200 rounded w-40"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-px bg-gray-100 w-full my-2"></div>
            <div className="flex justify-between mt-2">
              <div className="h-8 bg-gray-200 rounded-full w-8"></div>
              <div className="h-8 bg-gray-200 rounded-full w-8"></div>
              <div className="h-8 bg-gray-200 rounded-full w-8"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessagingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-96px)] animate-pulse bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Contacts sidebar */}
      <div className="md:col-span-4 border-r border-gray-200 overflow-hidden h-full">
        <div className="p-3 border-b border-gray-200">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-50px)]">
          {Array(8).fill(0).map((_, index) => (
            <div key={index} className="p-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Message thread */}
      <div className="md:col-span-8 flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="ml-3">
              <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        
        {/* Message area */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          <div className="space-y-4">
            {/* Messages */}
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg p-3 max-w-[80%] h-16"></div>
            </div>
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-lg p-3 max-w-[80%] h-10"></div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg p-3 max-w-[80%] h-20"></div>
            </div>
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-lg p-3 max-w-[80%] h-14"></div>
            </div>
          </div>
        </div>
        
        {/* Message input */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-1 h-12 bg-gray-200 rounded-md"></div>
            <div className="ml-3 h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadsPageSkeleton() {
  return (
    <div className="p-6 bg-gray-50 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {Array(5).fill(0).map((_, i) => (
                  <th key={i} className="py-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array(5).fill(0).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array(5).fill(0).map((_, colIndex) => (
                    <td key={colIndex} className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-full max-w-[100px]"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 