import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Pagination,
  TextField,
  InputAdornment,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import * as userService from '../../services/userService';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import axios from 'axios';

interface UserActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

const UserActivityLog: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();
  const { hasRole } = useAuthContext();
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // List of possible actions for filtering
  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'CREATE_USER', label: 'Create User' },
    { value: 'UPDATE_USER', label: 'Update User' },
    { value: 'DELETE_USER', label: 'Delete User' },
    { value: 'ACTIVATE_USER', label: 'Activate User' },
    { value: 'DEACTIVATE_USER', label: 'Deactivate User' },
    { value: 'RESET_PASSWORD', label: 'Reset Password' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'FAILED_LOGIN', label: 'Failed Login' }
  ];

  // Get activity color based on action
  const getActionColor = (action: string) => {
    const actionColorMap: Record<string, string> = {
      'CREATE_USER': 'success',
      'UPDATE_USER': 'info',
      'DELETE_USER': 'error',
      'ACTIVATE_USER': 'success',
      'DEACTIVATE_USER': 'warning',
      'RESET_PASSWORD': 'warning',
      'LOGIN': 'info',
      'LOGOUT': 'default',
      'FAILED_LOGIN': 'error'
    };
    
    return actionColorMap[action] || 'default';
  };

  // Load user and activity logs
  useEffect(() => {
    if (!userId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user details - try multiple endpoint patterns if needed
        let userData;
        try {
          // First try the standard endpoint
          userData = await userService.getUserById(userId);
        } catch (err: any) {
          console.log('First attempt to fetch user failed, trying alternative endpoint...');
          // If that fails with 404, try a direct API call with the alternative URL pattern
          if (err.status === 404) {
            const response = await axios.get(`/api/users/${userId}`);
            userData = response.data;
          } else {
            // If it's not a 404, rethrow the error
            throw err;
          }
        }
        
        setUser(userData);
        
        // Get audit logs - try multiple endpoint patterns if needed
        let logsData;
        try {
          logsData = await userService.getUserAuditLogs(userId);
        } catch (err: any) {
          console.log('First attempt to fetch logs failed, trying alternative endpoint...');
          // If that fails with 404, try a direct API call with the alternative URL pattern
          if (err.status === 404) {
            const response = await axios.get(`/api/users/${userId}/audit-logs`);
            logsData = response.data;
          } else {
            // If it's not a 404, rethrow the error
            throw err;
          }
        }
        
        setLogs(logsData);
        setFilteredLogs(logsData);
      } catch (err: any) {
        console.error('Error fetching activity logs:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  // Filter logs based on search, action, and date range
  useEffect(() => {
    let filtered = [...logs];
    
    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filtered = filtered.filter(log => new Date(log.timestamp) < nextDay);
    }
    
    // Filter by search text
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(lowercaseQuery) ||
        log.details.toLowerCase().includes(lowercaseQuery) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    setFilteredLogs(filtered);
    setPage(1); // Reset to first page when filters change
  }, [logs, searchQuery, actionFilter, startDate, endDate]);

  // Get paginated logs
  const getPaginatedLogs = () => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredLogs.slice(start, end);
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setStartDate(null);
    setEndDate(null);
  };

  // Format JSON details for display
  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join(', ');
    } catch (e) {
      return details;
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
    } catch (e) {
      return timestamp;
    }
  };

  if (!hasRole(UserRole.ADMIN)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access Denied: Only administrators can access user activity logs.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs and Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link 
              color="inherit" 
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => history.push('/user-management')}
            >
              User Management
            </Link>
            <Typography color="text.primary">Activity Log</Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ mt: 1 }}>
            User Activity Log
            {user && <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
              - {user.firstName} {user.lastName} ({user.email})
            </Typography>}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => history.push('/user-management')}
        >
          Back to Users
        </Button>
      </Box>

      {/* User Summary Card */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1">{user.username}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{user.firstName} {user.lastName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Typography variant="body1">{user.role}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={user.isActive ? 'Active' : 'Inactive'} 
                  color={user.isActive ? 'success' : 'error'} 
                  size="small" 
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionFilter}
              label="Action Type"
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {actionTypes.map((action) => (
                <MenuItem key={action.value} value={action.value}>
                  {action.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setStartDate(date);
              }}
              sx={{ width: 200 }}
            />
            
            <TextField
              label="End Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setEndDate(date);
              }}
              sx={{ width: 200 }}
            />
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleResetFilters}
          >
            Clear Filters
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'} found
            </Typography>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPaginatedLogs().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedLogs().map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action.replace(/_/g, ' ')} 
                          color={getActionColor(log.action) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.details} placement="top">
                          <Typography variant="body2" sx={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formatDetails(log.details)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {filteredLogs.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredLogs.length / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default UserActivityLog; 