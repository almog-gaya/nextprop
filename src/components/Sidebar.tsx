"use client";

import React, { useState } from 'react';
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
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
}

interface SidebarDropdownProps {
  icon: React.ReactNode;
  text: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const SidebarLink = ({ icon, text, href, active }: SidebarLinkProps) => {
  const linkClass = classNames('flex items-center w-full px-4 py-3 my-1 rounded-lg mx-2 transition-all duration-200', {
    'bg-[#7c3aed] text-white font-medium': active,
    'text-gray-300 hover:bg-gray-800 hover:text-white': !active
  });

  return (
    <Link href={href} passHref>
      <div className={linkClass}>
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="text-sm">{text}</span>
      </div>
    </Link>
  );
};

const SidebarDropdown = ({ icon, text, active, open, onClick, children }: SidebarDropdownProps) => {
  const dropdownClass = classNames('flex items-center w-full px-4 py-3 my-1 rounded-lg mx-2 transition-all duration-200 cursor-pointer', {
    'text-white font-medium': active,
    'text-gray-300 hover:bg-gray-800 hover:text-white': !active
  });

  return (
    <div>
      <div className={dropdownClass} onClick={onClick}>
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="text-sm">{text}</span>
        <div className="ml-auto">
          {open ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </div>
      </div>
      {open && (
        <div className="pl-8 pr-2 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const [pipelinesOpen, setPipelinesOpen] = useState(pathname.startsWith('/pipelines'));
  
  const links = [
    { 
      icon: <HomeIcon className="w-5 h-5" />, 
      text: 'Dashboard', 
      href: '/' 
    },
    { 
      icon: <UserGroupIcon className="w-5 h-5" />, 
      text: 'Contacts', 
      href: '/contacts' 
    },
    { 
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, 
      text: 'Messages', 
      href: '/messages' 
    },
    { 
      icon: <PhoneIcon className="w-5 h-5" />, 
      text: 'Ringless Voicemails', 
      href: '/calls' 
    },
    { 
      icon: <HomeModernIcon className="w-5 h-5" />, 
      text: 'Properties', 
      href: '/properties' 
    },
    { 
      icon: <CurrencyDollarIcon className="w-5 h-5" />, 
      text: 'Opportunities', 
      href: '/opportunities' 
    },
  ];

  const pipelineLinks = [
    {
      text: 'All Pipelines',
      href: '/pipelines'
    },
    {
      text: 'Distressed Homeowners',
      href: '/pipelines/distressed-homeowners'
    }
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-64 flex flex-col bg-[#1e1b4b] shadow-lg">
      <div className="mt-6 mb-10 px-4">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extrabold tracking-tight nextprop-gradient-text drop-shadow-sm">
              nextprop
            </span>
            <span className="text-xs font-semibold text-white tracking-[0.3em] uppercase mt-1">
              ai platform
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-full px-2">
        {links.map((link) => (
          <SidebarLink
            key={link.href}
            icon={link.icon}
            text={link.text}
            href={link.href}
            active={pathname === link.href}
          />
        ))}
        
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
            />
          ))}
        </SidebarDropdown>
{/* 
        <SidebarLink
          icon={<PhoneIcon className="w-5 h-5" />}
          text="Calls"
          href="/calls"
          active={pathname === '/calls'}
        /> */}
        <SidebarLink
          icon={<EnvelopeIcon className="w-5 h-5" />}
          text="Email Campaigns"
          href="/emails"
          active={pathname === '/emails' || pathname.startsWith('/emails/')}
        />
      </div>
      
      <div className="mt-auto mb-6 px-6">
        <div className="border-t border-gray-800 pt-4">
          <SidebarLink
            icon={<Cog6ToothIcon className="w-5 h-5" />}
            text="Settings"
            href="/settings"
            active={pathname === '/settings'}
          />
        </div>
      </div>
    </div>
  );
} 