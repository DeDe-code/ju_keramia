import { z } from 'zod';

export const contactFormSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Only letters, spaces, hyphens, and apostrophes allowed'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Only letters, spaces, hyphens, and apostrophes allowed'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .max(254, 'Email address too long')
      .refine((email) => !email.includes('..'), 'Invalid email format'),
    message: z
      .string()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message cannot exceed 2000 characters')
      .refine((msg) => msg.trim().length >= 10, 'Message cannot be only whitespace'),
  })
  .refine(
    (data) => {
      // Check if all fields are blank or only whitespace
      return ![data.firstName, data.lastName, data.email, data.message].every(
        (val) => !val || val.trim() === ''
      );
    },
    {
      message: 'All fields are required.',
      path: [], // global error
    }
  );

export type ContactFormSchema = z.infer<typeof contactFormSchema>;
