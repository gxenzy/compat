/**
 * Unified user role definitions for the entire application.
 * These roles are used for permission checks and access control.
 */
export enum UserRole {
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  VIEWER = 'viewer',
  MANAGER = 'manager',
  REVIEWER = 'reviewer',
  STAFF = 'staff',
  MODERATOR = 'moderator',
  USER = 'user'
}

export const enum NotificationType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error'
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: NotificationType[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  student_id?: string;
  role: UserRole;
  name: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  profileImage?: string;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  permissions?: string[];
  notificationPreferences?: NotificationPreferences;
  team?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboardLayout: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
}

export interface SystemSettings {
  siteName: string;
  maxUsers?: number;
  sessionTimeout: number;
  backupFrequency?: number;
  emailNotifications?: boolean;
  maintenanceMode: boolean;
  debugMode?: boolean;
  apiUrl?: string;
  registrationEnabled: boolean;
  allowRegistration: boolean;
  theme?: 'light' | 'dark' | 'energy' | 'blue' | 'gray' | 'darkBlue';
  defaultRole: UserRole;
  passwordPolicy: PasswordPolicy;
  maxLoginAttempts: number;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  preferences?: Partial<UserPreferences>;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  attachments?: any[];
}

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'Open' | 'In Progress' | 'Resolved';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UserWithId extends User {
  _id: string;
}

export interface AuditLog {
  id: string;
  username: string;
  action: string;
  details: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
}

export interface BackupEntry {
  id: string;
  name: string;
  createdAt: Date;
  size: string;
  type?: string;
  status?: 'completed' | 'failed' | 'in_progress';
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export * from './energy-audit'; 