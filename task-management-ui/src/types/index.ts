// Common types for the Task Management UI

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  teamId: string;
  createdById: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId?: string;
  createdById: string;
  parentTaskId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: Priority;
  assigneeId?: string;
  dueDate?: string;
  parentTaskId?: string;
}

export interface ProjectForm {
  name: string;
  description?: string;
  teamId: string;
  startDate?: string;
  endDate?: string;
}

export interface TeamForm {
  name: string;
  description?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface FilterState {
  search?: string;
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}