import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Menu,
  Snackbar,
  Checkbox,
  Toolbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';

import {
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Calculate as CalculateIcon,
  DeleteSweep as DeleteSweepIcon,
  Done as DoneIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AssignmentInd as AssignmentIndIcon,
  Flag as FlagIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon
} from '@mui/icons-material';

// Import the API service
import auditWorkflowService from '../../../services/auditWorkflowService';
import userService from '../../../services/userService';

// Import TaskAnalyticsDashboard component
import TaskAnalyticsDashboard from './TaskAnalyticsDashboard';

// Import jsPDF
import { jsPDF } from 'jspdf';
// Import and add jspdf-autotable functionality
import 'jspdf-autotable';

// Simplified type for just this component to avoid conflicts
type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => any;
  lastAutoTable: {
    finalY: number;
  } | undefined;
}

// Define string constants directly for simplicity
const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const APPROVAL_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

interface TaskComment {
  id: string;
  text: string;
  author: string;
  date: string;
}

interface AuditTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: string; // not_started, in_progress, completed
  priority: string; // low, medium, high
  dueDate: string;
  completedDate?: string;
  approvalStatus: string; // not_submitted, pending, approved, rejected
  approvedBy?: string;
  comments: TaskComment[];
}

interface TaskFilters {
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

interface ApiAuditTask {
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
  comments?: ApiTaskComment[];
}

interface ApiTaskComment {
  id: number;
  task_id: number;
  comment: string;
  user_id: number;
  author_name?: string;
  created_at: string;
}

// Define custom filters type for the UI
interface UITaskFilters {
  status?: string;
  priority?: string | 'all';
  search?: string;
  dueDate?: {
    from?: string;
    to?: string;
  };
  assignedTo?: string;
  approvalStatus?: string | 'all';
  sort?: {
    field: 'title' | 'dueDate' | 'priority' | 'status' | 'assignedTo';
    direction: 'asc' | 'desc';
  };
}

// Define helper functions for task conversion
// Function to convert API task to component task
const convertApiTaskToComponentTask = (apiTask: ApiAuditTask): AuditTask => {
  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    description: apiTask.description || '',
    assignedTo: apiTask.assigned_to_name || '',
    status: apiTask.status,
    priority: apiTask.priority,
    dueDate: apiTask.due_date || '',
    completedDate: apiTask.completed_date,
    approvalStatus: apiTask.approval_status,
    approvedBy: apiTask.approved_by_name,
    comments: (apiTask.comments || []).map(comment => ({
      id: comment.id.toString(),
      text: comment.comment,
      author: comment.author_name || 'Unknown',
      date: comment.created_at
    }))
  };
};

// Function to convert component task to API task for updates
const convertComponentTaskToApiTask = (task: AuditTask): Partial<ApiAuditTask> => {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    approval_status: task.approvalStatus,
    assigned_to_name: task.assignedTo
  };
};

// Add this helper function 
const updateTask = (task: AuditTask | null, updates: Partial<AuditTask>): AuditTask => {
  if (!task) {
    // Create a new task with default values and apply updates
    return {
      id: '',
      title: '',
      description: '',
      assignedTo: '',
      status: TASK_STATUS.NOT_STARTED,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: new Date().toISOString().split('T')[0],
      approvalStatus: APPROVAL_STATUS.NOT_SUBMITTED,
      comments: [],
      ...updates
    };
  }
  
  // Update existing task
  return { ...task, ...updates };
};

// Define audit phases for the stepper
const auditPhases = [
  'Planning',
  'Data Collection',
  'Analysis',
  'Findings',
  'Recommendations',
  'Reporting',
  'Follow-up'
];

