'use client';

import React, { useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// A higher-order component to wrap buttons that are not yet fully functional
export function withDevelopmentState<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    message?: string;
    showNotice?: boolean;
    fallbackFn?: () => void;
  } = {}
) {
  const { 
    message = 'This feature is currently under development', 
    showNotice = true,
    fallbackFn
  } = options;
  
  return function WrappedComponent(props: P) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Ensure tooltip is hidden when user clicks outside
    useEffect(() => {
      if (!showTooltip) return;
      
      const handleClickOutside = () => setShowTooltip(false);
      document.addEventListener('click', handleClickOutside);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [showTooltip]);
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (fallbackFn) {
        fallbackFn();
      }
      
      if (showNotice) {
        setShowTooltip(true);
      }
    };
    
    return (
      <div className="relative inline-block">
        <div onClick={handleClick}>
          <Component {...props} />
        </div>
        
        {showTooltip && showNotice && (
          <div 
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-blue-400 mr-1 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 overflow-hidden h-2 w-4">
              <div className="bg-gray-800 rotate-45 transform origin-top-left h-2 w-2 translate-x-3 -translate-y-1"></div>
            </div>
          </div>
        )}
      </div>
    );
  };
}

// Component to replace non-functional buttons while maintaining UI consistency
interface NotImplementedButtonProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  message?: string;
  onClick?: () => void;
}

export function NotImplementedButton({
  children,
  className = '',
  icon,
  message = 'This feature is currently under development',
  onClick
}: NotImplementedButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(true);
    
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className={`${className} relative overflow-hidden`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
        <span 
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 opacity-70"
          title="Under development"
        ></span>
      </button>
      
      {showTooltip && (
        <div 
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg"
          onClick={() => setShowTooltip(false)}
        >
          <div className="flex items-start">
            <InformationCircleIcon className="h-4 w-4 text-blue-400 mr-1 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 overflow-hidden h-2 w-4">
            <div className="bg-gray-800 rotate-45 transform origin-top-left h-2 w-2 translate-x-3 -translate-y-1"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Object to track which buttons have been implemented
export const implementedFeatures = {
  // Dashboard
  'add-opportunity': false,
  'import-opportunities': false,
  'manage-fields': false,
  'advanced-filters': false,
  'sort-opportunities': false,
  
  // Calls
  'bulk-upload-contacts': true,
  'view-webhook-responses': true,
  
  // Emails
  'create-campaign': false,
  'view-campaigns': false,
  
  // Sidebar navigation
  'messaging': false,
  'calendar': false,
  'reports': false,
  'settings': true,
}; 