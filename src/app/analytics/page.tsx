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

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  percentage: number;
  iconBgColor: string;
  tooltipText?: string;
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

const StatCard = ({ icon, title, value, percentage, iconBgColor, tooltipText }: StatCardProps) => (
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
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedFilters.includes(option.value)
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
  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartDate(new Date('2025-04-15'));
    setEndDate(new Date('2025-04-17'));
    setMounted(true);
  }, []);

  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return '';
    return `${start.toISOString().split('T')[0]} → ${end.toISOString().split('T')[0]}`;
  };

  if (!mounted) {
    return null;
  }

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
              customInput={<CustomDateInput value={formatDateRange(startDate, endDate)} onClick={() => {}} />}
              renderCustomHeader={CustomHeader}
              calendarClassName="shadow-lg border border-gray-200 rounded-lg"
              showPopperArrow={false}
              monthsShown={2}
              inline={false}
              dayClassName={date => 
                "text-sm w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={<PaperAirplaneIcon className="h-6 w-6 text-green-600" />}
            title="Sent"
            value={38}
            percentage={100}
            iconBgColor="bg-green-50"
            tooltipText="Total messages sent"
          />
          <StatCard
            icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
            title="Delivered"
            value={36}
            percentage={95}
            iconBgColor="bg-green-50"
            tooltipText="Successfully delivered messages"
          />
          <StatCard
            icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-600" />}
            title="Failed"
            value={2}
            percentage={5}
            iconBgColor="bg-red-50"
            tooltipText="Failed message deliveries"
          />
          <StatCard
            icon={<XCircleIcon className="h-6 w-6 text-red-600" />}
            title="Error[30007]"
            value={0}
            percentage={0}
            iconBgColor="bg-red-50"
            tooltipText="Messages with error code 30007"
          />
          <StatCard
            icon={<EnvelopeIcon className="h-6 w-6 text-green-600" />}
            title="Received"
            value={8}
            percentage={21}
            iconBgColor="bg-green-50"
            tooltipText="Messages received"
          />
          <StatCard
            icon={<BellSlashIcon className="h-6 w-6 text-yellow-600" />}
            title="Opted-Out"
            value={1}
            percentage={3}
            iconBgColor="bg-yellow-50"
            tooltipText="Users who opted out"
          />
        </div>
      </div>

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