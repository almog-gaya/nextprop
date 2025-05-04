"use client";

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fetchUrl: string;
  status: string;
  direction?: string;
  providerErrorCode?: string;
}

interface Message {
  id: string;
  from: string;
  phone: string;
  status: string;
  errorMessage?: string;
  errorCode?: string;
  createdAt: string;
  statusFailed: number;
  statusPending: number;
  statusDelivered: number;
  statusUndelivered: number;
  statusSent: number;
  error?: {
    provider?: {
      code: number;
      message: string;
    };
    code?: string;
    type?: string;
    msg?: string;
  };
}

export default function MessageDetailsModal({
  isOpen,
  onClose,
  title,
  fetchUrl,
  status,
  direction,
  providerErrorCode
}: MessageDetailsModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(20); // Default to 8 to match the API
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const totalPages = Math.ceil(totalCount / limit);

  // Add console log to debug status
  useEffect(() => {
    console.log('Current status:', status);
    console.log('Provider error code:', providerErrorCode);
    console.log('Messages:', messages);
  }, [status, providerErrorCode, messages]);

  // Check if any message has an error
  const hasErrorMessages = messages.some(message => 
    message.statusFailed === 1 || 
    message.error?.provider?.code || 
    message.error?.code
  );

  // Reset pagination state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(0);
      setTotalCount(0);
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && fetchUrl) {
      fetchMessages();
    }
  }, [isOpen, fetchUrl, currentPage]);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = currentPage * limit;
      let urlString = fetchUrl;
      
      // Handle both relative and absolute URLs
      if (urlString.startsWith('/')) {
        urlString = `${window.location.origin}${urlString}`;
      }
      
      const url = new URL(urlString);
      // Remove existing skip parameter if it exists
      url.searchParams.delete('skip');
      url.searchParams.set('skip', skip.toString());
      
      console.log('Fetching from URL:', url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      // Handle the response structure
      const messages = data.results || data.result || [];
      const totalCount = data.total || 0;
      
      setMessages(messages);
      setTotalCount(totalCount);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatus = (message: Message) => {
    if (message.statusFailed) return 'Failed';
    if (message.statusPending) return 'Pending';
    if (message.statusDelivered) return 'Delivered';
    if (message.statusUndelivered) return 'Undelivered';
    if (message.statusSent) return 'Sent';
    return 'Unknown';
  };

  const getErrorMessage = (message: Message) => {
    if (message.error?.provider?.message) {
      return message.error.provider.message;
    }
    if (message.error?.msg) {
      return message.error.msg;
    }
    return '';
  };

  const getErrorCode = (message: Message) => {
    if (message.error?.provider?.code) {
      return message.error.provider.code.toString();
    }
    if (message.error?.code) {
      return message.error.code;
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No messages found</p>
              </div>
            ) : (
              <div className="flex flex-col h-[600px]">
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {hasErrorMessages && (
                          <>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Error Code
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Error Message
                            </th>
                          </>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {messages.map((message) => (
                        <tr key={message.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getStatus(message)}
                          </td>
                          {hasErrorMessages && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getErrorCode(message)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getErrorMessage(message)}
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(message.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 px-4 border-t pt-4">
                  <div className="text-sm text-gray-700">
                    Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, totalCount)} of {totalCount} messages
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 