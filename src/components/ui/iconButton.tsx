import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'text-gray-500 hover:text-purple-600 hover:bg-gray-100',
        primary: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50',
        destructive: 'text-red-600 hover:text-red-800 hover:bg-red-50',
        success: 'text-green-600 hover:text-green-800 hover:bg-green-50',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, tooltip, ...props }, ref) => {
    return (
      <button
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        title={tooltip}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants }; 