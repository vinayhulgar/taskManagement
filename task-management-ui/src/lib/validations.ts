// Validation schemas using Zod

import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(VALIDATION_RULES.NAME.MIN_LENGTH, 'First name is too short')
      .max(VALIDATION_RULES.NAME.MAX_LENGTH, 'First name is too long')
      .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_RULES.NAME.MESSAGE),
    lastName: z
      .string()
      .min(VALIDATION_RULES.NAME.MIN_LENGTH, 'Last name is too short')
      .max(VALIDATION_RULES.NAME.MAX_LENGTH, 'Last name is too long')
      .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_RULES.NAME.MESSAGE),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, 'Password is too short')
      .regex(VALIDATION_RULES.PASSWORD.PATTERN, VALIDATION_RULES.PASSWORD.MESSAGE),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, 'Password is too short')
      .regex(VALIDATION_RULES.PASSWORD.PATTERN, VALIDATION_RULES.PASSWORD.MESSAGE),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// User profile validation schemas
export const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, 'First name is too short')
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, 'First name is too long')
    .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_RULES.NAME.MESSAGE),
  lastName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, 'Last name is too short')
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, 'Last name is too long')
    .regex(VALIDATION_RULES.NAME.PATTERN, VALIDATION_RULES.NAME.MESSAGE),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, 'Password is too short')
      .regex(VALIDATION_RULES.PASSWORD.PATTERN, VALIDATION_RULES.PASSWORD.MESSAGE),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Team validation schemas
export const teamSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.TEAM_NAME.MIN_LENGTH, 'Team name is too short')
    .max(VALIDATION_RULES.TEAM_NAME.MAX_LENGTH, 'Team name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export const teamInviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).refine(val => val !== undefined, {
    message: 'Please select a role',
  }),
});

// Project validation schemas
export const projectSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.PROJECT_NAME.MIN_LENGTH, 'Project name is too short')
    .max(VALIDATION_RULES.PROJECT_NAME.MAX_LENGTH, 'Project name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  teamId: z.string().min(1, 'Please select a team'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const projectMemberSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  role: z.enum(['MANAGER', 'MEMBER']).refine(val => val !== undefined, {
    message: 'Please select a role',
  }),
});

// Task validation schemas
export const taskSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.TASK_TITLE.MIN_LENGTH, 'Task title is too short')
    .max(VALIDATION_RULES.TASK_TITLE.MAX_LENGTH, 'Task title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).refine(val => val !== undefined, {
    message: 'Please select a priority',
  }),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  parentTaskId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').optional(),
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.TASK_TITLE.MIN_LENGTH, 'Task title is too short')
    .max(VALIDATION_RULES.TASK_TITLE.MAX_LENGTH, 'Task title is too long')
    .optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').optional(),
  actualHours: z.number().min(0, 'Actual hours must be positive').optional(),
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is too long'),
  parentCommentId: z.string().optional(),
});

// Filter validation schemas
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])).optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])).optional(),
  assignee: z.array(z.string()).optional(),
  project: z.array(z.string()).optional(),
  team: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])).optional(),
  team: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      file =>
        [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ].includes(file.type),
      'File type not supported'
    ),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
});

// Sort validation
export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  direction: z.enum(['asc', 'desc']).refine(val => val !== undefined, {
    message: 'Sort direction is required',
  }),
});

// Export type inference helpers
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type TeamFormData = z.infer<typeof teamSchema>;
export type TeamInviteFormData = z.infer<typeof teamInviteSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProjectMemberFormData = z.infer<typeof projectMemberSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type TaskFilterData = z.infer<typeof taskFilterSchema>;
export type ProjectFilterData = z.infer<typeof projectFilterSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type SortData = z.infer<typeof sortSchema>;