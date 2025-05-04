"use client"

import React, { ReactNode, SelectHTMLAttributes, useState } from 'react'

// Simple select component wrapper
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
  value?: string
  children: ReactNode
}

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextType>({})

export function Select({ 
  className = "", 
  value, 
  onChange,
  children,
  ...props 
}: SelectProps) {
  // Internal state if not controlled
  const [internalValue, setInternalValue] = useState(value || "")
  
  // Handle value change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInternalValue(e.target.value)
    if (onChange) {
      onChange(e)
    }
  }
  
  return (
    <SelectContext.Provider value={{ 
      value: value || internalValue,
      onValueChange: (newValue) => {
        setInternalValue(newValue)
        if (onChange) {
          const event = {
            target: { value: newValue }
          } as React.ChangeEvent<HTMLSelectElement>
          onChange(event)
        }
      }
    }}>
      <select 
        className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full ${className}`}
        value={value || internalValue}
        onChange={handleChange}
        {...props}
      >
        {children}
      </select>
    </SelectContext.Provider>
  )
}

// For compatibility with the imported SelectTrigger
export function SelectTrigger({ className = "", children }: { className?: string, children?: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  )
}

// For compatibility with the imported SelectValue
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

// For compatibility with the imported SelectContent
export function SelectContent({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// For compatibility with the imported SelectItem
export function SelectItem({ value, children }: { value: string, children: ReactNode }) {
  return <option value={value}>{children}</option>
} 