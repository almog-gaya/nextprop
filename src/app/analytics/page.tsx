"use client";

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  BellSlashIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { CalendarIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/contexts/AuthContext';
import MessageDetailsModal from '@/components/MessageDetailsModal';

const ANALYTICS_URL = '/api/reports/message-analytics';
const MESSAGE_DETAILS_URL = '/api/reports/message-details';

const getMessageDetailsUrl = (
  status: string,
  startDate: Date | null,
  endDate: Date | null,
  direction?: string,
  providerErrorCode?: string,
  skip: number = 0
) => {
  if (!startDate || !endDate) return '';
  
  const params = new URLSearchParams({
    status,
    limit: '20',
    skip: skip.toString(),
    includeTotalCount: 'true',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...(direction && { direction }),
    ...(providerErrorCode && { providerErrorCode })
  });

  return `${MESSAGE_DETAILS_URL}?${params.toString()}`;
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  percentage: number;
  iconBgColor: string;
  tooltipText?: string;
  errorCode?: string;
}

interface FilterOption {
  label: string;
  value: string;
}

const CustomDateInput = ({ value, onClick }: { value: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200"
  >
    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
    <span className="text-sm text-gray-600">{value}</span>
  </button>
);

const CustomHeader = ({
  date,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: any) => (
  <div className="flex flex-col px-2 py-2">
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
      <span className="text-sm font-medium text-gray-900">
        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <div className="w-12"></div>
    </div>
    <div className="flex justify-between px-1">
      <div className="grid grid-cols-7 w-full">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-xs font-medium text-gray-600 w-8 h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, percentage, iconBgColor, tooltipText, errorCode }: StatCardProps) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-full ${iconBgColor}`}>
        {icon}
      </div>
      {tooltipText && (
        <button className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      )}
    </div>
    <div className="mt-4">
      <div className="flex items-baseline">
        <h3 className="text-4xl font-semibold text-gray-700">{value}</h3>
        <span className={`ml-2 text-sm ${percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {percentage}%
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{title}</p>
  
    </div>
  </div>
);

const FilterWidget = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filterOptions: FilterOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'This Year', value: 'thisYear' },
  ];

  const handleFilterClick = (value: string) => {
    if (selectedFilters.includes(value)) {
      setSelectedFilters(selectedFilters.filter(f => f !== value));
    } else {
      setSelectedFilters([...selectedFilters, value]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="space-y-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterClick(option.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedFilters.includes(option.value)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={() => setSelectedFilters([])}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    status: string;
    direction?: string;
    providerErrorCode?: string;
  }>({
    isOpen: false,
    title: '',
    url: '',
    status: '',
    direction: undefined,
    providerErrorCode: undefined
  });
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const fetchAnalytics = async () => {
    if (!user?.locationId) {
      console.log('No location id found, skipping analytics fetch');
      return {
        results: {
          optOut: { value: 0 },
          errorCodeCounts: {
            buckets: {
              is_30007: { value: 0 },
              not_30007: { value: 0 }
            }
          },
          read: { value: 0 },
          pending: { value: 0 },
          undelivered: { value: 0 },
          received: { value: 0 },
          delivered: { value: 0 },
          failed: { value: 0 },
          unfulfilled: { value: 0 },
          clicked: { value: 0 },
          sent: { value: 0 }
        },
        total: 0
      };
    }

    try {
      const response = await fetch(
        `${ANALYTICS_URL}?startDate=${startDate?.toISOString()}&endDate=${endDate?.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  };
 
  useEffect(() => {
    setStartDate(new Date('2025-04-15'));
    setEndDate(new Date('2025-04-17'));
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching analytics data...');
        if (!user) {
          console.log('User not authenticated');
          return;
        }
        if (!startDate || !endDate) {
          console.log('Date range not selected');
          return;
        }
        const data = await fetchAnalytics();
        console.log('Analytics data received:', data);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [user, startDate, endDate]);

  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return '';
    return `${start.toISOString().split('T')[0]} → ${end.toISOString().split('T')[0]}`;
  };

  if (!mounted) {
    return null;
  }

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const handleStatCardClick = (title: string, status: string, direction?: string, providerErrorCode?: string) => {
    const url = getMessageDetailsUrl(status, startDate, endDate, direction, providerErrorCode, 0);
    if (!url) return;
    
    setSelectedModal({
      isOpen: true,
      title,
      url,
      status,
      direction,
      providerErrorCode
    });
  };

  return (
    <DashboardLayout title="Analytics">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Messaging Analytics</h1>
          <div className="flex items-center gap-4">
            <DatePicker
              selected={startDate}
              onChange={(dates: any) => {
                const [start, end] = dates;
                setStartDate(start);
                setEndDate(end);
              }}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              customInput={<CustomDateInput value={formatDateRange(startDate, endDate)} onClick={() => { }} />}
              renderCustomHeader={CustomHeader}
              calendarClassName="shadow-lg border border-gray-200 rounded-lg"
              showPopperArrow={false}
              monthsShown={1}
              inline={false}
              dayClassName={(date: Date) =>
                "text-sm w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              }
              maxDate={new Date()}
              minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              showMonthYearPicker={false}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              dateFormat="MMM d, yyyy"
              withPortal={false}
              shouldCloseOnSelect={false}
            />
            <div className="relative" ref={filterContainerRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <span className="text-sm text-gray-600 mr-2">Filters</span>
                {isFilterOpen ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
              <FilterWidget
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !user ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Please log in to view analytics</p>
          </div>
        ) : !user.locationId ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No location ID found. Please contact support to set up your location.</p>
          </div>
        ) : !startDate || !endDate ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a date range to view analytics</p>
          </div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => handleStatCardClick('Sent Messages', 'sent', 'outbound')}>
              <StatCard
                icon={<PaperAirplaneIcon className="h-6 w-6 text-green-600" />}
                title="Sent"
                value={analyticsData?.results?.sent?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.sent?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-green-50"
                tooltipText="Total messages sent"
              />
            </div>
            <div onClick={() => handleStatCardClick('Delivered Messages', 'delivered', 'outbound')}>
              <StatCard
                icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
                title="Delivered"
                value={analyticsData?.results?.delivered?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.delivered?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-green-50"
                tooltipText="Successfully delivered messages"
              />
            </div>
            <div onClick={() => handleStatCardClick('Failed Messages', 'unfulfilled')}>
              <StatCard
                icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-600" />}
                title="Failed"
                value={analyticsData?.results?.failed?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.failed?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-red-50"
                tooltipText="Failed message deliveries"
                errorCode={analyticsData?.results?.errorCodeCounts?.buckets?.not_30007?.value ? "21266" : undefined}
              />
            </div>
            <div onClick={() => handleStatCardClick('Error[30007] Messages', 'failed', undefined, '30007')}>
              <StatCard
                icon={<XCircleIcon className="h-6 w-6 text-red-600" />}
                title="Error[30007]"
                value={analyticsData?.results?.errorCodeCounts?.buckets?.is_30007?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.errorCodeCounts?.buckets?.is_30007?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-red-50"
                tooltipText="Messages with error code 30007"
                errorCode="30007"
              />
            </div>
            <div onClick={() => handleStatCardClick('Received Messages', 'received', 'inbound')}>
              <StatCard
                icon={<EnvelopeIcon className="h-6 w-6 text-green-600" />}
                title="Received"
                value={analyticsData?.results?.received?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.received?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-green-50"
                tooltipText="Messages received"
              />
            </div>
            <div onClick={() => handleStatCardClick('Opted-Out Messages', 'optOut')}>
              <StatCard
                icon={<BellSlashIcon className="h-6 w-6 text-yellow-600" />}
                title="Opted-Out"
                value={analyticsData?.results?.optOut?.value || 0}
                percentage={calculatePercentage(analyticsData?.results?.optOut?.value || 0, analyticsData?.total || 0)}
                iconBgColor="bg-yellow-50"
                tooltipText="Users who opted out"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load analytics data</p>
          </div>
        )}
      </div>

      <MessageDetailsModal
        status={selectedModal.status}
        isOpen={selectedModal.isOpen}
        onClose={() => setSelectedModal({ isOpen: false, title: '', url: '', status: '', direction: undefined, providerErrorCode: undefined })}
        title={selectedModal.title}
        fetchUrl={selectedModal.url}
      />

      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
          background-color: white;
        }
        .react-datepicker__header {
          background-color: white;
          border-bottom: none;
          padding: 0;
        }
        .react-datepicker__month {
          margin: 0;
          padding: 0 0.5rem 0.5rem;
        }
        .react-datepicker__day {
          margin: 0;
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          border-radius: 9999px;
          color: #374151;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background-color: #3b82f6;
          color: white;
          border-radius: 9999px;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: transparent;
          color: #374151;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
          border-radius: 9999px;
        }
        .react-datepicker__day--outside-month {
          color: #9ca3af;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker-popper {
          padding-top: 0.5rem;
        }
        .react-datepicker__month-container {
          float: left;
          margin-right: 1rem;
        }
        .react-datepicker__month-container:last-child {
          margin-right: 0;
        }
      `}</style>
    </DashboardLayout>
  );
} 