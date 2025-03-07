'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T | ((item: T) => string);
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  initialSortConfig?: SortConfig;
  onRowClick?: (item: T) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: (item: T) => string;
  actions?: React.ReactNode;
}

export default function DataTable<T>({
  data,
  columns,
  keyField,
  title,
  subtitle,
  emptyMessage = 'No data available',
  loading = false,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  initialSortConfig,
  onRowClick,
  showSearch = true,
  searchPlaceholder = 'Search...',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName,
  actions,
}: DataTableProps<T>) {
  // State
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSortConfig || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>(data);
  
  // Handle data changes
  useEffect(() => {
    setFilteredData(data);
    setCurrentPage(1); // Reset to first page when data changes
  }, [data]);
  
  // Reset pagination when changing items per page
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);
  
  // Get the key for a row
  const getRowKey = (item: T): string => {
    if (typeof keyField === 'function') {
      return keyField(item);
    }
    return String(item[keyField]);
  };
  
  // Handle column sorting
  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : sortConfig.direction === 'desc' ? null : 'asc';
    }
    
    setSortConfig(direction ? { key, direction } : null);
  };
  
  // Get cell value from accessor or direct property
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.accessor) {
      return column.accessor(item);
    }
    return item[column.key as keyof T];
  };
  
  // Sort and filter data
  const processedData = useMemo(() => {
    let result = [...filteredData];
    
    // Filter by search term if present
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item => {
        return columns.some(column => {
          const value = getCellValue(item, column);
          return value !== undefined && value !== null && 
            String(value).toLowerCase().includes(lowerSearchTerm);
        });
      });
    }
    
    // Sort if a sort config exists
    if (sortConfig && sortConfig.direction) {
      const { key, direction } = sortConfig;
      const column = columns.find(col => col.key === key);
      
      result.sort((a, b) => {
        if (!column) return 0;
        
        let aValue = getCellValue(a, column);
        let bValue = getCellValue(b, column);
        
        // Handle different data types
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [filteredData, searchTerm, sortConfig, columns]);
  
  // Get current page data
  const currentData = useMemo(() => {
    if (!pagination) return processedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage, pagination]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(processedData.length / itemsPerPage);
  }, [processedData, itemsPerPage]);
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  // Render sort indicator
  const renderSortIndicator = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    if (!sortConfig || sortConfig.key !== column.key) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-primary-600" />
      : <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (!pagination || processedData.length <= itemsPerPage) return null;
    
    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center">
          <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">
            Show:
          </label>
          <select
            id="itemsPerPage"
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="ml-4 text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center p-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`
                inline-flex items-center justify-center h-8 w-8 rounded-md
                ${currentPage === number 
                  ? 'bg-primary-600 text-white' 
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
              `}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center p-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };
  
  // Render loading skeleton
  const renderSkeleton = () => {
    return (
      <div className="animate-pulse">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div key={index} className="border-b border-gray-200 py-4">
            <div className="flex space-x-4 px-6">
              {columns.map((column, colIndex) => (
                <div 
                  key={colIndex} 
                  className="h-4 bg-gray-200 rounded"
                  style={{ 
                    width: column.width || `${100 / columns.length}%`, 
                    minWidth: column.minWidth || '40px'
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`border-b border-gray-200 px-6 py-4 ${headerClassName}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {showSearch && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            )}
            
            {actions}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                    ${column.headerClassName || ''}
                  `}
                  style={{ 
                    width: column.width, 
                    minWidth: column.minWidth, 
                    maxWidth: column.maxWidth 
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="ml-1">
                        {renderSortIndicator(column)}
                      </span>
                    )}
                    {column.filterable && (
                      <span className="ml-1">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className={`bg-white divide-y divide-gray-200 ${bodyClassName}`}>
            {loading ? (
              renderSkeleton()
            ) : currentData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map(item => (
                <tr 
                  key={getRowKey(item)}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${rowClassName ? rowClassName(item) : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`
                        px-6 py-4 whitespace-nowrap text-sm 
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        ${column.cellClassName || ''}
                      `}
                    >
                      {column.render 
                        ? column.render(item)
                        : String(getCellValue(item, column) ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
} 