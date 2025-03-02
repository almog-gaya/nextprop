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
  HomeModernIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  active: boolean;
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

export default function Sidebar() {
  const pathname = usePathname();
  
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
      icon: <ChartBarIcon className="w-5 h-5" />, 
      text: 'Pipelines', 
      href: '/pipelines' 
    },
    { 
      icon: <CurrencyDollarIcon className="w-5 h-5" />, 
      text: 'Opportunities', 
      href: '/opportunities' 
    },
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