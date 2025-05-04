#!/usr/bin/env node

/**
 * Design System Migration Script
 * This script scans through the codebase and replaces hardcoded design values
 * with variables from the design system.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors that need to be replaced
const colorReplacements = {
  // Old hardcoded colors → New design system variables for CSS
  '#7c3aed': 'var(--nextprop-primary)',
  '#6d28d9': 'var(--nextprop-primary-dark)',
  '#8b5cf6': 'var(--nextprop-primary-light)',
  '#a78bfa': 'var(--nextprop-accent)',
  '#1e1b4b': 'var(--nextprop-dark)',
  '#1e293b': 'var(--nextprop-text-primary)',
  '#64748b': 'var(--nextprop-text-secondary)',
  '#94a3b8': 'var(--nextprop-text-tertiary)',
  '#e2e8f0': 'var(--nextprop-border)',
  '#f8fafc': 'var(--nextprop-surface-hover)',
  
  // Black/dark border colors that need to be lightened
  '#000': 'var(--nextprop-border)',
  '#000000': 'var(--nextprop-border)',
  '#111': 'var(--nextprop-border)',
  '#222': 'var(--nextprop-border)',
  '#333': 'var(--nextprop-border)',
  '#444': 'var(--nextprop-border)',
  'black': 'var(--nextprop-border)',
  'rgba(0,0,0,0.1)': 'rgba(226, 232, 240, 0.6)',
  'rgba(0,0,0,0.2)': 'rgba(226, 232, 240, 0.8)',
  'rgba(0,0,0,0.3)': 'rgba(226, 232, 240, 1)',
  
  // Additional commonly used dark colors
  '#111827': 'var(--nextprop-text-primary)',
  '#1C1C1C': 'var(--nextprop-text-primary)',
  '#1f2937': 'var(--nextprop-text-primary)',
  '#374151': 'var(--nextprop-text-secondary)',
  '#4b5563': 'var(--nextprop-text-secondary)',
  '#d1d5db': 'var(--nextprop-border)',
  '#9ca3af': 'var(--nextprop-text-tertiary)',
  
  // Additional colors specific to the app
  '#0A855C': 'var(--nextprop-success)',
  '#f5f3ff': 'var(--color-primary-50)',
  '#F7F7F7': 'var(--nextprop-surface-hover)',
  '#F4F6FA': 'var(--nextprop-surface-hover)',
  '#0057ff': 'var(--nextprop-info)',
  '#2643FF': 'var(--nextprop-info)',
  '#3244FF': 'var(--nextprop-info)',
  '#2563eb': 'var(--nextprop-info)',
  '#4B8CFF': 'var(--nextprop-info)',
  '#FCF8FF': 'var(--color-primary-50)',
  '#EFF3F5': 'var(--nextprop-surface-hover)',
  '#F4F7F9': 'var(--nextprop-surface-hover)',
  '#7B2FF2': 'var(--nextprop-primary)',
  '#A020F0': 'var(--nextprop-primary)',
  '#7c16c4': 'var(--nextprop-primary-dark)',
  '#9806FF': 'var(--nextprop-primary)',
  '#16549B': 'var(--nextprop-info)',
  '#ECD0FF': 'var(--color-accent-200)',
  '#e5c1ff': 'var(--color-accent-200)',
  '#B6BCFF': 'var(--color-primary-300)',
  '#E6C2FF': 'var(--color-accent-200)',
  
  // Purple replacements to new softer palette
  // (only replace these in CSS custom properties or where direct color values are used)
  '#7c3aed': '#9061fc', // Applied in context where CSS vars can't be used
  '#6d28d9': '#8344fb',
  '#8b5cf6': '#9d7afd',
  '#a78bfa': '#b77cfc',
};

// Tailwind class replacements
const tailwindReplacements = {
  'text-\\[#7c3aed\\]': 'text-primary-600',
  'text-\\[#6d28d9\\]': 'text-primary-700',
  'text-\\[#8b5cf6\\]': 'text-primary-500',
  'text-\\[#a78bfa\\]': 'text-accent-500',
  'text-\\[#1e1b4b\\]': 'text-gray-950',
  'text-\\[#1e293b\\]': 'text-gray-800',
  'text-\\[#64748b\\]': 'text-gray-500',
  'text-\\[#94a3b8\\]': 'text-gray-400',
  'border-\\[#e2e8f0\\]': 'border-gray-200',
  'bg-\\[#f8fafc\\]': 'bg-gray-50',
  
  // Dark border replacements
  'border-\\[#000\\]': 'border-gray-200',
  'border-\\[#000000\\]': 'border-gray-200',
  'border-\\[#111\\]': 'border-gray-200',
  'border-\\[#222\\]': 'border-gray-200',
  'border-\\[#333\\]': 'border-gray-200',
  'border-\\[#444\\]': 'border-gray-200',
  'border-black': 'border-gray-200',
  'border-t-\\[#000\\]': 'border-t-gray-200',
  'border-b-\\[#000\\]': 'border-b-gray-200',
  'border-l-\\[#000\\]': 'border-l-gray-200',
  'border-r-\\[#000\\]': 'border-r-gray-200',
  'border-t-black': 'border-t-gray-200',
  'border-b-black': 'border-b-gray-200',
  'border-l-black': 'border-l-gray-200',
  'border-r-black': 'border-r-gray-200',
  
  // New replacements for specific app colors
  'text-\\[#111827\\]': 'text-gray-800',
  'text-\\[#1C1C1C\\]': 'text-gray-800',
  'text-\\[#1f2937\\]': 'text-gray-800',
  'text-\\[#374151\\]': 'text-gray-600',
  'text-\\[#4b5563\\]': 'text-gray-600',
  'text-\\[#9ca3af\\]': 'text-gray-400',
  'border-\\[#d1d5db\\]': 'border-gray-200',
  'bg-\\[#f5f3ff\\]': 'bg-primary-50',
  'bg-\\[#F7F7F7\\]': 'bg-gray-50',
  'bg-\\[#F4F6FA\\]': 'bg-gray-50',
  'text-\\[#0057ff\\]': 'text-info',
  'border-\\[#0057ff\\]': 'border-info',
  'bg-\\[#2643FF\\]': 'bg-info',
  'text-\\[#3244FF\\]': 'text-info',
  'bg-\\[#3244FF\\]': 'bg-info',
  'text-\\[#2563eb\\]': 'text-info',
  'bg-\\[#FCF8FF\\]': 'bg-primary-50',
  'bg-\\[#EFF3F5\\]': 'bg-gray-50',
  'bg-\\[#F4F7F9\\]': 'bg-gray-50',
  'bg-\\[#7B2FF2\\]': 'bg-primary-600',
  'bg-\\[#A020F0\\]': 'bg-primary-600',
  'bg-\\[#7c16c4\\]': 'bg-primary-700',
  'border-\\[#0A855C\\]': 'border-success',
  'text-\\[#0A855C\\]': 'text-success',
  'bg-\\[#0A855C\\]': 'bg-success',
  'bg-\\[#e5c1ff\\]': 'bg-accent-200',
  'bg-\\[#ECD0FF\\]': 'bg-accent-200',
  'bg-\\[#B6BCFF\\]': 'bg-primary-300',
  'bg-\\[#E6C2FF\\]': 'bg-accent-200',
  'text-\\[#16549B\\]': 'text-info',
  
  // Button color replacements
  'bg-\\[#7c3aed\\]': 'bg-primary-600',
  'hover:bg-\\[#6d28d9\\]': 'hover:bg-primary-700',
  
  // Focus ring replacements
  'focus:ring-\\[#7c3aed\\]': 'focus:ring-primary-600',
  
  // Replace direct background and border colors
  'border-\\[#7c3aed\\]': 'border-primary-600',
  'border-t-\\[#7c3aed\\]': 'border-t-primary-600',
  'border-b-\\[#7c3aed\\]': 'border-b-primary-600',
  'border-l-\\[#7c3aed\\]': 'border-l-primary-600',
  'border-r-\\[#7c3aed\\]': 'border-r-primary-600',
};

// Gradient replacements
const gradientReplacements = {
  'linear-gradient\\(to right, #b5bcff, #e6c2ff\\)': 'var(--gradient-sidebar)',
  'linear-gradient\\(to bottom, #9061fc, #8344fb\\)': 'var(--gradient-button-primary)',
  'linear-gradient\\(to bottom, #7c3aed, #6d28d9\\)': 'var(--gradient-button-primary)',
  'linear-gradient\\(to right, #7c3aed, #8b5cf6, #a78bfa\\)': 'var(--gradient-brand-text)',
};

// Replace colors in a file
function replaceColorsInFile(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply color replacements for CSS
  if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(oldColor, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, newColor);
        hasChanges = true;
        console.log(`  Replaced ${oldColor} with ${newColor}`);
      }
    });
    
    Object.entries(gradientReplacements).forEach(([oldGradient, newGradient]) => {
      const regex = new RegExp(oldGradient, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newGradient);
        hasChanges = true;
        console.log(`  Replaced gradient: ${oldGradient} with ${newGradient}`);
      }
    });
  }
  
  // Apply Tailwind class replacements for TSX/JSX files
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    Object.entries(tailwindReplacements).forEach(([oldClass, newClass]) => {
      const regex = new RegExp(oldClass, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newClass);
        hasChanges = true;
        console.log(`  Replaced ${oldClass} with ${newClass}`);
      }
    });
  }
  
  // Write changes back to file
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

// Create a backup of a file
function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Run the migration
function run() {
  const srcDir = path.join(process.cwd(), 'src');
  console.log(`Starting design system migration in ${srcDir}`);
  
  let backupFiles = [];
  let updatedFiles = [];
  
  // Process all React components
  glob.sync(path.join(srcDir, '**/*.{tsx,jsx}')).forEach(file => {
    backupFile(file);
    backupFiles.push(file);
    
    if (replaceColorsInFile(file)) {
      updatedFiles.push(file);
    }
  });
  
  // Process all CSS files
  glob.sync(path.join(srcDir, '**/*.{css,scss}')).forEach(file => {
    backupFile(file);
    backupFiles.push(file);
    
    if (replaceColorsInFile(file)) {
      updatedFiles.push(file);
    }
  });
  
  console.log('\nMigration Summary:');
  console.log(`Processed: ${backupFiles.length} files`);
  console.log(`Updated: ${updatedFiles.length} files`);
  
  if (updatedFiles.length > 0) {
    console.log('\nUpdated files:');
    updatedFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  }
  
  console.log('\nDesign system migration completed!');
  console.log('Please review changes and test thoroughly before committing.');
}

// Execute the script
run(); 