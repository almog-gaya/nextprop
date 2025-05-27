import React, { useState } from 'react';

interface DueDateCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DueDateCalendar({ isOpen, onClose }: DueDateCalendarProps) {
  if (!isOpen) return null;

  // Placeholder state for displayed months and selected dates
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Placeholder functions for calendar navigation and date selection
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToPreviousYear = () => {
     setCurrentMonth(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
  };

  const goToNextYear = () => {
     setCurrentMonth(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    // Placeholder date selection logic
    console.log('Date clicked:', date);
  };

  const renderMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 6 for Saturday
    const emptyCellsBefore = firstDayOfWeek;

    const days = [];
    for (let i = 0; i < emptyCellsBefore; i++) {
      days.push(null); // Placeholder for empty cells before the 1st
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span>{monthNames[month]} {year}</span>
        </div>
         <div className="grid grid-cols-7 text-xs text-gray-500 text-center">
            {dayNames.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {days.map((day, index) => (
            <button
              key={index}
              className={`text-center py-1 rounded ${day ? 'text-gray-700 hover:bg-blue-100' : 'text-gray-400 cursor-not-allowed'}`}
              disabled={!day}
              onClick={() => day && handleDateClick(day)}
            >
              {day ? day.getDate() : ''}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 p-4" style={{ width: '500px' }}>
      <div className="flex justify-between items-center mb-4">
        {/* Navigation for the first month */}
        <div className="flex items-center gap-1">
           <button onClick={goToPreviousYear} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">{'<<'}</button>
           <button onClick={goToPreviousMonth} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">{'<'}</button>
        </div>
         {/* Navigation for the second month */}
        <div className="flex items-center gap-1">
          <button onClick={goToNextMonth} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">{'>'}</button>
          <button onClick={goToNextYear} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">{'>>'}</button>
        </div>
      </div>

      <div className="flex gap-4">
        {renderMonth(currentMonth)}
        {renderMonth(nextMonth)}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Clear</button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Confirm</button>
      </div>
    </div>
  );
} 