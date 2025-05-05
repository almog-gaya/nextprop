"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: 'primary' | 'secondary' | 'gray';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = '',
  color = 'primary',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };
  
  const colorClasses = {
    primary: 'border-[var(--nextprop-primary)]',
    secondary: 'border-[var(--nextprop-secondary)]',
    gray: 'border-gray-600'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
        <div className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-4 ${colorClasses[color]} border-t-transparent animate-spin`}></div>
      </div>
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600">{text}</p>
      )}
    </div>
  );
} 