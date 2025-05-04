import { theme } from '@/lib/theme';
import { useMemo } from 'react';

/**
 * A hook for consistent access to the NextProp design system.
 * This allows components to use the design system in a type-safe way,
 * with consistent access patterns.
 * 
 * @example
 * // In a component:
 * const { colors, gradients } = useTheme();
 * return (
 *   <button 
 *     style={{ 
 *       background: gradients.buttonPrimary,
 *       color: colors.white
 *     }}
 *   >
 *     Click me
 *   </button>
 * );
 */
export function useTheme() {
  return useMemo(() => theme, []);
}

/**
 * Helper function to get CSS variable values
 * @param variableName CSS variable name (without the -- prefix)
 * @returns The CSS variable value
 * 
 * @example
 * // Returns the value of --color-primary-600
 * const primaryColor = getCssVar('color-primary-600');
 */
export function getCssVar(variableName: string): string {
  if (typeof window === 'undefined') return '';
  
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variableName}`)
    .trim();
}

/**
 * Helper function to generate CSS classes for gradient backgrounds
 * @param gradientName Name of the gradient from our design system
 * @returns CSS class string
 * 
 * @example
 * // Returns "bg-gradient-sidebar"
 * const sidebarGradientClass = gradientClass('sidebar');
 */
export function gradientClass(gradientName: keyof typeof theme.gradients): string {
  return `bg-gradient-${gradientName}`;
}

export default useTheme; 