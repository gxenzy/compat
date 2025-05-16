import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Pagination,
  TextField as MuiTextField,
  InputAdornment,
  Tooltip,
  Checkbox,
  Menu,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Add as AddIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import * as userService from '../../services/userService';
import { useAuthContext } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Helper function to convert string role to UserRole enum
const stringToUserRole = (role: string): UserRole => {
  const roleMap: Record<string, UserRole> = {
    'admin': UserRole.ADMIN,
    'manager': UserRole.MANAGER,
    'auditor': UserRole.AUDITOR,
    'reviewer': UserRole.REVIEWER,
    'viewer': UserRole.VIEWER,
    'staff': UserRole.STAFF,
    'moderator': UserRole.MODERATOR,
    'user': UserRole.USER
  };
  
  return roleMap[role.toLowerCase()] || UserRole.VIEWER;
};

// Create a custom type for user creation that includes password
interface UserCreateData extends Partial<User> {
  password: string;
}

// Add this function to validate student ID
const validateStudentId = (id: string): boolean => {
  if (!id) return true; // Empty is allowed
  return /^\d{8}$/.test(id); // Must be exactly 8 digits
};

const UserList: React.FC = () => {
  const history = useHistory();
  const { hasRole } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    password: '',
    student_id: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Bulk actions state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkActionAnchor, setBulkActionAnchor] = useState<null | HTMLElement>(null);
  const [confirmBulkDialog, setConfirmBulkDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    message: string;
  }>({
    open: false,
    action: '',
    title: '',
    message: ''
  });
  const [bulkRoleDialog, setBulkRoleDialog] = useState({
    open: false,
    role: 'viewer'
  });

  // Roles for select dropdown
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'staff', label: 'Staff' },
    { value: 'moderator', label: 'Moderator' }
  ];

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(lowercaseQuery) ||
            user.email.toLowerCase().includes(lowercaseQuery) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(lowercaseQuery) ||
            user.role.toLowerCase().includes(lowercaseQuery) ||
            (user.student_id && user.student_id.includes(searchQuery))
        )
      );
    }
    setPage(1); // Reset to first page when search changes
  }, [searchQuery, users]);

  // Get paginated users
  const getPaginatedUsers = () => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, end);
  };

  // Load all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      try {
        // First try the standard endpoint
        data = await userService.getAllUsers();
      } catch (err: any) {
        console.log('First attempt to fetch users failed, trying alternative endpoint...');
        
        // If that fails with 404, try a direct API call with the alternative URL pattern
        if (err.status === 404) {
          const response = await axios.get('/api/users');
          data = response.data;
        } else {
          // If it's not a 404, rethrow the error
          throw err;
        }
      }
      
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening dialog for create/edit
  const handleOpenDialog = (user: User | null = null) => {
    if (user) {
      // Edit mode
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toLowerCase(),
        password: '', // Don't include password when editing
        student_id: user.student_id || '',
      });
    } else {
      // Create mode
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
        password: '',
        student_id: '',
      });
    }
    setOpenDialog(true);
  };
  
  // Handle closing the edit dialog
  const handleCloseEditDialog = () => {
    setOpenDialog(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select input changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate student ID if provided
      if (formData.student_id && !validateStudentId(formData.student_id)) {
        setSnackbar({
          open: true,
          message: 'Student ID must be an 8-digit number',
          severity: 'error'
        });
        return;
      }

      if (selectedUser) {
        // Update existing user
        const updateData: Partial<User> = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: stringToUserRole(formData.role),
          student_id: formData.student_id
        };
        
        // Handle password separately since it's not part of the User type
        if (formData.password) {
          await userService.resetPassword(selectedUser.id, formData.password);
        }
        
        const result = await userService.updateUser(selectedUser.id, updateData);
        
        // Extract user from result (new response format)
        const updatedUser = result.user;
        
        // If an emergency update was used, show an indicator
        if (result.emergencyUsed) {
          toast('Used emergency direct database update', {
            icon: '⚠️',
            position: 'top-right',
            duration: 5000
          });
        }
        
        // Update the user in the list
        setUsers(users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ));
        
        // Show success message
        toast.success('User updated successfully', {
          position: 'top-right',
          duration: 3000
        });
        
        // Close the dialog
        handleCloseEditDialog();
      } else {
        // Create new user
        const newUserData: UserCreateData = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: stringToUserRole(formData.role),
          password: formData.password,
          student_id: formData.student_id
        };
        
        await userService.createUser(newUserData as any); // Use type assertion as a workaround
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      }
      
      // Close dialog and refresh user list
      setOpenDialog(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to save user',
        severity: 'error'
      });
    }
  };

  // Handle user deletion
  const handleDelete = async (userId: string | number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
        fetchUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.message || err.message || 'Failed to delete user',
          severity: 'error'
        });
      }
    }
  };

  // Handle toggling user status
  const handleToggleStatus = async (userId: string | number) => {
    try {
      await userService.toggleUserStatus(userId);
      setSnackbar({
        open: true,
        message: 'User status toggled successfully',
        severity: 'success'
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to toggle user status',
        severity: 'error'
      });
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId: string | number) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    
    if (newPassword && newPassword.length >= 6) {
      try {
        await userService.resetPassword(userId, newPassword);
        setSnackbar({
          open: true,
          message: 'Password reset successfully',
          severity: 'success'
        });
      } catch (err: any) {
        console.error('Error resetting password:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.message || err.message || 'Failed to reset password',
          severity: 'error'
        });
      }
    } else if (newPassword) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 6 characters',
        severity: 'error'
      });
    }
  };

  // Handle bulk selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all users on current page
  const handleSelectAllUsers = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const currentPageUserIds = getPaginatedUsers().map(user => user.id);
      setSelectedUserIds(prev => {
        const newSelection = [...prev];
        currentPageUserIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      const currentPageUserIds = getPaginatedUsers().map(user => user.id);
      setSelectedUserIds(prev => prev.filter(id => !currentPageUserIds.includes(id)));
    }
  };

  // Open bulk actions menu
  const handleOpenBulkActions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setBulkActionAnchor(event.currentTarget);
  };

  // Close bulk actions menu
  const handleCloseBulkActions = () => {
    setBulkActionAnchor(null);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    handleCloseBulkActions();

    switch (action) {
      case 'activate':
        setConfirmBulkDialog({
          open: true,
          action: 'activate',
          title: 'Activate Users',
          message: `Are you sure you want to activate ${selectedUserIds.length} users?`
        });
        break;
      case 'deactivate':
        setConfirmBulkDialog({
          open: true,
          action: 'deactivate',
          title: 'Deactivate Users',
          message: `Are you sure you want to deactivate ${selectedUserIds.length} users?`
        });
        break;
      case 'delete':
        setConfirmBulkDialog({
          open: true,
          action: 'delete',
          title: 'Delete Users',
          message: `Are you sure you want to delete ${selectedUserIds.length} users? This action cannot be undone.`
        });
        break;
      case 'changeRole':
        setBulkRoleDialog({
          open: true,
          role: 'viewer'
        });
        break;
      default:
        break;
    }
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    try {
      setLoading(true);
      const { action } = confirmBulkDialog;

      if (action === 'delete') {
        // Sequential deletion to ensure proper error handling
        for (const userId of selectedUserIds) {
          await userService.deleteUser(userId);
        }
        setSnackbar({
          open: true,
          message: `${selectedUserIds.length} users deleted successfully`,
          severity: 'success'
        });
      } else if (action === 'activate' || action === 'deactivate') {
        // Use bulk update API
        await userService.bulkUpdateUsers(
          selectedUserIds,
          { isActive: action === 'activate' }
        );
        setSnackbar({
          open: true,
          message: `${selectedUserIds.length} users ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
      }

      // Clear selection and refresh
      setSelectedUserIds([]);
      setConfirmBulkDialog({ ...confirmBulkDialog, open: false });
      fetchUsers();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || `Failed to execute bulk action`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute bulk role change
  const executeBulkRoleChange = async () => {
    try {
      setLoading(true);
      await userService.bulkUpdateUsers(
        selectedUserIds,
        { role: stringToUserRole(bulkRoleDialog.role) }
      );
      setSnackbar({
        open: true,
        message: `Role updated for ${selectedUserIds.length} users`,
        severity: 'success'
      });
      setSelectedUserIds([]);
      setBulkRoleDialog({ ...bulkRoleDialog, open: false });
      fetchUsers();
    } catch (error: any) {
      console.error('Bulk role change error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Failed to update roles',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get status chip
  const getStatusChip = (isActive: boolean) => {
    return isActive ? 
      <Chip label="Active" color="success" size="small" /> : 
      <Chip label="Inactive" color="error" size="small" />;
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // View user activity log
  const handleViewActivity = (userId: string) => {
    history.push(`/user-management/activity/${userId}`);
  };

  if (!hasRole(UserRole.ADMIN)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access Denied: Only administrators can access user management.
        </Typography>
      </Box>
    );
  }

  const areAllCurrentPageSelected = getPaginatedUsers().length > 0 && 
    getPaginatedUsers().every(user => selectedUserIds.includes(user.id));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">User Management</Typography>
        <Stack direction="row" spacing={2}>
          {selectedUserIds.length > 0 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenBulkActions}
              startIcon={<MoreVertIcon />}
            >
              Bulk Actions ({selectedUserIds.length})
            </Button>
          ) : null}
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add User
          </Button>
        </Stack>
      </Box>
      
      {/* Search bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name, email, username, student ID, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedUserIds.length > 0 && !areAllCurrentPageSelected}
                      checked={areAllCurrentPageSelected}
                      onChange={handleSelectAllUsers}
                    />
                  </TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPaginatedUsers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {searchQuery ? 'No matching users found' : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedUsers().map((user) => (
                    <TableRow key={user.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.student_id || '-'}</TableCell>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{getStatusChip(user.isActive)}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit User">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => handleOpenDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isActive ? "Deactivate User" : "Activate User"}>
                            <IconButton 
                              size="small" 
                              color={user.isActive ? "error" : "success"} 
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              {user.isActive ? <BlockIcon /> : <CheckIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Activity Log">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleViewActivity(user.id)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(user.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {filteredUsers.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredUsers.length / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* User Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={!!selectedUser}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Student ID"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              fullWidth
              helperText="8-digit unique student identifier"
              inputProps={{ maxLength: 8 }}
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleSelectChange}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={selectedUser ? "New Password (leave blank to keep current)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              required={!selectedUser}
              helperText="Password must be at least 6 characters"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionAnchor}
        open={Boolean(bulkActionAnchor)}
        onClose={handleCloseBulkActions}
      >
        <MenuItem onClick={() => handleBulkAction('activate')}>
          Activate Users
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('deactivate')}>
          Deactivate Users
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('changeRole')}>
          Change Role
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
          Delete Users
        </MenuItem>
      </Menu>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={confirmBulkDialog.open}
        onClose={() => setConfirmBulkDialog({ ...confirmBulkDialog, open: false })}
      >
        <DialogTitle>{confirmBulkDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmBulkDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkDialog({ ...confirmBulkDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color={confirmBulkDialog.action === 'delete' ? 'error' : 'primary'}
            onClick={executeBulkAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Role Change Dialog */}
      <Dialog
        open={bulkRoleDialog.open}
        onClose={() => setBulkRoleDialog({ ...bulkRoleDialog, open: false })}
      >
        <DialogTitle>Change Role for {selectedUserIds.length} Users</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>New Role</InputLabel>
              <Select
                value={bulkRoleDialog.role}
                label="New Role"
                onChange={(e) => setBulkRoleDialog({ ...bulkRoleDialog, role: e.target.value as string })}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRoleDialog({ ...bulkRoleDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={executeBulkRoleChange}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserList; 