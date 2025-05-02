"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  { icon: <HomeIcon className="w-5 h-5" />, text: 'Dashboard', href: '/' },
  { icon: <UserIcon className="w-5 h-5" />, text: 'Leads', href: '/leads' },
  { icon: <UserGroupIcon className="w-5 h-5" />, text: 'Contacts', href: '/contacts' },
  { icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, text: 'Messaging', href: '/messaging-embed' },
  { icon: <EnvelopeIcon className="w-5 h-5" />, text: 'SMS Campaigns', href: '/messaging-embed/campaigns' },
  { icon: <PhoneIcon className="w-5 h-5" />, text: 'Ringless Voicemails', href: '/ringless-voicemails' },
  { icon: <HomeModernIcon className="w-5 h-5" />, text: 'Properties', href: '/properties' },
  { icon: <BoltIcon className="w-5 h-5" />, text: 'AI Agent', href: '/ai-agent' },
  { icon: <ClockIcon className="w-5 h-5" />, text: 'Automations', href: '/automations' }
];

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const sidebarClass = classNames(
    "fixed top-0 left-0 h-screen flex flex-col items-center py-4 z-40",
    "bg-gradient-to-r from-[#B5BCFF] to-[#E6C2FF]",
    {
      "w-50": !isMobile,
      "w-212": isMobile,
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

      <div className="flex items-start mt-2 border-b border-[#0000001A] pb-3 mr-5" style={{ width: '172px', marginLeft: '17px',  }}>
        <Link href="/" className="flex items-start">
          <Image
            src="/logo.png"
            alt="NextProp AI"
            width={149}
            height={38.52}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </div>

      <div className="flex flex-col items-center space-y-1 w-full mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "w-45 h-10 flex items-center justify-start rounded-lg transition-all duration-200",
                {
                  "bg-[#FFFFFF] text-black": isActive,
                  "text-[#1C1C1C] hover:text-[#1C1C1C] hover:bg-black/5": !isActive
                }
              )}
              onClick={isMobile ? onClose : undefined}
              title={item.text}
            >
              <span className="ml-2">{item.icon}</span>
              <span className="text-[14px] font-normal ml-2">{item.text}</span>
            </Link>
          );
        })}
      </div>

      {/* Settings at the bottom */}
      <Link
        href="/settings"
        className={classNames(
          "mb-12 mt-auto w-45 h-10 flex items-center justify-start rounded-lg transition-all duration-200",
          pathname === "/settings"
            ? "bg-[#FFFFFF] text-black"
            : "text-[#1C1C1C] hover:text-[#1C1C1C] hover:bg-black/5"
        )}
        title="Settings"
      >
        <div className='relative flex'>
          <Cog6ToothIcon className="w-5 h-5 ml-2" />
          <span className="text-[14px] font-normal ml-2">Settings</span>
        </div>
      </Link>
    </div>
  );
}