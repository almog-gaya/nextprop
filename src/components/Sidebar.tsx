"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  DocumentTextIcon,
  ChevronDownIcon,
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
  { 
    icon: <DocumentTextIcon className="w-5 h-5" />, 
    text: 'Campaigns', 
    isDropdown: true,
    subItems: [
      { icon: <EnvelopeIcon className="w-4 h-4" />, text: 'SMS Campaigns', href: '/messaging-embed/campaigns' },
      { icon: <PhoneIcon className="w-4 h-4" />, text: 'Ringless Voicemails', href: '/ringless-voicemails' },
    ]
  },
  { icon: <BoltIcon className="w-5 h-5" />, text: 'AI Agent', href: '/ai-agent' },
  { icon: <ClockIcon className="w-5 h-5" />, text: 'Automations', href: '/automations' }
];

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [activeItem, setActiveItem] = useState<string | null>(pathname);
  
  // Track navigation attempts
  const navigationInProgress = useRef(false);
  const navigationQueue = useRef<string[]>([]);

  // Force navigation with direct window.location change if needed
  const forceNavigation = useCallback((href: string) => {
    if (href !== pathname) {
      // Window location change is more reliable but less smooth
      window.location.href = href;
    }
  }, [pathname]);

  // Process navigation queue
  useEffect(() => {
    if (navigationQueue.current.length > 0 && !navigationInProgress.current) {
      const nextDestination = navigationQueue.current[0];
      navigationQueue.current = navigationQueue.current.slice(1);
      
      if (nextDestination !== pathname) {
        navigationInProgress.current = true;
        
        // Try router first, fall back to location change
        try {
          router.push(nextDestination);
          
          // Set a timeout to force navigation if router doesn't respond
          setTimeout(() => {
            if (navigationInProgress.current) {
              forceNavigation(nextDestination);
            }
          }, 300);
        } catch (e) {
          forceNavigation(nextDestination);
        }
        
        // Reset the flag after navigation completes or times out
        setTimeout(() => {
          navigationInProgress.current = false;
        }, 500);
      }
    }
  }, [pathname, router, forceNavigation, navigationQueue.current.length]);

  const toggleSubMenu = useCallback((itemText: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  }, []);

  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Set active state immediately for visual feedback
    setActiveItem(href);
    
    // Close mobile menu if open
    if (isMobile && onClose) {
      onClose();
    }
    
    // Add to navigation queue if not already in progress
    if (href !== pathname) {
      navigationQueue.current.push(href);
      
      // Force click on any underlying anchor tag
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }, [isMobile, onClose, pathname]);

  const isItemActive = useCallback((href: string) => {
    return pathname === href || activeItem === href;
  }, [pathname, activeItem]);

  const isParentActive = useCallback((item: any) => {
    if (item.href && pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname === subItem.href);
    }
    return false;
  }, [pathname]);

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

      <div className="flex items-center justify-center border-b-2 border-[#0000001A] pb-3 px-[30px]">
        <a 
          href="/"
          onClick={(e) => handleNavigation('/', e)} 
          className="flex items-center cursor-pointer"
        >
          <Image
            src="/logo.png"
            alt="NextProp AI"
            width={149}
            height={38.52}
            priority
            className="h-7 w-auto"
          />
        </a>
      </div>

      <div className="flex flex-col items-center space-y-1 w-full mt-4">
        {navigation.map((item, index) => {
          const isActive = isParentActive(item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems[item.text] || isActive;
          
          return (
            <React.Fragment key={item.href || `dropdown-${index}`}>
              <div className="w-full flex flex-col ml-4 pr-4">
                {item.isDropdown ? (
                  <div
                    className={classNames(
                      "w-full h-10 flex items-center justify-between rounded-lg transition-all duration-200 cursor-pointer",
                      {
                        "bg-white text-black": isActive,
                        "bg-transparent text-black hover:bg-white/50": !isActive,
                      }
                    )}
                    onClick={(e) => toggleSubMenu(item.text, e)}
                  >
                    <div className="flex items-center">
                      <span className="ml-2">{item.icon}</span>
                      <span className="text-[14px] font-normal ml-2">{item.text}</span>
                    </div>
                    <ChevronDownIcon 
                      className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                ) : (
                  <a
                    href={item.href || '/'}
                    onClick={(e) => handleNavigation(item.href || '/', e)}
                    className={classNames(
                      "w-full h-10 flex items-center justify-between rounded-lg transition-all duration-200 cursor-pointer",
                      {
                        "bg-white text-black": isActive,
                        "text-[#1C1C1C] hover:text-[#1C1C1C] hover:bg-white/50": !isActive
                      }
                    )}
                  >
                    <div className="flex items-center">
                      <span className="ml-2">{item.icon}</span>
                      <span className="text-[14px] font-normal ml-2">{item.text}</span>
                    </div>
                  </a>
                )}
                
                {hasSubItems && isExpanded && (
                  <div className="mt-1 flex flex-col space-y-1 w-full">
                    {item.subItems.map((subItem: any) => {
                      const isSubActive = isItemActive(subItem.href);
                      return (
                        <a
                          key={subItem.href}
                          href={subItem.href}
                          onClick={(e) => handleNavigation(subItem.href, e)}
                          className={classNames(
                            "w-full pl-6 h-8 flex items-center justify-start rounded-lg transition-all duration-200 text-sm cursor-pointer",
                            {
                              "bg-white text-black": isSubActive,
                              "text-black hover:text-black hover:bg-white/50": !isSubActive
                            }
                          )}
                        >
                          <span className="mr-2">{subItem.icon}</span>
                          <span className="text-[14px] font-normal">{subItem.text}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Settings at the bottom */}
      <a
        href="/settings"
        onClick={(e) => handleNavigation('/settings', e)}
        className={classNames(
          "w-full mx-6 mb-12 mt-auto max-w-46 h-10 flex items-center justify-start rounded-lg transition-all duration-200 cursor-pointer",
          pathname === "/settings"
            ? "bg-white text-black"
            : "text-[#1C1C1C] hover:text-[#1C1C1C] hover:bg-white/50"
        )}
      >
        <div className='relative flex'>
          <Cog6ToothIcon className="w-5 h-5 ml-2" />
          <span className="text-[14px] font-normal ml-2">Settings</span>
        </div>
      </a>
    </div>
  );
}