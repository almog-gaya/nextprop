'use client';

import React, { useState, useEffect, useRef, InputHTMLAttributes } from 'react';
import { Validator } from '@/utils/validation';

// Define input types we support
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'textarea';

// Interface for the component props
interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange'> {
  label: string;
  name: string;
  type?: InputType;
  placeholder?: string;
  value: string;
  onChange: (value: string, name: string, isValid: boolean) => void;
  validator?: Validator<string>;
  required?: boolean;
  helperText?: string;
  maxLength?: number;
  rows?: number; // For textarea
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  wrapperClassName?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  validator,
  required = false,
  helperText,
  maxLength,
  rows = 3,
  iconLeft,
  iconRight,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  helperClassName = '',
  wrapperClassName = '',
  autoFocus = false,
  autoComplete,
  disabled = false,
  readOnly = false,
  onBlur,
  onFocus,
  ...rest
}: FormInputProps) {
  // States
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  
  // Validate value when it changes
  useEffect(() => {
    if (validator && isTouched) {
      const result = validator(value);
      setError(result.errorMessage);
      onChange(value, name, result.isValid);
    } else {
      onChange(value, name, true);
    }
  }, [value, validator, isTouched, name, onChange]);
  
  // Focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue, name, true);
  };
  
  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsTouched(true);
    setIsFocused(false);
    
    if (validator) {
      const result = validator(value);
      setError(result.errorMessage);
      onChange(value, name, result.isValid);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };
  
  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    
    if (onFocus) {
      onFocus(e);
    }
  };
  
  // Base classes
  const baseInputClasses = `
    block w-full rounded-md border-gray-300 shadow-sm 
    focus:border-primary-500 focus:ring-primary-500 sm:text-sm
    ${error ? 'border-error-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
    ${readOnly ? 'bg-gray-50 cursor-default' : ''}
    ${iconLeft ? 'pl-10' : ''}
    ${iconRight ? 'pr-10' : ''}
    ${inputClassName}
  `;

  // Render input or textarea based on type
  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      disabled,
      readOnly,
      placeholder,
      'aria-invalid': !!error,
      'aria-describedby': error ? `${name}-error` : undefined,
      className: baseInputClasses,
      ...rest
    };
    
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          {...commonProps}
        />
      );
    }
    
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        {...commonProps}
      />
    );
  };
  
  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      <label 
        htmlFor={name} 
        className={`block text-sm font-medium text-gray-700 mb-1 ${required ? 'required' : ''} ${labelClassName}`}
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <div className={`relative rounded-md ${className}`}>
        {iconLeft && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {iconLeft}
          </div>
        )}
        
        {renderInput()}
        
        {iconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>
      
      {error && isTouched && (
        <p className={`mt-1 text-sm text-error-500 ${errorClassName}`} id={`${name}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className={`mt-1 text-sm text-gray-500 ${helperClassName}`}>
          {helperText}
        </p>
      )}
      
      {maxLength && (
        <div className="flex justify-end mt-1">
          <span className={`text-xs text-gray-500 ${value.length > (maxLength * 0.9) ? 'text-warning-500' : ''}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
} 