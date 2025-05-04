"use client"

import React, { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 z-50">
        {children}
      </div>
    </div>
  )
}

interface DialogContentProps {
  children: ReactNode
}

export function DialogContent({ children }: DialogContentProps) {
  return (
    <div className="p-6">
      {children}
    </div>
  )
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4">
      {children}
    </div>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xl font-semibold text-gray-900">
      {children}
    </h3>
  )
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-gray-500 mt-1">
      {children}
    </p>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      {children}
    </div>
  )
} 