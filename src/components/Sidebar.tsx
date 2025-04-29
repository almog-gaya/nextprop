"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import classNames from 'classnames';
import { 
  HomeIcon, 
  UserGroupIcon, 
  PhoneIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  HomeModernIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ClockIcon,
  UserIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { icon: <HomeIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Dashboard', href: '/' },
  { icon: <UserIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Leads', href: '/leads' },
  { icon: <UserGroupIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Contacts', href: '/contacts' },
  { icon: <ChatBubbleLeftRightIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Messaging', href: '/messaging-embed' },
  { icon: <EnvelopeIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'SMS Campaigns', href: '/messaging-embed/campaigns' },
  { icon: <PhoneIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Ringless Voicemails', href: '/ringless-voicemails' },
  { icon: <HomeModernIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Properties', href: '/properties' },
  { icon: <BoltIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'AI Agent', href: '/ai-agent' },
  { icon: <ClockIcon className="w-5 h-5" strokeWidth={2.5} />, text: 'Automations', href: '/automations' }
];

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const sidebarClass = classNames(
    "fixed top-0 left-0 h-screen flex flex-col items-center py-4 z-40",
    "bg-gradient-to-r from-[#3045FF] to-[#9A04FF]",
    {
      "w-16": !isMobile,
      "w-full": isMobile,
      "translate-x-0": isOpen,
      "-translate-x-full": isMobile && !isOpen,
    }
  );

  return (
    <div className={sidebarClass}>
      {isMobile && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex flex-col items-center space-y-1 w-full mt-12">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200",
                {
                  "bg-[#01010B] text-white": isActive,
                  "text-white hover:text-white hover:bg-black/5": !isActive
                }
              )}
              onClick={isMobile ? onClose : undefined}
              title={item.text}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>

      {/* Settings at the bottom */}
      <Link
        href="/settings"
        className={classNames(
          "mb-12 mt-auto w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200",
          pathname === "/settings"
            ? "bg-[#01010B] text-white"
            : "text-white hover:text-white hover:bg-black/5"
        )}
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5" strokeWidth={2.5} />
      </Link>
    </div>
  );
}