'use client';

import React, { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

export default function ResponsiveContainer({
  children,
  className = '',
  padding = 'md',
  fullHeight = false,
  maxWidth = 'full',
  overflow = 'visible',
}: ResponsiveContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2 sm:px-3 sm:py-3',
    md: 'px-3 py-4 sm:px-4 sm:py-5',
    lg: 'px-4 py-6 sm:px-6 sm:py-8',
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const overflowClasses = {
    visible: 'overflow-visible',
    hidden: 'overflow-hidden',
    scroll: 'overflow-scroll',
    auto: 'overflow-auto',
  };

  const heightClass = fullHeight ? 'h-full' : '';

  return (
    <div className={`
      w-full
      ${maxWidthClasses[maxWidth]}
      ${paddingClasses[padding]}
      ${overflowClasses[overflow]}
      ${heightClass}
      ${className}
    `}>
      {children}
    </div>
  );
} 