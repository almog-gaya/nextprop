/**
 * Simple logging utility functions for consistent logging across the application
 */

// Toggle this to enable/disable verbose logging
const ENABLE_VERBOSE_LOGGING = true;

/**
 * Log a message to the console if verbose logging is enabled
 */
export function log(message: string, data?: any): void {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * Log an error message to the console
 */
export function logError(message: string, error?: any): void {
  if (error !== undefined) {
    console.error(message, error);
  } else {
    console.error(message);
  }
}

/**
 * Log a warning message to the console
 */
export function logWarning(message: string, data?: any): void {
  if (data !== undefined) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
} 