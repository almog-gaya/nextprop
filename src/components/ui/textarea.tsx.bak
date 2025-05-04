"use client"

import React, { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea 
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full ${className}`}
      rows={4}
      {...props}
    />
  )
} 