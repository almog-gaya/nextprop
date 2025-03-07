'use client';

import React, { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export default function ResponsiveGrid({
  children,
  className = '',
  gap = 'md',
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1 sm:gap-2',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
  };

  // Build the responsive column classes
  let columnClasses = `grid-cols-${columns.default}`;
  
  if (columns.sm) {
    columnClasses += ` sm:grid-cols-${columns.sm}`;
  }
  
  if (columns.md) {
    columnClasses += ` md:grid-cols-${columns.md}`;
  }
  
  if (columns.lg) {
    columnClasses += ` lg:grid-cols-${columns.lg}`;
  }
  
  if (columns.xl) {
    columnClasses += ` xl:grid-cols-${columns.xl}`;
  }

  return (
    <div className={`
      grid
      ${columnClasses}
      ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
} 