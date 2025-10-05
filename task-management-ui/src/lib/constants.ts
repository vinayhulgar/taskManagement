// Application constants

export const APP_NAME = 'Task Management';
export const APP_DESCRIPTION = 'Modern task management application for teams';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
  TEAMS: {
    BASE: '/teams',
    MEMBERS: (teamId: string) => `/teams/${teamId}/members`,
    INVITE: (teamId: string) => `/teams/${teamId}/invite`,
    REMOVE_MEMBER: (teamId: string, userId: string) => `/teams/${teamId}/members/${userId}`,
  },
  PROJECTS: {
    BASE: '/projects',
    BY_TEAM: (teamId: string) => `/teams/${teamId}/projects`,
    MEMBERS: (projectId: string) => `/projects/${projectId}/members`,
    ASSIGN_MEMBER: (projectId: string) => `/projects/${projectId}/members`,
  },
  TASKS: {
    BASE: '/tasks',
    BY_PROJECT: (projectId: string) => `/projects/${projectId}/tasks`,
    COMMENTS: (taskId: string) => `/tasks/${taskId}/comments`,
    ATTACHMENTS: (taskId: string) => `/tasks/${taskId}/attachments`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
  ACTIVITIES: {
    BASE: '/activities',
    BY_PROJECT: (projectId: string) => `/projects/${projectId}/activities`,
    BY_TASK: (taskId: string) => `/tasks/${taskId}/activities`,
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'task-management-token',
  REFRESH_TOKEN: 'task-management-refresh-token',
  THEME: 'task-management-theme',
  SIDEBAR_COLLAPSED: 'task-management-sidebar-collapsed',
  TASK_VIEW_MODE: 'task-management-task-view-mode',
  FILTERS: 'task-management-filters',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TEAMS: '/teams',
  TEAM_DETAIL: '/teams/:teamId',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:taskId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const;

// Task statuses with display information
export const TASK_STATUSES = {
  TODO: {
    value: 'TODO',
    label: 'To Do',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  IN_REVIEW: {
    value: 'IN_REVIEW',
    label: 'In Review',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  DONE: {
    value: 'DONE',
    label: 'Done',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
} as const;

// Priority levels with display information
export const PRIORITIES = {
  LOW: {
    value: 'LOW',
    label: 'Low',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '⬇️',
  },
  MEDIUM: {
    value: 'MEDIUM',
    label: 'Medium',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '➡️',
  },
  HIGH: {
    value: 'HIGH',
    label: 'High',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: '⬆️',
  },
  URGENT: {
    value: 'URGENT',
    label: 'Urgent',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '🔥',
  },
} as const;

// Project statuses with display information
export const PROJECT_STATUSES = {
  PLANNING: {
    value: 'PLANNING',
    label: 'Planning',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  ACTIVE: {
    value: 'ACTIVE',
    label: 'Active',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  ON_HOLD: {
    value: 'ON_HOLD',
    label: 'On Hold',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: 'Completed',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
} as const;

// User roles with display information
export const USER_ROLES = {
  ADMIN: {
    value: 'ADMIN',
    label: 'Administrator',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  USER: {
    value: 'USER',
    label: 'User',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
} as const;

// Team roles with display information
export const TEAM_ROLES = {
  OWNER: {
    value: 'OWNER',
    label: 'Owner',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  ADMIN: {
    value: 'ADMIN',
    label: 'Admin',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  MEMBER: {
    value: 'MEMBER',
    label: 'Member',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
} as const;

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
    MESSAGE: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes',
  },
  TEAM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    MESSAGE: 'Team name must be 3-100 characters',
  },
  PROJECT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    MESSAGE: 'Project name must be 3-100 characters',
  },
  TASK_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
    MESSAGE: 'Task title must be 3-200 characters',
  },
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.csv',
  ],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: 'yyyy-MM-dd HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Notification settings
export const NOTIFICATIONS = {
  DEFAULT_DURATION: 5000,
  MAX_VISIBLE: 5,
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  GLOBAL_SEARCH: 'cmd+k',
  NEW_TASK: 'n',
  NEW_PROJECT: 'p',
  NEW_TEAM: 't',
  CLOSE_MODAL: 'escape',
  SAVE: 'cmd+s',
  CANCEL: 'escape',
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;