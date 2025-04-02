"use client";

import React, { useEffect, useState } from 'react';
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
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  ClockIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
  onClick?: () => void;
  rightIcon?: React.ReactNode;
}

interface SidebarDropdownProps {
  icon: React.ReactNode;
  text: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarLink = ({ icon, text, href, active, onClick, rightIcon }: SidebarLinkProps) => {
  const linkClass = classNames('flex items-center w-full px-4 py-3 my-1 rounded-lg mx-2 transition-all duration-200', {
    'bg-[#7c3aed] text-white font-medium shadow-md': active,
    'text-white/80 hover:bg-white/10 hover:text-white': !active
  });

  return (
    <Link href={href} passHref onClick={onClick}>
      <div className={linkClass}>
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="text-sm flex-grow">{text}</span>
        {rightIcon && <div className="w-5 h-5">{rightIcon}</div>}
      </div>
    </Link>
  );
};

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { icon: <HomeIcon className="w-5 h-5" />, text: 'Dashboard', href: '/' },
    { icon: <UserIcon className="w-5 h-5" />, text: 'Leads', href: '/leads' },
    { icon: <UserGroupIcon className="w-5 h-5" />, text: 'Contacts', href: '/contacts' },
    { icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, text: 'Messaging', href: '/messaging-embed' },
    { icon: <EnvelopeIcon className="w-5 h-5" />, text: 'SMS Campaigns', href: '/messaging-embed/campaigns' },
    { icon: <PhoneIcon className="w-5 h-5" />, text: 'Ringless Voicemails', href: '/ringless-voicemails' },
    { icon: <HomeModernIcon className="w-5 h-5" />, text: 'Properties', href: '/properties' },
    { icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />, text: 'Bulk Actions', href: '/bulk-actions' },
    { icon: <BoltIcon className="w-5 h-5" />, text: 'AI Agent', href: '/ai-agent' },
  ];

  const sidebarClass = classNames({
    "fixed top-0 left-0 h-screen w-64 flex flex-col bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] shadow-xl z-40": !isMobile,
    "sidebar-mobile": isMobile,
    "sidebar-mobile-open": isMobile && isOpen,
    "sidebar-mobile-closed": isMobile && !isOpen
  });

  return (
    <div className={sidebarClass}>
      {isMobile && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      )}
      
      {/* logo from public folder */}
      <div className="flex items-center justify-center py-4 bg-black/10 backdrop-blur-sm">
        <Image src="/logo_black.png" alt="Logo" width={200} height={100} />
      </div>
      
      {/* Navigation Links */}
      <div className="flex flex-col w-full px-2 overflow-y-auto py-4 flex-grow">
        {links.map((link) => (
          <SidebarLink
            key={link.href}
            icon={link.icon}
            text={link.text}
            href={link.href}
            active={pathname === link.href}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </div>

      {/* User Profile Footer */}
      <Link href="/settings">
        <div className="px-4 py-4 border-t border-white/10 hover:bg-white/5 transition-colors cursor-pointer mt-auto">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-[#7c3aed] flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">{user?.name || 'User'}</span>
              <span className="text-white/60 text-xs">{user?.email}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}