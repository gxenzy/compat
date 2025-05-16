import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useHistory, useParams } from 'react-router-dom';
import { Report } from '../../types/reports';

interface UserShare {
  id: number;
  userId: number;
  username: string;
  email: string;
  permission: 'view' | 'edit' | 'admin';
  shared_at: string;
}

/**
 * Component for sharing reports with other users
 */
const ReportShare: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Share form state
  const [userEmail, setUserEmail] = useState<string>('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view');
  
  // Users with access to this report
  const [sharedUsers, setSharedUsers] = useState<UserShare[]>([]);
  
  useEffect(() => {
    if (id) {
      fetchReport(parseInt(id));
      fetchSharedUsers(parseInt(id));
    }
  }, [id]);
  
  const fetchReport = async (reportId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API request for now
      setTimeout(() => {
        // Mock report data
        const mockReport: Report = {
          id: reportId,
          title: 'Energy Audit Report - Building A',
          description: 'Comprehensive energy audit for Building A',
          type: 'energy_audit',
          created_by: 1,
          is_template: false,
          is_public: false,
          status: 'draft',
          version: 1.0,
          created_at: '2023-07-01T10:30:00Z',
          updated_at: '2023-07-01T10:30:00Z',
          public_link: null,
          shares: []
        };
        
        setReport(mockReport);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setError('Failed to load report');
      console.error('Error fetching report:', err);
      setLoading(false);
    }
  };
  
  const fetchSharedUsers = async (reportId: number) => {
    try {
      // Simulate API request for now
      setTimeout(() => {
        // Mock shared users data
        const mockSharedUsers: UserShare[] = [
          {
            id: 1,
            userId: 2,
            username: 'Jane Smith',
            email: 'jane.smith@example.com',
            permission: 'view',
            shared_at: '2023-07-05T14:30:00Z'
          },
          {
            id: 2,
            userId: 3,
            username: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            permission: 'edit',
            shared_at: '2023-07-06T09:15:00Z'
          }
        ];
        
        setSharedUsers(mockSharedUsers);
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching shared users:', err);
      // Don't set main error as this is a secondary feature
    }
  };
  
  const handleShareReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      setError('Email address is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Simulate API request for now
      setTimeout(() => {
        // Create mock shared user
        const newShare: UserShare = {
          id: Math.floor(Math.random() * 1000),
          userId: Math.floor(Math.random() * 1000),
          username: userEmail.split('@')[0],
          email: userEmail,
          permission: permission,
          shared_at: new Date().toISOString()
        };
        
        // Update UI
        setSharedUsers([...sharedUsers, newShare]);
        setSuccess(`Report successfully shared with ${userEmail}`);
        
        // Reset form
        setUserEmail('');
        setPermission('view');
        
        setSaving(false);
      }, 800);
      
    } catch (err) {
      setError('Failed to share report');
      console.error('Error sharing report:', err);
      setSaving(false);
    }
  };
  
  const handleRemoveShare = async (shareId: number) => {
    if (window.confirm('Are you sure you want to remove this user\'s access to the report?')) {
      try {
        // Simulate API request for now
        setTimeout(() => {
          // Update UI
          setSharedUsers(sharedUsers.filter(share => share.id !== shareId));
          setSuccess('User access has been removed');
        }, 500);
        
      } catch (err) {
        setError('Failed to remove user access');
        console.error('Error removing share:', err);
      }
    }
  };
  
  const handleBackToReport = () => {
    history.push(`/reports/view/${id}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!report) {
    return (
      <Alert severity="warning">Report not found.</Alert>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackToReport} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="h1">
              Share Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {report.title}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Share form */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <form onSubmit={handleShareReport}>
          <Typography variant="h6" gutterBottom>
            Share with a User
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <TextField
              label="Email Address"
              variant="outlined"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              fullWidth
              placeholder="Enter user email address"
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="permission-label">Permission</InputLabel>
              <Select
                labelId="permission-label"
                value={permission}
                label="Permission"
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'admin')}
              >
                <MenuItem value="view">View Only</MenuItem>
                <MenuItem value="edit">Can Edit</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
              disabled={saving || !userEmail.trim()}
              sx={{ mt: { xs: 2, md: 0 }, minWidth: 100 }}
            >
              Share
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* Shared users list */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Users with Access
        </Typography>
        
        {sharedUsers.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Permission</TableCell>
                  <TableCell>Shared On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sharedUsers.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>{share.username}</TableCell>
                    <TableCell>{share.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          share.permission === 'admin' ? 'Admin' :
                          share.permission === 'edit' ? 'Can Edit' :
                          'View Only'
                        }
                        color={
                          share.permission === 'admin' ? 'secondary' :
                          share.permission === 'edit' ? 'primary' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(share.shared_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              This report hasn't been shared with anyone yet.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ReportShare;