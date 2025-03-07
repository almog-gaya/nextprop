/**
 * Form validation utilities
 * 
 * This utility provides consistent validation rules and error messages
 * for form fields throughout the application.
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (North American format)
export const isValidPhone = (phone: string): boolean => {
  // Allow various formats like (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return phoneRegex.test(phone);
};

// Name validation
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Password validation (minimum 8 characters, at least one letter and one number)
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Required field validation
export const isRequired = (value: string | number | boolean | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  return !!value;
};

// Min/Max length validation
export const isValidLength = (value: string, min: number, max?: number): boolean => {
  const length = value.trim().length;
  if (length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
};

// Numeric value validation
export const isValidNumber = (value: string): boolean => {
  return !isNaN(Number(value));
};

// Date validation (checks if valid date and not in the past if specified)
export const isValidDate = (date: string | Date, notInPast = false): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return false; // Invalid date
    if (notInPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dateObj >= today;
    }
    return true;
  } catch (e) {
    return false;
  }
};

// Common validation error messages
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  name: 'Name must be at least 2 characters',
  password: 'Password must be at least 8 characters with at least one letter and one number',
  url: 'Please enter a valid URL',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  numeric: 'Please enter a valid number',
  date: 'Please enter a valid date',
  dateNotInPast: 'Please enter a date that is not in the past',
};

// Form field validator
interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

// Validator function type
export type Validator<T> = (value: T) => ValidationResult;

// Create a validator for a specific field type
export function createValidator<T>(
  validators: Array<(value: T) => boolean>, 
  messages: string[]
): Validator<T> {
  return (value: T): ValidationResult => {
    for (let i = 0; i < validators.length; i++) {
      if (!validators[i](value)) {
        return {
          isValid: false,
          errorMessage: messages[i],
        };
      }
    }
    return {
      isValid: true,
      errorMessage: null,
    };
  };
}

// Common validators
export const emailValidator = createValidator<string>(
  [isRequired, isValidEmail],
  [errorMessages.required, errorMessages.email]
);

export const phoneValidator = createValidator<string>(
  [isRequired, isValidPhone],
  [errorMessages.required, errorMessages.phone]
);

export const nameValidator = createValidator<string>(
  [isRequired, isValidName],
  [errorMessages.required, errorMessages.name]
);

export const urlValidator = createValidator<string>(
  [isRequired, isValidUrl],
  [errorMessages.required, errorMessages.url]
);

export const passwordValidator = createValidator<string>(
  [isRequired, isValidPassword],
  [errorMessages.required, errorMessages.password]
);

// Utility to validate entire form
export function validateForm<T>(
  formData: T,
  validationRules: { [K in keyof T]?: Validator<T[K]> }
): { isValid: boolean; errors: { [K in keyof T]?: string } } {
  const errors = {} as { [K in keyof T]?: string };
  let isValid = true;

  for (const field in validationRules) {
    if (Object.prototype.hasOwnProperty.call(validationRules, field)) {
      const validator = validationRules[field];
      const value = formData[field];

      if (validator) {
        const result = validator(value);
        if (!result.isValid) {
          errors[field as keyof T] = result.errorMessage || '';
          isValid = false;
        }
      }
    }
  }

  return { isValid, errors };
} 