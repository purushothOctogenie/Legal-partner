import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .refine(password => !/(.)\1{2,}/.test(password), {
    message: 'Password cannot contain repeated characters'
  });

// Password strength checker
export const checkPasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check (8+ characters)
  if (password.length >= 8) strength += 1;
  
  // Contains number
  if (/\d/.test(password)) strength += 1;
  
  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 1;
  
  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 1;
  
  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return strength;
};

// Get password strength color
export const getPasswordStrengthColor = (strength: number): string => {
  if (strength <= 1) return 'bg-red-500';
  if (strength <= 3) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Validate password
export const validatePassword = async (hashedPassword: string, plainPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Validate password format
export const validatePasswordFormat = (password: string): { isValid: boolean; errors: string[] } => {
  try {
    passwordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return { isValid: false, errors: ['Invalid password format'] };
  }
};

// Password requirements for UI display
export const passwordRequirements = [
  'At least 8 characters long',
  'Contains at least one uppercase letter',
  'Contains at least one lowercase letter',
  'Contains at least one number',
  'Contains at least one special character',
  'No repeated characters (e.g., "aaa")'
]; 