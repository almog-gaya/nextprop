import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';

interface NotificationTrayProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationTray: React.FC<NotificationTrayProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    )},
    { id: 'missed-calls', label: 'Missed Calls', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    )},
    { id: 'tasks', label: 'Tasks', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    )},
    { id: 'sms', label: 'SMS', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    )},
    { id: 'mentions', label: 'Mentions', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    )}
  ];

  if (!isOpen) return null;

  const handleTabClick = (tabId: string) => {
    setSelectedTab(tabId);
  };

  const getTabContent = (tabId: string) => {
    switch (tabId) {
      case 'all':
        return 'All Notifications';
      case 'missed-calls':
        return 'Missed Calls';
      case 'tasks':
        return 'Tasks';
      case 'sms':
        return 'SMS Messages';
      case 'mentions':
        return 'Mentions';
      default:
        return 'No Records Found';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/5"
        onClick={onClose}
      />
          
      <div className="fixed top-16 right-0 w-[480px] h-[calc(95vh-72px)] z-50">
        {/* Tooltip pointer */}
        <div 
          className="absolute left-[210px] -top-2 w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200"
        />
        
        <div className="h-full bg-white shadow-xl flex flex-col border border-gray-200 rounded-md">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-medium text-gray-900">Notifications</h2>
              <span className="text-[13px] text-gray-500 mb-4">(0 Unread)</span>
            </div>
            <button 
              className="text-[#0A855C] text-[13px] hover:text-[#097a54] font-medium mb-4"
            >
              Mark all as Read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex w-full overflow-x-auto no-scrollbar border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={classNames(
                  'px-4 py-2.5 flex items-center gap-1.5 text-[13px] whitespace-nowrap transition-colors',
                  selectedTab === tab.id
                    ? 'text-[#7c3aed] border-b-2 border-[#7c3aed] font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center text-[13px] text-gray-500">
            {getTabContent(selectedTab)}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationTray; 