'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

// Button variants
export type ButtonVariant = 
  | 'primary' 
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'warning'
  | 'danger'
  | 'success'
  | 'link';

// Button sizes
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button props interface
export interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    // Base button classes that are common to all variants
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium rounded-md
      focus:outline-none focus:ring-2 focus:ring-offset-2
      transition-colors duration-200 ease-in-out
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}
    `;

    // Size-specific classes
    const sizeClasses = {
      xs: 'text-xs px-2 py-1 gap-1',
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2',
      xl: 'text-lg px-6 py-3 gap-2.5',
    };

    // Variant-specific classes
    const variantClasses = {
      primary: `
        bg-primary-600 text-white hover:bg-primary-700
        focus:ring-primary-500
      `,
      secondary: `
        bg-neutral-100 text-neutral-900 hover:bg-neutral-200
        focus:ring-neutral-500
      `,
      outline: `
        bg-transparent text-primary-600 border border-primary-600
        hover:bg-primary-50
        focus:ring-primary-500
      `,
      ghost: `
        bg-transparent text-neutral-700 hover:bg-neutral-100
        focus:ring-neutral-500
      `,
      warning: `
        bg-warning-500 text-white hover:bg-warning-600
        focus:ring-warning-500
      `,
      danger: `
        bg-error-600 text-white hover:bg-error-700
        focus:ring-error-500
      `,
      success: `
        bg-success-600 text-white hover:bg-success-700
        focus:ring-success-500
      `,
      link: `
        bg-transparent text-primary-600 hover:text-primary-800 underline
        focus:ring-0 p-0
      `,
    };

    // Combine all classes
    const buttonClasses = `
      ${baseClasses}
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `;

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton; 