// Replace mock users with real user data from API
// Change the component to fetch real users and fix task creation
const AuditWorkflow: React.FC = () => {
  // Existing state variables
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<AuditTask | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UITaskFilters>({
    status: auditPhases[0].toLowerCase().replace(/\s+/g, '_')
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    type: 'info'
  });
  
  const [newComment, setNewComment] = useState('');
  const [tasksByStatus, setTasksByStatus] = useState<{
    [key: string]: AuditTask[];
  }>({
    [TASK_STATUS.NOT_STARTED]: [],
    [TASK_STATUS.IN_PROGRESS]: [],
    [TASK_STATUS.COMPLETED]: []
  });
  
  // Add state for real users
  const [userOptions, setUserOptions] = useState<{id: string | number; name: string; role: string}[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch real users with appropriate roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const roles = ['admin', 'manager', 'auditor', 'reviewer', 'staff', 'moderator'];
        const users = await userService.getUsersByRoles(roles);
        
        // Format users for dropdown with proper type annotation
        const formattedUsers = users.map((user: any) => ({
          id: user.id,
          // Use the name field we added in userService
          name: user.name || `${user.username || 'User'} ${user.id || ''}`,
          role: user.role
        }));
        
        console.log('Formatted users for dropdown:', formattedUsers);
        setUserOptions(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Fallback to empty list
        setUserOptions([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // New state for bulk operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'status' | 'priority' | 'assign' | 'delete' | null;
    value?: string;
  }>({
    open: false,
    action: null
  });
  
  // New state for advanced filters
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [tempFilters, setTempFilters] = useState<UITaskFilters>({});
  
  // Toggle advanced filter dialog
  const toggleAdvancedFilter = () => {
    setAdvancedFilterOpen(!advancedFilterOpen);
    if (!advancedFilterOpen) {
      // When opening, initialize temp filters with current filters
      setTempFilters({...filters});
    }
  };
  
  // Apply advanced filters
  const applyAdvancedFilters = () => {
    setFilters(tempFilters);
    setAdvancedFilterOpen(false);
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  // Reset all filters
  const resetAllFilters = () => {
    setTempFilters({});
  };
  
  // Count active filters for badge display
  useEffect(() => {
    let count = 0;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.priority && filters.priority !== 'all') count++;
    if (filters.search) count++;
    if (filters.dueDate?.from || filters.dueDate?.to) count++;
    if (filters.assignedTo) count++;
    if (filters.approvalStatus && filters.approvalStatus !== 'all') count++;
    if (filters.sort) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Fetch tasks on component mount and when filters or page changes
  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage]);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks with filters:', filters);
      
      const apiFilters: TaskFilters = {
        status: filters.status === 'all' ? undefined : filters.status,
        priority: filters.priority === 'all' ? undefined : filters.priority,
        search: filters.search,
        due_date_from: filters.dueDate?.from,
        due_date_to: filters.dueDate?.to,
        assigned_to: filters.assignedTo
      };
      
      const response = await auditWorkflowService.getAllTasks(apiFilters, currentPage, 10);
      console.log('Received tasks:', response.data);
      
      // Transform API tasks to component format
      const transformedTasks = response.data.map(convertApiTaskToComponentTask);
      setTasks(transformedTasks);
      setTotalPages(response.pagination.total_pages);
      
      // Organize tasks by status for drag and drop view
      const tasksByStatusMap = {
        [TASK_STATUS.NOT_STARTED]: transformedTasks.filter(t => t.status === TASK_STATUS.NOT_STARTED),
        [TASK_STATUS.IN_PROGRESS]: transformedTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS),
        [TASK_STATUS.COMPLETED]: transformedTasks.filter(t => t.status === TASK_STATUS.COMPLETED)
      };
      
      setTasksByStatus(tasksByStatusMap);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showNotification('Failed to fetch tasks from database. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Set up an empty task object when clicking "New Task"
  const initializeNewTask = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setCurrentTask({
      id: '',
      title: '',
      description: '',
      assignedTo: '',
      status: TASK_STATUS.NOT_STARTED,
      priority: TASK_PRIORITY.MEDIUM,
      dueDate: today,
      approvalStatus: APPROVAL_STATUS.NOT_SUBMITTED,
      comments: []
    });
    
    setTaskDialogOpen(true);
  };

  // Function to handle closing the task dialog
  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setCurrentTask(null);
  };

  // Function to handle saving a task (create or update)
  const handleSaveTask = async () => {
    if (!currentTask) return;
    
    // Validate required fields
    if (!currentTask.title.trim()) {
      showNotification('Task title is required', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert component task to API format
      const apiTask = convertComponentTaskToApiTask(currentTask);
      
      if (currentTask.id) {
        // Update existing task
        await auditWorkflowService.updateTask(parseInt(currentTask.id), apiTask);
        showNotification('Task updated successfully', 'success');
      } else {
        // Create new task - add debugging info
        console.log('Creating new task with data:', apiTask);
        
        try {
          const result = await auditWorkflowService.createTask(apiTask);
          console.log('Task creation result:', result);
          
          // Create new task with the returned ID for immediate UI feedback
          const newTask: AuditTask = {
            id: result.id.toString(),
            title: currentTask.title,
            description: currentTask.description,
            assignedTo: currentTask.assignedTo,
            status: currentTask.status,
            priority: currentTask.priority,
            dueDate: currentTask.dueDate,
            approvalStatus: APPROVAL_STATUS.NOT_SUBMITTED,
            comments: []
          };
          
          // Add to UI immediately for better user experience
          setTasks(prev => [...prev, newTask]);
          
          showNotification('Task created successfully', 'success');
        } catch (createError: any) {
          console.error('Detailed create task error:', createError.response?.data || createError);
          throw createError;
        }
      }
      
      // Refresh task list
      await fetchTasks();
      
      // Close dialog and reset form
      setTaskDialogOpen(false);
      setCurrentTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Failed to save task. Please check the console for details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle phase change with proper updates
  const handlePhaseChange = (phase: number) => {
    if (phase >= 0 && phase < auditPhases.length) {
      const phaseStatus = auditPhases[phase].toLowerCase().replace(/\s+/g, '_');
      
      // If we have a current task selected, update its status
      if (currentTask && currentTask.id) {
        // For existing task, update via API
        handleUpdateTaskStatus(currentTask.id, phaseStatus);
      } else {
        // For filtering, update filters to show tasks in this phase
        setFilters({
          ...filters,
          status: phaseStatus
        });
      }
      
      showNotification(`Moved to ${auditPhases[phase]} phase`, 'success');
    }
  };

  const handleEditTask = (task: AuditTask) => {
    setCurrentTask(task);
    setTaskDialogOpen(true);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Call API to update task status using string value instead of enum
      await auditWorkflowService.updateTaskStatus(parseInt(taskId), newStatus);
      
      // Refresh task list
      fetchTasks();
      
      setLoading(false);
      
      showNotification(`Task status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      setLoading(false);
      showNotification('Failed to update task status', 'error');
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      // Call API to approve task
      await auditWorkflowService.updateApprovalStatus(
        parseInt(taskId),
        APPROVAL_STATUS.APPROVED,
        'Task approved'
      );
      
      // Refresh task list
      fetchTasks();
      
      setLoading(false);
      
      showNotification('Task approved successfully', 'success');
    } catch (error) {
      console.error('Error approving task:', error);
      setLoading(false);
      showNotification('Failed to approve task', 'error');
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      // Call API to reject task
      await auditWorkflowService.updateApprovalStatus(
        parseInt(taskId),
        APPROVAL_STATUS.REJECTED,
        'Task rejected'
      );
      
      // Refresh task list
      fetchTasks();
      
      setLoading(false);
      
      showNotification('Task rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting task:', error);
      setLoading(false);
      showNotification('Failed to reject task', 'error');
    }
  };

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter(task => {
    // Filter by status if selected
    if (filters.status) {
      // Type safety: check as string to compare with 'all'
      const statusFilter = filters.status as string;
      if (statusFilter !== 'all' && task.status !== filters.status) {
        return false;
      }
    }
    
    // Filter by priority if selected
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Filter by search query
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Statistics for dashboard
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    notStarted: tasks.filter(t => t.status === 'not_started').length,
    pendingApproval: tasks.filter(t => t.approvalStatus === 'pending').length,
    overdue: tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      return dueDate < today && t.status !== 'completed';
    }).length
  };

  const renderTaskStatus = (status: string) => {
    // Check if this is one of the standard statuses
    if (status === TASK_STATUS.COMPLETED) {
      return <Chip label="Completed" color="success" size="small" />;
    } else if (status === TASK_STATUS.IN_PROGRESS) {
      return <Chip label="In Progress" color="primary" size="small" />;
    } else if (status === TASK_STATUS.NOT_STARTED) {
      return <Chip label="Not Started" color="default" size="small" />;
    } 
    
    // Check if it's one of the phases
    const matchingPhase = auditPhases.find(phase => 
      phase.toLowerCase().replace(/\s+/g, '_') === status
    );
    
    if (matchingPhase) {
      return <Chip label={matchingPhase} color="info" size="small" />;
    }
    
    // Default fallback
    return <Chip label={status.replace(/_/g, ' ')} size="small" />;
  };

  const renderApprovalStatus = (status: string) => {
    switch(status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      case 'pending':
        return <Chip label="Pending Approval" color="warning" size="small" />;
      case 'not_submitted':
        return <Chip label="Not Submitted" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const renderPriority = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Chip label="High" color="error" size="small" />;
      case 'medium':
        return <Chip label="Medium" color="warning" size="small" />;
      case 'low':
        return <Chip label="Low" color="info" size="small" />;
      default:
        return <Chip label={priority} size="small" />;
    }
  };

  // Open task menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, taskId: string) => {
    setCurrentTask(tasks.find(task => task.id === taskId) || null);
  };

  // Close task menu
  const handleMenuClose = () => {
    setCurrentTask(null);
  };

  // Open task details
  const handleOpenTask = (task: AuditTask) => {
    setCurrentTask(task);
  };

  // Close task details
  const handleCloseTask = () => {
    setCurrentTask(null);
  };

  // Edit task
  const handleEditTaskDetails = () => {
    setCurrentTask(null);
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!currentTask) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to delete task
      await auditWorkflowService.deleteTask(parseInt(currentTask.id));
      
      // Refresh task list
      fetchTasks();
      
      // Close any open dialogs
      setCurrentTask(null);
      setTaskDialogOpen(false);
      setLoading(false);
      
      showNotification('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      setLoading(false);
      showNotification('Failed to delete task', 'error');
    }
  };

  // Add a comment to a task
  const handleAddComment = async () => {
    if (!currentTask || !newComment.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to add comment
      await auditWorkflowService.addComment(parseInt(currentTask.id), newComment);
      
      // Refresh task to get updated comments
      const updatedTask = await auditWorkflowService.getTaskById(parseInt(currentTask.id));
      setCurrentTask(convertApiTaskToComponentTask(updatedTask));
      
      // Clear comment field
      setNewComment('');
      setLoading(false);
      
      showNotification('Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      setLoading(false);
      showNotification('Failed to add comment', 'error');
    }
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'not_started': return 'default';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  // Get color for priority
  const getPriorityColor = (priority: AuditTask['priority']) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Formatted date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add notification display function if it doesn't exist
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      open: true,
      message,
      type
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({...prev, open: false}));
    }, 3000);
  };

  // Function to launch calculators based on task type
  const launchRelatedCalculator = (taskTitle: string) => {
    let calculatorType = '';
    let calculatorIndex = 0;
    
    // Determine which calculator to launch based on task title/description
    if (taskTitle.toLowerCase().includes('lighting') || 
        taskTitle.toLowerCase().includes('lpd') || 
        taskTitle.toLowerCase().includes('light')) {
      // For lighting-related tasks, navigate to the LPD calculator
      calculatorType = 'Lighting Power Density Calculator';
      calculatorIndex = 10;
    } else if (taskTitle.toLowerCase().includes('hvac') || 
               taskTitle.toLowerCase().includes('air conditioning')) {
      // For HVAC-related tasks
      calculatorType = 'HVAC Calculator';
      calculatorIndex = 5;
    } else if (taskTitle.toLowerCase().includes('power') || 
               taskTitle.toLowerCase().includes('electrical') || 
               taskTitle.includes('energy')) {
      // For electrical system tasks
      calculatorType = 'Energy Calculator';
      calculatorIndex = 1;
    } else if (taskTitle.toLowerCase().includes('harmonic')) {
      // For harmonic distortion tasks
      calculatorType = 'Harmonic Distortion Calculator';
      calculatorIndex = 8;
    } else if (taskTitle.toLowerCase().includes('voltage') || 
               taskTitle.toLowerCase().includes('drop')) {
      // For voltage regulation tasks
      calculatorType = 'Voltage Regulation Calculator';
      calculatorIndex = 9;
    } else if (taskTitle.toLowerCase().includes('illumination') || 
               taskTitle.toLowerCase().includes('lux')) {
      // For illumination tasks
      calculatorType = 'Illumination Calculator';
      calculatorIndex = 3;
    } else if (taskTitle.toLowerCase().includes('roi') || 
               taskTitle.toLowerCase().includes('return on investment') || 
               taskTitle.toLowerCase().includes('payback')) {
      // For ROI calculation tasks
      calculatorType = 'ROI Calculator';
      calculatorIndex = 6;
    } else if (taskTitle.toLowerCase().includes('power factor')) {
      // For power factor tasks
      calculatorType = 'Power Factor Calculator';
      calculatorIndex = 7;
    } else {
      // Default to calculator overview
      calculatorType = 'Calculators Overview';
      calculatorIndex = 0;
    }
    
    // Show feedback to user before navigating
    showNotification(`Launching ${calculatorType}...`, 'info');
    
    // Navigate to the appropriate calculator
    navigate(`/energy-audit/calculators?tab=${calculatorIndex}`);
  };

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    // If dropped outside of a droppable area
    if (!result.destination) {
      return;
    }
    
    // If dropped in the same status column at the same position
    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) {
      return;
    }
    
    // Get source and destination status
    const sourceStatus = result.source.droppableId;
    const destinationStatus = result.destination.droppableId;
    
    // Create a deep copy of the current tasksByStatus state
    const updatedTasksByStatus = { ...tasksByStatus };
    
    // Get the task being moved
    const taskToMove = { ...updatedTasksByStatus[sourceStatus][result.source.index] };
    
    // If the status is changing, update the task status
    if (sourceStatus !== destinationStatus) {
      taskToMove.status = destinationStatus;
      
      try {
        // Update the task status in the backend
        await auditWorkflowService.updateTaskStatus(parseInt(taskToMove.id), destinationStatus);
        showNotification(`Task moved to ${destinationStatus.replace('_', ' ')}`, 'success');
      } catch (error) {
        console.error('Error updating task status:', error);
        showNotification('Failed to update task status', 'error');
        return;
      }
    }
    
    // Remove the task from the source list
    updatedTasksByStatus[sourceStatus].splice(result.source.index, 1);
    
    // Add the task to the destination list
    updatedTasksByStatus[destinationStatus].splice(
      result.destination.index, 
      0, 
      taskToMove
    );
    
    // Update the state
    setTasksByStatus(updatedTasksByStatus);
    
    // Update the overall tasks list to reflect the changes
    const allTasks = [
      ...updatedTasksByStatus[TASK_STATUS.NOT_STARTED],
      ...updatedTasksByStatus[TASK_STATUS.IN_PROGRESS],
      ...updatedTasksByStatus[TASK_STATUS.COMPLETED]
    ];
    
    setTasks(allTasks);
  };

  // Simple task card component for drag and drop view
  const TaskCard = ({ task, index }: { task: AuditTask; index: number }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: snapshot.isDragging ? theme.palette.grey[100] : 'white',
            boxShadow: snapshot.isDragging ? 5 : 1,
            cursor: 'grab'
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {task.title}
            </Typography>
            <Typography variant="body2" noWrap sx={{ mb: 1 }}>
              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip
                size="small"
                label={`Priority: ${task.priority}`}
                color={getPriorityColor(task.priority)}
              />
              <Typography variant="caption">
                {task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date'}
              </Typography>
            </Box>
          </Box>
        </Card>
      )}
    </Draggable>
  );
  
  // Render the kanban board view
  const renderKanbanBoard = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Paper
            key={status}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              flex: 1,
              minWidth: { xs: '100%', md: '33%' },
              maxHeight: 600,
              overflowY: 'auto'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                p: 1,
                mb: 2,
                textAlign: 'center',
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
              }}
            >
              {status === TASK_STATUS.NOT_STARTED && 'Not Started'}
              {status === TASK_STATUS.IN_PROGRESS && 'In Progress'}
              {status === TASK_STATUS.COMPLETED && 'Completed'}
              <Typography variant="caption" sx={{ ml: 1 }}>
                ({statusTasks.length})
              </Typography>
            </Typography>
            
            <Droppable droppableId={status}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ minHeight: 100 }}
                >
                  {statusTasks.map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} />
                  ))}
                  {provided.placeholder}
                  {statusTasks.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2, textAlign: 'center' }}
                    >
                      No tasks
                    </Typography>
                  )}
                </Box>
              )}
            </Droppable>
          </Paper>
        ))}
      </Box>
    </DragDropContext>
  );

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // Clear selections when exiting select mode
      setSelectedTasks(new Set());
    }
  };

  // Select all visible tasks
  const selectAllTasks = () => {
    const allTaskIds = filteredTasks.map(task => task.id);
    setSelectedTasks(new Set(allTaskIds));
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedTasks(new Set());
  };

  // Open bulk action menu
  const openBulkActionMenu = (event: React.MouseEvent<HTMLElement>) => {
    setBulkActionMenuAnchor(event.currentTarget);
  };

  // Close bulk action menu
  const closeBulkActionMenu = () => {
    setBulkActionMenuAnchor(null);
  };

  // Open bulk action dialog
  const openBulkActionDialog = (action: 'status' | 'priority' | 'assign' | 'delete') => {
    setBulkActionDialog({
      open: true,
      action,
    });
    closeBulkActionMenu();
  };

  // Close bulk action dialog
  const closeBulkActionDialog = () => {
    setBulkActionDialog({
      ...bulkActionDialog,
      open: false
    });
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (!bulkActionDialog.action || !bulkActionDialog.value) {
      return;
    }

    try {
      setLoading(true);
      const taskIds = Array.from(selectedTasks).map(id => parseInt(id));
      
      switch (bulkActionDialog.action) {
        case 'status':
          // Update status for all selected tasks
          await Promise.all(
            taskIds.map(id => 
              auditWorkflowService.updateTaskStatus(
                id, 
                bulkActionDialog.value || ''
              )
            )
          );
          showNotification(`Updated status for ${taskIds.length} tasks`, 'success');
          break;
          
        case 'priority':
          // Update priority for all selected tasks
          await Promise.all(
            taskIds.map(id => 
              auditWorkflowService.updateTask(
                id, 
                { priority: bulkActionDialog.value || '' }
              )
            )
          );
          showNotification(`Updated priority for ${taskIds.length} tasks`, 'success');
          break;
          
        case 'assign':
          // Assign tasks to user by name not id
          await Promise.all(
            taskIds.map(id => 
              auditWorkflowService.updateTask(
                id, 
                { assigned_to_name: bulkActionDialog.value || '' }
              )
            )
          );
          const assigneeName = bulkActionDialog.value || 'Unassigned';
          showNotification(`Assigned ${taskIds.length} tasks to ${assigneeName}`, 'success');
          break;
          
        case 'delete':
          // Delete all selected tasks
          await Promise.all(
            taskIds.map(id => auditWorkflowService.deleteTask(id))
          );
          showNotification(`Deleted ${taskIds.length} tasks`, 'success');
          break;
      }
      
      // Refresh tasks and exit select mode
      await fetchTasks();
      setSelectMode(false);
      clearSelections();
      closeBulkActionDialog();
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotification('Failed to perform bulk action', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to export audit report as PDF
  const exportAuditReport = () => {
    try {
      // Cast the document to our local type that includes autoTable
      const doc = new jsPDF() as JsPDFWithAutoTable;
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text('Energy Audit Workflow Report', 105, 20, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
      
      // Add summary section
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text('Task Summary', 20, 45);
      
      // Summary table
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const summaryData = [
        ['Total Tasks', String(taskStats.total)],
        ['Completed', String(taskStats.completed)],
        ['In Progress', String(taskStats.inProgress)],
        ['Not Started', String(taskStats.notStarted)],
        ['Pending Approval', String(taskStats.pendingApproval)],
        ['Overdue', String(taskStats.overdue)]
      ];
      
      // We can now use doc.autoTable directly with our cast
      doc.autoTable({
        startY: 50,
        head: [['Status', 'Count']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 50 }
      });
      
      // Phase Progress
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      // Use a safe way to access the last table's Y position
      const firstTableY = (doc.lastAutoTable?.finalY) || 120;
      doc.text('Phase Progress', 20, firstTableY + 20);
      
      // Count tasks by phase
      const phaseData = auditPhases.map(phase => {
        const phaseKey = phase.toLowerCase().replace(/\s+/g, '_');
        const count = tasks.filter(t => t.status === phaseKey).length;
        const percentage = taskStats.total > 0 ? Math.round((count / taskStats.total) * 100) : 0;
        return [phase, `${count} tasks (${percentage}%)`];
      });
      
      doc.autoTable({
        startY: firstTableY + 25,
        head: [['Phase', 'Progress']],
        body: phaseData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Task Details
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text('Detailed Task List', 20, 20);
      
      // Format tasks for detailed table
      const taskData = tasks.map(task => [
        task.title,
        renderTaskStatusText(task.status),
        renderPriorityText(task.priority),
        task.assignedTo || 'Unassigned',
        formatDate(task.dueDate),
        renderApprovalStatusText(task.approvalStatus)
      ]);
      
      doc.autoTable({
        startY: 25,
        head: [['Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Approval']],
        body: taskData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      });
      
      // Save the PDF
      doc.save('energy-audit-workflow-report.pdf');
      
      showNotification('Audit report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showNotification('Failed to export report', 'error');
    }
  };
  
  // Helper functions for PDF export
  const renderTaskStatusText = (status: string): string => {
    if (status === TASK_STATUS.COMPLETED) return 'Completed';
    if (status === TASK_STATUS.IN_PROGRESS) return 'In Progress';
    if (status === TASK_STATUS.NOT_STARTED) return 'Not Started';
    
    // Check if it's one of the phases
    const matchingPhase = auditPhases.find(phase => 
      phase.toLowerCase().replace(/\s+/g, '_') === status
    );
    
    return matchingPhase || status;
  };
  
  const renderPriorityText = (priority: string): string => {
    if (priority === TASK_PRIORITY.LOW) return 'Low';
    if (priority === TASK_PRIORITY.MEDIUM) return 'Medium';
    if (priority === TASK_PRIORITY.HIGH) return 'High';
    return priority;
  };
  
  const renderApprovalStatusText = (status: string): string => {
    if (status === APPROVAL_STATUS.NOT_SUBMITTED) return 'Not Submitted';
    if (status === APPROVAL_STATUS.PENDING) return 'Pending';
    if (status === APPROVAL_STATUS.APPROVED) return 'Approved';
    if (status === APPROVAL_STATUS.REJECTED) return 'Rejected';
    return status;
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Audit Management Workflow</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<PdfIcon />}
            onClick={exportAuditReport}
          >
            Export Report
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={initializeNewTask}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {/* View Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Task Management" />
          <Tab label="Kanban Board" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Audit Phases Stepper - Only show in Task Management tab */}
      {currentTab === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={Math.max(auditPhases.findIndex(phase => 
            phase.toLowerCase().replace(/\s+/g, '_') === filters.status
          ), 0)} alternativeLabel>
            {auditPhases.map((label, index) => (
              <Step key={label} completed={false}>
                <StepLabel
                  onClick={() => handlePhaseChange(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              disabled={filters.status === auditPhases[0].toLowerCase().replace(/\s+/g, '_')}
              onClick={() => {
                const currentIndex = Math.max(auditPhases.findIndex(phase => 
                  phase.toLowerCase().replace(/\s+/g, '_') === filters.status
                ), 0);
                handlePhaseChange(Math.max(currentIndex - 1, 0));
              }}
            >
              Back
            </Button>
                          <Button
                variant="contained"
                disabled={filters.status === auditPhases[auditPhases.length - 1].toLowerCase().replace(/\s+/g, '_')}
                onClick={() => {
                  const currentIndex = Math.max(auditPhases.findIndex(phase => 
                    phase.toLowerCase().replace(/\s+/g, '_') === filters.status
                  ), 0);
                  handlePhaseChange(Math.min(currentIndex + 1, auditPhases.length - 1));
                }}
                          >
              Next Phase
            </Button>
          </Box>
        </Paper>
      )}

      {/* Task Management View */}
      {currentTab === 0 && (
        <>
          {/* Task Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Filter Tasks</Typography>
              <Badge badgeContent={activeFiltersCount} color="primary">
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={toggleAdvancedFilter}
                  startIcon={<SearchIcon />}
                >
                  Advanced Filters
                </Button>
              </Badge>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || 'all'}
                    label="Status"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      setFilters({
                        ...filters, 
                        status: value
                      });
                    }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value={TASK_STATUS.NOT_STARTED}>Not Started</MenuItem>
                    <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                    <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority || 'all'}
                    label="Priority"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      setFilters({
                        ...filters, 
                        priority: value
                      });
                    }}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                    <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                    <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  variant="outlined"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  InputProps={{
                    endAdornment: (
                      <SearchIcon color="action" />
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {filters.status && filters.status !== 'all' && (
                  <Chip 
                    label={`Status: ${filters.status.replace('_', ' ')}`} 
                    onDelete={() => setFilters({...filters, status: 'all'})}
                    size="small"
                  />
                )}
                {filters.priority && filters.priority !== 'all' && (
                  <Chip 
                    label={`Priority: ${filters.priority}`} 
                    onDelete={() => setFilters({...filters, priority: 'all'})}
                    size="small"
                  />
                )}
                {filters.search && (
                  <Chip 
                    label={`Search: ${filters.search}`} 
                    onDelete={() => setFilters({...filters, search: ''})}
                    size="small"
                  />
                )}
                {filters.dueDate?.from && (
                  <Chip 
                    label={`Due From: ${filters.dueDate.from}`} 
                    onDelete={() => setFilters({
                      ...filters, 
                      dueDate: { ...filters.dueDate, from: undefined }
                    })}
                    size="small"
                  />
                )}
                {filters.dueDate?.to && (
                  <Chip 
                    label={`Due To: ${filters.dueDate.to}`} 
                    onDelete={() => setFilters({
                      ...filters, 
                      dueDate: { ...filters.dueDate, to: undefined }
                    })}
                    size="small"
                  />
                )}
                {filters.assignedTo && (
                  <Chip 
                    label={`Assigned: ${userOptions.find(u => u.id === filters.assignedTo)?.name || 'Unknown'}`} 
                    onDelete={() => setFilters({...filters, assignedTo: undefined})}
                    size="small"
                  />
                )}
                {filters.approvalStatus && filters.approvalStatus !== 'all' && (
                  <Chip 
                    label={`Approval: ${filters.approvalStatus.replace('_', ' ')}`} 
                    onDelete={() => setFilters({...filters, approvalStatus: 'all'})}
                    size="small"
                  />
                )}
                {filters.sort && (
                  <Chip 
                    label={`Sort: ${filters.sort.field} ${filters.sort.direction === 'asc' ? '↑' : '↓'}`} 
                    onDelete={() => setFilters({...filters, sort: undefined})}
                    size="small"
                  />
                )}
                {activeFiltersCount > 1 && (
                  <Chip 
                    label="Clear All Filters" 
                    onDelete={() => setFilters({})}
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
            )}
          </Paper>

          <Grid container spacing={3}>
            {/* Task List */}
            <Grid item xs={12} md={currentTask ? 6 : 12}>
              <Paper sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Tasks - {auditPhases.find(phase => 
                    phase.toLowerCase().replace(/\s+/g, '_') === filters.status
                  ) || 'All'} Phase</Typography>
                  <Box>
                    <Button 
                      variant={selectMode ? "contained" : "outlined"} 
                      size="small" 
                      onClick={toggleSelectMode} 
                      sx={{ mr: 1 }}
                    >
                      {selectMode ? "Cancel Selection" : "Bulk Select"}
                    </Button>
                    {selectMode && (
                      <>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={selectAllTasks} 
                          sx={{ mr: 1 }}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={openBulkActionMenu}
                          disabled={selectedTasks.size === 0}
                          color="primary"
                        >
                          Bulk Actions ({selectedTasks.size})
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <Box 
                      key={task.id}
                      sx={{ 
                        p: 2, 
                        borderBottom: '1px solid', 
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                        cursor: selectMode ? 'default' : 'pointer',
                        display: 'flex',
                        bgcolor: selectedTasks.has(task.id) ? 'action.selected' : 'inherit'
                      }}
                      onClick={() => selectMode ? toggleTaskSelection(task.id) : handleOpenTask(task)}
                    >
                      {selectMode && (
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                          <Checkbox 
                            checked={selectedTasks.has(task.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskSelection(task.id);
                            }} 
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">{task.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {task.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={task.status.replace('_', ' ')}
                              color={getStatusColor(task.status)}
                            />
                            <Chip
                              size="small"
                              label={`Priority: ${task.priority}`}
                              color={getPriorityColor(task.priority)}
                            />
                            <Chip
                              size="small"
                              icon={<PersonIcon />}
                              label={task.assignedTo || 'Unassigned'}
                              sx={{ 
                                maxWidth: '150px',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }}
                            />
                            <Chip
                              size="small"
                              icon={<CalendarIcon />}
                              label={`Due: ${formatDate(task.dueDate)}`}
                            />
                          </Box>
                        </Box>
                        {!selectMode && (
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, task.id);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No tasks found in this phase.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={initializeNewTask}
                      sx={{ mt: 2 }}
                    >
                      Create Your First Task
                    </Button>
                  </Box>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                      {`Page ${currentPage} of ${totalPages}`}
                    </Box>
                    <Button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Task Details */}
            {currentTask && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {currentTask.status === 'Planning' ? 'New Task' : 'Task Details'}
                    </Typography>
                    <Box>
                      {currentTask.status === 'Planning' ? (
                        <>
                          <Button 
                            startIcon={<SaveIcon />} 
                            variant="contained" 
                            size="small"
                            onClick={handleSaveTask}
                            sx={{ mr: 1 }}
                          >
                            Save
                          </Button>
                          <Button 
                            startIcon={<CancelIcon />} 
                            variant="outlined" 
                            size="small"
                            onClick={() => setCurrentTask(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            startIcon={<EditIcon />} 
                            variant="outlined" 
                            size="small"
                            onClick={handleEditTaskDetails}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            size="small"
                            onClick={handleCloseTask}
                          >
                            Close
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>

                  {currentTask.status === 'Planning' ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Title"
                        value={currentTask.title}
                        onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                        margin="normal"
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        value={currentTask.description}
                        onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                      />
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            select
                            label="Status"
                            value={currentTask.status}
                            onChange={(e) => setCurrentTask({ 
                              ...currentTask, 
                              status: e.target.value as AuditTask['status'] 
                            })}
                          >
                            {auditPhases.map(status => (
                              <MenuItem key={status} value={status}>{status.replace('_', ' ')}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            select
                            label="Priority"
                            value={currentTask.priority}
                            onChange={(e) => setCurrentTask({ 
                              ...currentTask, 
                              priority: e.target.value as AuditTask['priority'] 
                            })}
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth margin="normal">
                            <InputLabel>Assignee</InputLabel>
                            <Select
                              value={currentTask?.assignedTo || ''}
                              onChange={(e) => currentTask && setCurrentTask({ 
                                ...currentTask, 
                                assignedTo: e.target.value as string
                              })}
                              label="Assignee"
                              displayEmpty
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 224,
                                  },
                                },
                                // Fix for text zooming issue
                                anchorOrigin: {
                                  vertical: 'bottom',
                                  horizontal: 'left',
                                },
                                transformOrigin: {
                                  vertical: 'top',
                                  horizontal: 'left',
                                },
                              }}
                            >
                              <MenuItem value="">Unassigned</MenuItem>
                              {userOptions.map((user) => (
                                <MenuItem 
                                  key={user.id} 
                                  value={user.name}
                                  sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    typography: 'body1', // Ensure consistent typography
                                  }}
                                >
                                  <Box component="span" sx={{ mr: 2 }}>{user.name}</Box>
                                  <Chip 
                                    label={user.role} 
                                    size="small" 
                                    sx={{ ml: 'auto' }}
                                    color={
                                      user.role === 'Admin' ? 'error' :
                                      user.role === 'Manager' ? 'primary' :
                                      user.role === 'Auditor' ? 'secondary' :
                                      user.role === 'Reviewer' ? 'success' :
                                      user.role === 'Moderator' ? 'warning' : 'default'
                                    }
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Due Date"
                            type="date"
                            value={currentTask.dueDate}
                            onChange={(e) => setCurrentTask({ ...currentTask, dueDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h6">{currentTask.title}</Typography>
                      <Typography variant="body1" paragraph sx={{ mt: 1 }}>
                        {currentTask.description}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                          <Chip
                            label={currentTask.status.replace('_', ' ')}
                            color={getStatusColor(currentTask.status)}
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                          <Chip
                            label={currentTask.priority}
                            color={getPriorityColor(currentTask.priority)}
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {currentTask.assignedTo}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {formatDate(currentTask.dueDate)}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Add Calculator Button */}
                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<CalculateIcon />}
                          onClick={() => launchRelatedCalculator(currentTask.title)}
                          fullWidth
                        >
                          Launch Related Calculator
                        </Button>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>Comments</Typography>
                      
                      {currentTask.comments.length > 0 ? (
                        <Box sx={{ mb: 2 }}>
                          {currentTask.comments.map(comment => (
                            <Card key={comment.id} variant="outlined" sx={{ mb: 1 }}>
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle2">{comment.author}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(comment.date).toLocaleString()}
                                  </Typography>
                                </Box>
                                <Typography variant="body2">{comment.text}</Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No comments yet.
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          size="small"
                        />
                        <Button 
                          variant="contained" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          Add
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Kanban Board View */}
      {currentTab === 1 && (
        <>
          {/* Task Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Filter Tasks</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority || 'all'}
                    label="Priority"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      setFilters({
                        ...filters, 
                        priority: value
                      });
                    }}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                    <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                    <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  variant="outlined"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  InputProps={{
                    endAdornment: (
                      <SearchIcon color="action" />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* Render Kanban Board */}
          {renderKanbanBoard()}
        </>
      )}

      {/* Analytics Dashboard View */}
      {currentTab === 2 && (
        <TaskAnalyticsDashboard />
      )}

      {/* Task Menu */}
      <Menu
        anchorEl={currentTask ? null : undefined}
        open={Boolean(currentTask)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTaskDetails}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Action Menu */}
      <Menu
        anchorEl={bulkActionMenuAnchor}
        open={Boolean(bulkActionMenuAnchor)}
        onClose={closeBulkActionMenu}
      >
        <MenuItem onClick={() => openBulkActionDialog('status')}>
          <ListItemIcon>
            <AssignmentTurnedInIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openBulkActionDialog('priority')}>
          <ListItemIcon>
            <FlagIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Priority</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openBulkActionDialog('assign')}>
          <ListItemIcon>
            <AssignmentIndIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign To</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openBulkActionDialog('delete')}>
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>Delete Tasks</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialog.open}
        onClose={closeBulkActionDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {bulkActionDialog.action === 'status' && 'Update Status for Selected Tasks'}
          {bulkActionDialog.action === 'priority' && 'Update Priority for Selected Tasks'}
          {bulkActionDialog.action === 'assign' && 'Assign Selected Tasks'}
          {bulkActionDialog.action === 'delete' && 'Delete Selected Tasks'}
        </DialogTitle>
        <DialogContent>
          {bulkActionDialog.action === 'status' && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={bulkActionDialog.value || ''}
                label="Status"
                onChange={(e) => setBulkActionDialog({
                  ...bulkActionDialog,
                  value: e.target.value
                })}
              >
                <MenuItem value={TASK_STATUS.NOT_STARTED}>Not Started</MenuItem>
                <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
              </Select>
            </FormControl>
          )}
          {bulkActionDialog.action === 'priority' && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={bulkActionDialog.value || ''}
                label="Priority"
                onChange={(e) => setBulkActionDialog({
                  ...bulkActionDialog,
                  value: e.target.value
                })}
              >
                <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
              </Select>
            </FormControl>
          )}
          {bulkActionDialog.action === 'assign' && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={bulkActionDialog.value || ''}
                label="Assignee"
                onChange={(e) => setBulkActionDialog({
                  ...bulkActionDialog,
                  value: e.target.value
                })}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                    },
                  },
                  // Fix for text zooming issue
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {userOptions.map((user) => (
                  <MenuItem 
                    key={user.id} 
                    value={user.name}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      typography: 'body1',
                    }}
                  >
                    <Box component="span" sx={{ mr: 2 }}>{user.name}</Box>
                    <Chip 
                      label={user.role} 
                      size="small" 
                      sx={{ ml: 'auto' }}
                      color={
                        user.role === 'Admin' ? 'error' :
                        user.role === 'Manager' ? 'primary' :
                        user.role === 'Auditor' ? 'secondary' :
                        user.role === 'Reviewer' ? 'success' :
                        user.role === 'Moderator' ? 'warning' : 'default'
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {bulkActionDialog.action === 'delete' && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete {selectedTasks.size} tasks? This action cannot be undone.
              </Typography>
              <Typography variant="body2" color="error">
                Type "DELETE" to confirm:
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                margin="normal"
                onChange={(e) => setBulkActionDialog({
                  ...bulkActionDialog,
                  value: e.target.value
                })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulkActionDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color={bulkActionDialog.action === 'delete' ? 'error' : 'primary'}
            onClick={executeBulkAction}
            disabled={(bulkActionDialog.action === 'delete' && bulkActionDialog.value !== 'DELETE') || !bulkActionDialog.value}
          >
            {bulkActionDialog.action === 'delete' ? 'Delete' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Filter Dialog */}
      <Dialog 
        open={advancedFilterOpen} 
        onClose={toggleAdvancedFilter}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={tempFilters.status || 'all'}
                  label="Status"
                  onChange={(e) => {
                    const value = e.target.value as string;
                    setTempFilters({
                      ...tempFilters, 
                      status: value
                    });
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value={TASK_STATUS.NOT_STARTED}>Not Started</MenuItem>
                  <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                  <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Priority Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={tempFilters.priority || 'all'}
                  label="Priority"
                  onChange={(e) => {
                    const value = e.target.value as string;
                    setTempFilters({
                      ...tempFilters, 
                      priority: value
                    });
                  }}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                  <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Approval Status Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={tempFilters.approvalStatus || 'all'}
                  label="Approval Status"
                  onChange={(e) => {
                    const value = e.target.value as string;
                    setTempFilters({
                      ...tempFilters, 
                      approvalStatus: value
                    });
                  }}
                >
                  <MenuItem value="all">All Approval Statuses</MenuItem>
                  <MenuItem value={APPROVAL_STATUS.NOT_SUBMITTED}>Not Submitted</MenuItem>
                  <MenuItem value={APPROVAL_STATUS.PENDING}>Pending</MenuItem>
                  <MenuItem value={APPROVAL_STATUS.APPROVED}>Approved</MenuItem>
                  <MenuItem value={APPROVAL_STATUS.REJECTED}>Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Assignee Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={tempFilters.assignedTo || ''}
                  label="Assigned To"
                  onChange={(e) => {
                    setTempFilters({
                      ...tempFilters, 
                      assignedTo: e.target.value
                    });
                  }}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 224,
                      },
                    },
                    // Fix for text zooming issue
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  <MenuItem value="">Any Assignee</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem 
                      key={user.id} 
                      value={user.name}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        typography: 'body1',
                      }}
                    >
                      <Box component="span" sx={{ mr: 2 }}>{user.name}</Box>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        sx={{ ml: 'auto' }}
                        color={
                          user.role === 'Admin' ? 'error' :
                          user.role === 'Manager' ? 'primary' :
                          user.role === 'Auditor' ? 'secondary' :
                          user.role === 'Reviewer' ? 'success' :
                          user.role === 'Moderator' ? 'warning' : 'default'
                        }
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Due Date From Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Due Date From"
                type="date"
                value={tempFilters.dueDate?.from || ''}
                onChange={(e) => {
                  setTempFilters({
                    ...tempFilters, 
                    dueDate: {
                      ...tempFilters.dueDate,
                      from: e.target.value
                    }
                  });
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Due Date To Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Due Date To"
                type="date"
                value={tempFilters.dueDate?.to || ''}
                onChange={(e) => {
                  setTempFilters({
                    ...tempFilters, 
                    dueDate: {
                      ...tempFilters.dueDate,
                      to: e.target.value
                    }
                  });
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Search Filter */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Search in Title and Description"
                variant="outlined"
                value={tempFilters.search || ''}
                onChange={(e) => {
                  setTempFilters({
                    ...tempFilters, 
                    search: e.target.value
                  });
                }}
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  ),
                }}
              />
            </Grid>
            
            {/* Sort By */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={tempFilters.sort?.field || 'dueDate'}
                  label="Sort By"
                  onChange={(e) => {
                    setTempFilters({
                      ...tempFilters, 
                      sort: {
                        field: e.target.value as 'title' | 'dueDate' | 'priority' | 'status' | 'assignedTo',
                        direction: tempFilters.sort?.direction || 'asc'
                      }
                    });
                  }}
                >
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="dueDate">Due Date</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="assignedTo">Assigned To</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Sort Direction */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Direction</InputLabel>
                <Select
                  value={tempFilters.sort?.direction || 'asc'}
                  label="Sort Direction"
                  onChange={(e) => {
                    setTempFilters({
                      ...tempFilters, 
                      sort: {
                        field: tempFilters.sort?.field || 'dueDate',
                        direction: e.target.value as 'asc' | 'desc'
                      }
                    });
                  }}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={resetAllFilters} 
            color="inherit"
          >
            Reset All
          </Button>
          <Button onClick={toggleAdvancedFilter}>Cancel</Button>
          <Button 
            onClick={applyAdvancedFilters} 
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({...prev, open: false}))}
        message={notification.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />

      {/* Task Dialog - Create/Edit */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={handleCloseTaskDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentTask?.id ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                label="Task Title"
                value={currentTask?.title || ''}
                onChange={(e) => currentTask && setCurrentTask({ 
                  ...currentTask, 
                  title: e.target.value 
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={currentTask?.description || ''}
                onChange={(e) => currentTask && setCurrentTask({ 
                  ...currentTask, 
                  description: e.target.value 
                })}
                margin="normal"
                multiline
                rows={3}
              />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={currentTask?.status || TASK_STATUS.NOT_STARTED}
                      onChange={(e) => currentTask && setCurrentTask({ 
                        ...currentTask, 
                        status: e.target.value as string
                      })}
                      label="Status"
                    >
                      <MenuItem value={TASK_STATUS.NOT_STARTED}>Not Started</MenuItem>
                      <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                      <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
                      {auditPhases.map((phase) => (
                        <MenuItem 
                          key={phase} 
                          value={phase.toLowerCase().replace(/\s+/g, '_')}
                        >
                          {phase}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={currentTask?.priority || TASK_PRIORITY.MEDIUM}
                      onChange={(e) => currentTask && setCurrentTask({ 
                        ...currentTask, 
                        priority: e.target.value as string
                      })}
                      label="Priority"
                    >
                      <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                      <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                      <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Assignee</InputLabel>
                    <Select
                      value={currentTask?.assignedTo || ''}
                      onChange={(e) => currentTask && setCurrentTask({ 
                        ...currentTask, 
                        assignedTo: e.target.value as string
                      })}
                      label="Assignee"
                      displayEmpty
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 224,
                          },
                        },
                        // Fix for text zooming issue
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                      }}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {userOptions.map((user) => (
                        <MenuItem 
                          key={user.id} 
                          value={user.name}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            typography: 'body1', // Ensure consistent typography
                          }}
                        >
                          <Box component="span" sx={{ mr: 2 }}>{user.name}</Box>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            sx={{ ml: 'auto' }}
                            color={
                              user.role === 'Admin' ? 'error' :
                              user.role === 'Manager' ? 'primary' :
                              user.role === 'Auditor' ? 'secondary' :
                              user.role === 'Reviewer' ? 'success' :
                              user.role === 'Moderator' ? 'warning' : 'default'
                            }
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={currentTask?.dueDate || ''}
                    onChange={(e) => currentTask && setCurrentTask({ 
                      ...currentTask, 
                      dueDate: e.target.value 
                    })}
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTask}
            disabled={loading || !currentTask?.title}
          >
            {currentTask?.id ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditWorkflow; 