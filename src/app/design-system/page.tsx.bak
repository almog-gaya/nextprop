"use client";

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function DesignSystem() {
  const { colors } = useTheme();
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gradient-brand">NextProp Design System</h1>
      <p className="text-gray-600 mb-8">
        A comprehensive guide to NextProp's design system, including colors, typography, components, and more.
      </p>
      
      {/* Color Palette Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Color Palette</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Colors */}
          <div>
            <h3 className="text-xl font-medium mb-4">Primary Colors</h3>
            <div className="space-y-2">
              {Object.entries({
                50: 'color-primary-50',
                100: 'color-primary-100',
                200: 'color-primary-200',
                300: 'color-primary-300',
                400: 'color-primary-400',
                500: 'color-primary-500',
                600: 'color-primary-600',
                700: 'color-primary-700',
                800: 'color-primary-800',
                900: 'color-primary-900',
              }).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div 
                    className="h-10 w-10 rounded mr-4" 
                    style={{ backgroundColor: `var(--${value})` }}
                  ></div>
                  <div>
                    <div className="font-medium">Primary {key}</div>
                    <div className="text-sm text-gray-500">var(--{value})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Accent Colors */}
          <div>
            <h3 className="text-xl font-medium mb-4">Accent Colors</h3>
            <div className="space-y-2">
              {Object.entries({
                50: 'color-accent-50',
                100: 'color-accent-100',
                200: 'color-accent-200',
                300: 'color-accent-300',
                400: 'color-accent-400',
                500: 'color-accent-500',
                600: 'color-accent-600',
                700: 'color-accent-700',
                800: 'color-accent-800',
                900: 'color-accent-900',
              }).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div 
                    className="h-10 w-10 rounded mr-4" 
                    style={{ backgroundColor: `var(--${value})` }}
                  ></div>
                  <div>
                    <div className="font-medium">Accent {key}</div>
                    <div className="text-sm text-gray-500">var(--{value})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Gradients */}
        <div className="mt-8">
          <h3 className="text-xl font-medium mb-4">Gradients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg h-24 flex items-center justify-center text-white font-medium bg-gradient-sidebar">
              Sidebar Gradient
            </div>
            <div className="p-4 rounded-lg h-24 flex items-center justify-center text-white font-medium bg-gradient-button-primary">
              Button Primary Gradient
            </div>
            <div className="p-4 rounded-lg h-24 flex items-center justify-center text-white font-medium bg-gradient-button-secondary">
              Button Secondary Gradient
            </div>
            <div className="p-4 rounded-lg h-24 flex items-center justify-center text-gray-800 font-medium bg-gradient-card">
              Card Gradient
            </div>
          </div>
        </div>
      </section>
      
      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Typography</h2>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-5xl font-bold">Heading 1</h1>
            <div className="text-sm text-gray-500 mt-1">text-5xl font-bold</div>
          </div>
          <div>
            <h2 className="text-4xl font-bold">Heading 2</h2>
            <div className="text-sm text-gray-500 mt-1">text-4xl font-bold</div>
          </div>
          <div>
            <h3 className="text-3xl font-semibold">Heading 3</h3>
            <div className="text-sm text-gray-500 mt-1">text-3xl font-semibold</div>
          </div>
          <div>
            <h4 className="text-2xl font-semibold">Heading 4</h4>
            <div className="text-sm text-gray-500 mt-1">text-2xl font-semibold</div>
          </div>
          <div>
            <h5 className="text-xl font-medium">Heading 5</h5>
            <div className="text-sm text-gray-500 mt-1">text-xl font-medium</div>
          </div>
          <div>
            <h6 className="text-lg font-medium">Heading 6</h6>
            <div className="text-sm text-gray-500 mt-1">text-lg font-medium</div>
          </div>
          <div>
            <p className="text-base">Body text - Regular paragraph with base size.</p>
            <div className="text-sm text-gray-500 mt-1">text-base</div>
          </div>
          <div>
            <p className="text-sm">Small text - Used for secondary information.</p>
            <div className="text-sm text-gray-500 mt-1">text-sm</div>
          </div>
          <div>
            <p className="text-xs">Extra small text - Used for captions and labels.</p>
            <div className="text-sm text-gray-500 mt-1">text-xs</div>
          </div>
        </div>
      </section>
      
      {/* Component Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Component Examples</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium mb-4">Buttons</h3>
            <div className="space-y-4">
              <div>
                <button className="btn-primary px-4 py-2 w-full">Primary Button</button>
                <div className="text-sm text-gray-500 mt-1">btn-primary</div>
              </div>
              <div>
                <button className="btn-secondary px-4 py-2 w-full">Secondary Button</button>
                <div className="text-sm text-gray-500 mt-1">btn-secondary</div>
              </div>
              <div>
                <button className="border border-primary-200 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-md w-full">
                  Outline Button
                </button>
                <div className="text-sm text-gray-500 mt-1">Custom outline button</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-4">Cards</h3>
            <div className="space-y-6">
              <div>
                <div className="bg-gradient-card border border-gray-200 rounded-lg p-5">
                  <h3 className="text-xl font-semibold mb-1">Default Card</h3>
                  <p className="text-sm text-gray-500 mb-4">With title and subtitle</p>
                  <p>This is a default card with a title and subtitle.</p>
                </div>
                <div className="text-sm text-gray-500 mt-2">bg-gradient-card</div>
              </div>
              
              <div>
                <div className="bg-gradient-sidebar text-white rounded-lg p-5">
                  <h3 className="text-xl font-semibold mb-1 text-white">Highlight Card</h3>
                  <p className="text-sm text-white/80 mb-4">With gradient background</p>
                  <p>This card uses the sidebar gradient for high visual impact.</p>
                </div>
                <div className="text-sm text-gray-500 mt-2">bg-gradient-sidebar</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CSS Variables Reference */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">CSS Variables Reference</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Variable</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm">--color-primary-600</td>
                <td className="px-4 py-3 text-sm">#9061fc</td>
                <td className="px-4 py-3 text-sm">Main primary color</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">--color-primary-500</td>
                <td className="px-4 py-3 text-sm">#9d7afd</td>
                <td className="px-4 py-3 text-sm">Secondary color</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">--color-accent-500</td>
                <td className="px-4 py-3 text-sm">#b77cfc</td>
                <td className="px-4 py-3 text-sm">Accent color</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">--gradient-sidebar</td>
                <td className="px-4 py-3 text-sm">linear-gradient(to right, #b5bcff, #e6c2ff)</td>
                <td className="px-4 py-3 text-sm">Sidebar gradient</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">--gradient-button-primary</td>
                <td className="px-4 py-3 text-sm">linear-gradient(to bottom, #9061fc, #8344fb)</td>
                <td className="px-4 py-3 text-sm">Primary button gradient</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
} 