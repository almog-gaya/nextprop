"use client";

import React from 'react';

type ColorVariant = {
  name: string;
  variable: string;
  hex: string;
  description?: string;
};

interface ColorPaletteProps {
  title: string;
  colors: ColorVariant[];
  darkText?: boolean;
}

export default function ColorPalette({ title, colors, darkText = false }: ColorPaletteProps) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-medium mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color) => (
          <div key={color.variable} className="flex items-start p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div
              className="h-16 w-16 rounded mr-4 flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `var(--${color.variable})` }}
            ></div>
            <div className="flex-1">
              <div className="font-medium">{color.name}</div>
              <div className="text-sm text-gray-500">var(--{color.variable})</div>
              <div className="text-sm text-gray-400">{color.hex}</div>
              {color.description && (
                <div className="text-sm text-gray-500 mt-1">{color.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 