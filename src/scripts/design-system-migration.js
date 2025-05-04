/**
 * NextProp Design System Migration Plan
 * -------------------------------------
 * This document outlines the comprehensive plan to implement the new design system
 * consistently across the entire application.
 */

/**
 * PHASE 1: DOCUMENTATION AND SETUP
 * --------------------------------
 * 1. Create comprehensive documentation for the design system in Notion or similar
 * 2. Setup Storybook to showcase all components with the new design system
 * 3. Create a design system cheat sheet for developers
 */

/**
 * PHASE 2: STANDARDIZATION OF DESIGN TOKENS
 * ----------------------------------------
 * 1. Ensure theme.ts has all necessary design tokens
 * 2. Update globals.css to use CSS variables consistently
 * 3. Create Tailwind plugins for custom functionality
 * 4. Create utility functions for accessing design tokens programmatically
 */

/**
 * PHASE 3: COMPONENT LIBRARY UPDATES
 * ---------------------------------
 * 1. Update all base components to use the design system
 * 2. Create a component inventory to track progress
 * 3. Set up component testing for visual regression
 */

/**
 * PHASE 4: APPLICATION-WIDE REPLACEMENT
 * ------------------------------------
 * Replace hardcoded values with design system tokens:
 *
 * COLORS REPLACEMENTS:
 * -------------------
 * #7c3aed → var(--nextprop-primary) or text-primary-600
 * #6d28d9 → var(--nextprop-primary-dark) or text-primary-700
 * #8b5cf6 → var(--nextprop-primary-light) or text-primary-500
 * #a78bfa → var(--nextprop-accent) or text-accent-500
 * #1e1b4b → var(--nextprop-dark) or text-gray-950
 * #1e293b → var(--nextprop-text-primary) or text-gray-800
 * #64748b → var(--nextprop-text-secondary) or text-gray-500
 * #94a3b8 → var(--nextprop-text-tertiary) or text-gray-400
 * #e2e8f0 → var(--nextprop-border) or border-gray-200
 * #f8fafc → var(--nextprop-surface-hover) or bg-gray-50
 *
 * All purple-related colors should use the new softer palette:
 * Previous #7c3aed → New #9061fc
 * Previous #6d28d9 → New #8344fb
 * Previous #8b5cf6 → New #9d7afd
 * Previous #a78bfa → New #b77cfc
 * 
 * SPACING REPLACEMENTS:
 * --------------------
 * Use consistent spacing scales from the design system:
 * 4px → spacing-1 or p-1
 * 8px → spacing-2 or p-2
 * 12px → spacing-3 or p-3
 * 16px → spacing-4 or p-4
 * 20px → spacing-5 or p-5
 * 24px → spacing-6 or p-6
 * etc.
 * 
 * TYPOGRAPHY REPLACEMENTS:
 * -----------------------
 * Use consistent typography scales from the design system:
 * 12px → text-xs
 * 14px → text-sm
 * 16px → text-base
 * 18px → text-lg
 * 20px → text-xl
 * 24px → text-2xl
 * etc.
 * 
 * Font weights:
 * 300 → font-light
 * 400 → font-normal
 * 500 → font-medium
 * 600 → font-semibold
 * 700 → font-bold
 * 800 → font-extrabold
 * 
 * SHADOWS REPLACEMENTS:
 * --------------------
 * Use consistent shadow scales from the design system:
 * shadow-sm
 * shadow
 * shadow-md
 * shadow-lg
 * shadow-xl
 * shadow-2xl
 */

/**
 * PHASE 5: AUTOMATION AND CI/CD
 * ----------------------------
 * 1. Create linting rules to enforce design system usage
 * 2. Set up CI/CD to check for design system compliance
 * 3. Create automated tools to help with migration
 */

/**
 * PHASE 6: DOCUMENTATION AND TRAINING
 * ----------------------------------
 * 1. Update documentation with usage examples
 * 2. Conduct training sessions for all developers
 * 3. Create a process for adding new design tokens
 */

/**
 * FILES THAT NEED UPDATING:
 * ------------------------
 * - All component files (.tsx)
 * - CSS modules or styled-components files
 * - Utility functions that generate styles
 * 
 * PRIORITY ORDER:
 * --------------
 * 1. Shared components (buttons, cards, forms, etc.)
 * 2. Layout components (header, sidebar, footer)
 * 3. Page-specific components
 * 4. Utility functions and hooks
 */

/**
 * IMPLEMENTATION STEPS:
 * --------------------
 * 1. Fork the codebase to a feature branch
 * 2. Run the replacement script for automated replacements
 * 3. Test thoroughly in development environment
 * 4. Address any visual regressions
 * 5. Deploy to staging and test
 * 6. Deploy to production with feature flags if possible
 */

// Script to help with the migration
const fs = require('fs');
const path = require('path');

// Colors that need to be replaced
const colorReplacements = {
  // Old hardcoded colors → New design system variables
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
  
  // Tailwind class replacements
  'text-[#7c3aed]': 'text-primary-600',
  'text-[#6d28d9]': 'text-primary-700',
  'text-[#8b5cf6]': 'text-primary-500',
  'text-[#a78bfa]': 'text-accent-500',
  'text-[#1e1b4b]': 'text-gray-950',
  'text-[#1e293b]': 'text-gray-800',
  'text-[#64748b]': 'text-gray-500',
  'text-[#94a3b8]': 'text-gray-400',
  'border-[#e2e8f0]': 'border-gray-200',
  'bg-[#f8fafc]': 'bg-gray-50',
  
  // Button color replacements
  'bg-[#7c3aed]': 'bg-primary-600',
  'hover:bg-[#6d28d9]': 'hover:bg-primary-700',
  
  // Focus ring replacements
  'focus:ring-[#7c3aed]': 'focus:ring-primary-600',
  
  // Linear gradients
  'linear-gradient(to right, #b5bcff, #e6c2ff)': 'var(--gradient-sidebar)',
  'linear-gradient(to bottom, #9061fc, #8344fb)': 'var(--gradient-button-primary)',
};

// Usage example - not executable in this file but shows the approach
function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
    if (content.includes(oldColor)) {
      content = content.replace(new RegExp(oldColor, 'g'), newColor);
      hasChanges = true;
      console.log(`Replaced ${oldColor} with ${newColor} in ${filePath}`);
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// This would be executed to process all files
async function migrateDesignSystem() {
  // Actual implementation would walk the directory tree
  // and apply replacements to all relevant files
  console.log('Design system migration started');
  
  // Find all .tsx, .css, .scss files
  // For each file:
  //   - Replace hardcoded colors with design tokens
  //   - Replace spacing values with design tokens
  //   - Replace typography values with design tokens
  //   - Replace other inconsistencies
  
  console.log('Design system migration completed');
}

// Export the functions for use in a real script
module.exports = {
  replaceColorsInFile,
  migrateDesignSystem,
  colorReplacements,
}; 