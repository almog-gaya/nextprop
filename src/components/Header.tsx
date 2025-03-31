"use client";

import React from 'react';
import Link from 'next/link';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className=" h-24 border-b border-gray-200 px-8">
      <div className="h-full flex items-center justify-between">
        <h1 className="text-xl nextprop-gradient-text font-extrabold ">{title}</h1>
      </div>
    </header>
  );
} 