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
} from '@heroicons/react/24/outline';

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
  onClick?: () => void;
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

const SidebarLink = ({ icon, text, href, active, onClick }: SidebarLinkProps) => {
  const linkClass = classNames('flex items-center w-full px-4 py-3 my-1 rounded-lg mx-2 transition-all duration-200', {
    'bg-[#7c3aed] text-white font-medium': active,
    'text-gray-300 hover:bg-gray-800 hover:text-white': !active
  });

  return (
    <Link href={href} passHref onClick={onClick}>
      <div className={linkClass}>
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="text-sm">{text}</span>
      </div>
    </Link>
  );
};
 

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [pipelinesOpen, setPipelinesOpen] = useState(pathname.startsWith('/pipelines'));
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
     
    // Check if document.cookie is accessible
    if (typeof document.cookie === 'undefined') {
      console.error('document.cookie is undefined - possible SSR issue');
      return;
    }

    // Split and log all cookies
    const cookies = document.cookie.split(';');
 
    // Look for our specific cookie
    const ghlCookie = cookies.find(cookie => {
      const trimmed = cookie.trim();
       return trimmed.startsWith('ghl_user_type=');
    });

 
    if (ghlCookie) {
      const value = ghlCookie.split('=')[1]?.trim();
       setUserType(value);
    } else {
      console.log('No ghl_user_type cookie found');
      setUserType(null);
    } 
  }, []);

  const links = [
    { icon: <HomeIcon className="w-5 h-5" />, text: 'Dashboard', href: '/' },
    { icon: <UserIcon className="w-5 h-5" />, text: 'Leads', href: '/leads' },
    { icon: <UserGroupIcon className="w-5 h-5" />, text: 'Contacts', href: '/contacts' },
    { icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, text: 'Messaging', href: '/messaging-embed' },
    { icon: <EnvelopeIcon className="w-5 h-5" />, text: 'SMS Campaigns', href: '/messaging-embed/campaigns' },
    { icon: <PhoneIcon className="w-5 h-5" />, text: 'Ringless Voicemails', href: '/ringless-voicemails' },
    { icon: <HomeModernIcon className="w-5 h-5" />, text: 'Properties', href: '/properties' },
    { icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />, text: 'Bulk Actions', href: '/bulk-actions' },
    // killed that for now , no need atm
    // { icon: <CurrencyDollarIcon className="w-5 h-5" />, text: 'Opportunities', href: '/opportunities' },
    // { icon: <ClockIcon className="w-5 h-5" />, text: 'Automations', href: '/automations' },
  ];

 
  if (userType === 'Company') {
    links.push({
      icon: <ChartBarIcon className="w-5 h-5" />,
      text: 'Create Sub Acc',
      href: '/auth/signup'
    });
  }

  const pipelineLinks = [
    { text: 'All Pipelines', href: '/pipelines' },
    { text: 'Distressed Homeowners', href: '/pipelines/distressed-homeowners' }
  ];

  const sidebarClass = classNames({
    "fixed top-0 left-0 h-screen w-64 flex flex-col bg-[#1e1b4b] shadow-lg z-40": !isMobile,
    "sidebar-mobile": isMobile,
    "sidebar-mobile-open": isMobile && isOpen,
    "sidebar-mobile-closed": isMobile && !isOpen
  });

  return (
    <div className={sidebarClass}>
      {isMobile && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-[#322b70] rounded-md transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      )}
      
      {/* logo from public folder */}
      <div className="flex items-center justify-center py-4">
        <Image src="/logo_black.png" alt="Logo" width={200} height={100} />
      </div>
      
      <div className="flex flex-col w-full px-2 overflow-y-auto">
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
        
        {/* Uncomment if you want the Pipelines dropdown back
        <SidebarDropdown
          icon={<ChartBarIcon className="w-5 h-5" />}
          text="Pipelines"
          active={pathname.startsWith('/pipelines')}
          open={pipelinesOpen}
          onClick={() => setPipelinesOpen(!pipelinesOpen)}
        >
          {pipelineLinks.map((link) => (
            <SidebarLink
              key={link.href}
              icon={<div className="w-1 h-1 rounded-full bg-gray-400" />}
              text={link.text}
              href={link.href}
              active={pathname === link.href}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </SidebarDropdown>
        */}

        {/* <SidebarLink
          icon={<EnvelopeIcon className="w-5 h-5" />}
          text="Email Campaigns"
          href="/emails"
          active={pathname === '/emails' || pathname.startsWith('/emails/')}
          onClick={isMobile ? onClose : undefined}
        /> */}
      </div>
      
      <div className="mt-auto mb-6 px-6">
        <div className="border-t border-gray-800 pt-4">
          <SidebarLink
            icon={<Cog6ToothIcon className="w-5 h-5" />}
            text="Settings"
            href="/settings"
            active={pathname === '/settings'}
            onClick={isMobile ? onClose : undefined}
          />
        </div>
      </div>
    </div>
  );
}