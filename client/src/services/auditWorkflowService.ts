import api from './api';

/**
 * Task status enum
 */
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Task status constants
 */
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

/**
 * Task priority enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Task priority constants
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

/**
 * Task approval status enum
 */
export enum ApprovalStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Task approval status constants
 */
export const APPROVAL_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

/**
 * Task comment interface
 */
export interface TaskComment {
  id: number;
  task_id: number;
  comment: string;
  user_id: number;
  author_name?: string;
  created_at: string;
}

/**
 * Task attachment interface
 */
export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: number;
  uploaded_by_name?: string;
  uploaded_at: string;
}

/**
 * Task category interface
 */
export interface TaskCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

/**
 * Task related item interface
 */
export interface TaskRelatedItem {
  id: number;
  task_id: number;
  related_type: string;
  related_id: number;
  created_at: string;
}

/**
 * Task history entry interface
 */
export interface TaskHistoryEntry {
  id: number;
  task_id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by: number;
  changed_by_name?: string;
  changed_at: string;
}

/**
 * Audit task interface
 */
export interface AuditTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_date?: string;
  approval_status: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_date?: string;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  categories?: TaskCategory[];
  related_items?: TaskRelatedItem[];
  comment_count?: number;
}

/**
 * Task list response interface
 */
export interface TaskListResponse {
  data: AuditTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Task filters interface
 */
export interface TaskFilters {
  status?: string;
  priority?: string;
  approval_status?: string;
  assigned_to?: string | number;
  created_by?: number;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

/**
 * Task analytics interface
 */
export interface TaskAnalytics {
  statusCounts: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
  priorityCounts: {
    low: number;
    medium: number;
    high: number;
  };
  approvalStats: {
    not_submitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  completionTrend: {
    date: string;
    completed: number;
  }[];
}

/**
 * Service for interacting with the audit task API
 */
const auditWorkflowService = {
  /**
   * Get all audit tasks with optional filtering
   * @param filters - Filter options
   * @param page - Page number
   * @param limit - Items per page
   * @returns Task list with pagination
   */
  getAllTasks: async (filters: TaskFilters = {}, page = 1, limit = 10): Promise<TaskListResponse> => {
    // Build query params
    const queryParams = new URLSearchParams();
    
    // Add filters
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof TaskFilters];
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    // Add pagination
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    
    console.log(`[API] Fetching tasks with filters:`, filters);
    const response = await api.get(`/audit/tasks?${queryParams.toString()}`);
    console.log(`[API] Retrieved ${response.data.data.length} tasks`);
    return response.data;
  },

  /**
   * Get a task by ID
   * @param id - Task ID
   * @returns Task details
   */
  getTaskById: async (id: number): Promise<AuditTask> => {
    const response = await api.get(`/audit/tasks/${id}`);
    return response.data;
  },

  /**
   * Create a new task
   * @param taskData - Task data
   * @returns Created task response
   */
  createTask: async (taskData: Partial<AuditTask>): Promise<{ id: number; message: string }> => {
    console.log('[API] Creating task with data:', taskData);
    const response = await api.post('/audit/tasks', taskData);
    console.log('[API] Task created successfully:', response.data);
    return response.data;
  },

  /**
   * Update a task
   * @param id - Task ID
   * @param taskData - Updated task data
   * @returns Update response
   */
  updateTask: async (id: number, taskData: Partial<AuditTask>): Promise<{ message: string }> => {
    console.log(`[API] Updating task ${id} with data:`, taskData);
    const response = await api.put(`/audit/tasks/${id}`, taskData);
    console.log(`[API] Task updated successfully:`, response.data);
    return response.data;
  },

  /**
   * Delete a task
   * @param id - Task ID
   * @returns Delete response
   */
  deleteTask: async (id: number): Promise<{ message: string }> => {
    console.log(`[API] Deleting task ${id}`);
    const response = await api.delete(`/audit/tasks/${id}`);
    console.log(`[API] Task deleted successfully:`, response.data);
    return response.data;
  },

  /**
   * Add a comment to a task
   * @param taskId - Task ID
   * @param comment - Comment text
   * @returns Add comment response
   */
  addComment: async (taskId: number, comment: string): Promise<{ id: number; message: string }> => {
    console.log(`[API] Adding comment to task ${taskId}:`, comment);
    const response = await api.post(`/audit/tasks/${taskId}/comments`, { comment });
    console.log(`[API] Comment added successfully:`, response.data);
    return response.data;
  },

  /**
   * Get task history
   * @param taskId - Task ID
   * @returns Task history
   */
  getTaskHistory: async (taskId: number): Promise<TaskHistoryEntry[]> => {
    const response = await api.get(`/audit/tasks/${taskId}/history`);
    return response.data;
  },

  /**
   * Update task status
   * @param taskId - Task ID
   * @param status - New status
   * @returns Update response
   */
  updateTaskStatus: async (taskId: number, status: string): Promise<{ message: string }> => {
    console.log(`[API] Updating status for task ${taskId} to ${status}`);
    const response = await api.put(`/audit/tasks/${taskId}/status`, { status });
    console.log(`[API] Status updated successfully:`, response.data);
    return response.data;
  },

  /**
   * Update task approval status
   * @param taskId - Task ID
   * @param approvalStatus - New approval status
   * @param comment - Optional comment
   * @returns Update response
   */
  updateApprovalStatus: async (
    taskId: number, 
    approvalStatus: string, 
    comment?: string
  ): Promise<{ message: string }> => {
    console.log(`[API] Updating approval status for task ${taskId} to ${approvalStatus}`);
    const response = await api.put(`/audit/tasks/${taskId}/approval`, { 
      approval_status: approvalStatus,
      comment
    });
    console.log(`[API] Approval status updated successfully:`, response.data);
    return response.data;
  },

  /**
   * Get task analytics data
   * @returns Analytics data
   */
  getTaskAnalytics: async (): Promise<TaskAnalytics> => {
    console.log('[API] Fetching task analytics');
    const response = await api.get('/audit/tasks/analytics/summary');
    console.log('[API] Analytics data received:', response.data);
    return response.data;
  }
};

export default auditWorkflowService; 