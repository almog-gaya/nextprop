"use client"

import React, { LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
}

export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label 
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    />
  )
} 