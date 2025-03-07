'use client';

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  preventScroll?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  preventScroll = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle mounting state (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, preventScroll]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEsc]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!closeOnClickOutside) return;
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  // Animation classes for entering/exiting
  const backdropAnimationClass = isOpen 
    ? 'animate-backdrop-fade-in' 
    : 'animate-backdrop-fade-out';
  
  const modalAnimationClass = isOpen 
    ? 'animate-modal-zoom-in' 
    : 'animate-modal-zoom-out';

  // Don't render anything on the server
  if (!mounted) return null;

  // Don't render if not open (but keep the component for animation)
  if (!isOpen && !mounted) return null;

  // Define modal content
  const modalContent = (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdropAnimationClass} ${className}`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity`}
        aria-hidden="true"
      />
      
      <div 
        ref={modalRef}
        className={`
          relative bg-white rounded-lg shadow-xl overflow-hidden
          w-full transform transition-all
          ${sizeClasses[size]}
          ${modalAnimationClass}
          ${contentClassName}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className={`px-6 py-4 ${bodyClassName}`}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className={`px-6 py-4 border-t border-gray-200 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render the modal outside the normal DOM hierarchy
  return createPortal(modalContent, document.body);
}

// Add some simple animation keyframes
const modalAnimations = `
@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes backdropFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modalZoomIn {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

@keyframes modalZoomOut {
  from { 
    opacity: 1; 
    transform: scale(1); 
  }
  to { 
    opacity: 0; 
    transform: scale(0.95); 
  }
}

.animate-backdrop-fade-in {
  animation: backdropFadeIn 0.2s ease-out forwards;
}

.animate-backdrop-fade-out {
  animation: backdropFadeOut 0.2s ease-in forwards;
}

.animate-modal-zoom-in {
  animation: modalZoomIn 0.2s ease-out forwards;
}

.animate-modal-zoom-out {
  animation: modalZoomOut 0.15s ease-in forwards;
}
`;

// Inject animations if in browser
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalAnimations;
  document.head.appendChild(styleElement);
} 