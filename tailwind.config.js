/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        // Accent colors
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
        },
        // Neutral colors
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
          950: 'var(--color-gray-950)',
        },
        // Semantic colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        // NextProp specific
        nextprop: {
          primary: 'var(--nextprop-primary)',
          'primary-light': 'var(--nextprop-primary-light)',
          'primary-dark': 'var(--nextprop-primary-dark)',
          secondary: 'var(--nextprop-secondary)',
          accent: 'var(--nextprop-accent)',
          dark: 'var(--nextprop-dark)',
          light: 'var(--nextprop-light)',
          gray: 'var(--nextprop-gray)',
          surface: 'var(--nextprop-surface)',
          'surface-hover': 'var(--nextprop-surface-hover)',
          border: 'var(--nextprop-border)',
          'text-primary': 'var(--nextprop-text-primary)',
          'text-secondary': 'var(--nextprop-text-secondary)',
          'text-tertiary': 'var(--nextprop-text-tertiary)',
        },
      },
      backgroundImage: {
        'gradient-sidebar': 'var(--gradient-sidebar)',
        'gradient-button-primary': 'var(--gradient-button-primary)',
        'gradient-button-secondary': 'var(--gradient-button-secondary)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-brand-text': 'var(--gradient-brand-text)',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '100ms',
        slow: '300ms',
        slower: '500ms',
        slowest: '1000ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    // Add custom utilities for our design system
    function({ addUtilities }) {
      const newUtilities = {
        // Text gradient utilities
        '.text-gradient-brand': {
          'background-image': 'var(--gradient-brand-text)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
          'background-size': '200% 200%',
        },
        
        // Button utilities with gradients
        '.btn-primary': {
          'background-image': 'var(--gradient-button-primary)',
          'color': '#ffffff',
          'padding': '0.5rem 1rem',
          'border-radius': '0.375rem',
          'font-weight': '500',
          'transition': 'all 200ms ease',
          '&:hover': {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        
        '.btn-secondary': {
          'background-image': 'var(--gradient-button-secondary)',
          'color': '#ffffff',
          'padding': '0.5rem 1rem',
          'border-radius': '0.375rem',
          'font-weight': '500',
          'transition': 'all 200ms ease',
          '&:hover': {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        
        // Card utilities
        '.card': {
          'background-image': 'var(--gradient-card)',
          'border-radius': '0.5rem',
          'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'padding': '1.5rem',
          'transition': 'all 200ms ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        
        // Input utilities
        '.input': {
          'background-color': 'var(--nextprop-surface)',
          'border': '1px solid var(--nextprop-border)',
          'border-radius': '0.375rem',
          'padding': '0.5rem 0.75rem',
          'transition': 'all 200ms ease',
          '&:focus': {
            'outline': 'none',
            'border-color': 'var(--nextprop-primary)',
            'box-shadow': '0 0 0 2px var(--color-primary-200)',
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
}; 