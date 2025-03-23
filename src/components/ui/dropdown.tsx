"use client"

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    icon?: React.ReactNode
  }>
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  required?: boolean
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const widthClasses = {
  sm: 'w-48',
  md: 'w-64',
  lg: 'w-80',
  xl: 'w-96',
  full: 'w-full'
}

export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  error,
  required = false,
  width = 'md'
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${widthClasses[width]} ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white rounded-md border px-3 py-2 text-left shadow-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300' : 'border-gray-300 hover:border-purple-500'}
          ${isOpen ? 'border-purple-500 ring-1 ring-purple-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center truncate">
            {selectedOption?.icon && (
              <span className="mr-2 text-gray-400">{selectedOption.icon}</span>
            )}
            <span className={`block truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm
                    ${value === option.value ? 'bg-purple-50 text-purple-900' : 'text-gray-900 hover:bg-gray-50'}
                    flex items-center
                  `}
                >
                  {option.icon && (
                    <span className="mr-2 text-gray-400">{option.icon}</span>
                  )}
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 