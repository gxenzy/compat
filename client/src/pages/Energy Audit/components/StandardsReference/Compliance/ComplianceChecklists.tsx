import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  OutlinedInput,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  useTheme,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { API_BASE_URL, apiClient } from '../../../../../utils/apiConfig';

// Types
interface ComplianceRule {
  id: number;
  section_id: number;
  rule_code: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  type: 'prescriptive' | 'performance' | 'mandatory';
}

interface CheckStatusCounts {
  pending: number;
  passed: number;
  failed: number;
  not_applicable: number;
  [key: string]: number;
}

interface ComplianceChecklist {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  creator_name: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string | null;
  counts?: CheckStatusCounts;
  total_rules?: number;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ComplianceChecklists: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();
  
  // State
  const [checklists, setChecklists] = useState<ComplianceChecklist[]>([]);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Dialog states
  const [openChecklistDialog, setOpenChecklistDialog] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ComplianceChecklist | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_ids: [] as number[]
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    name: false,
    rule_ids: false
  });
  
  useEffect(() => {
    fetchChecklists();
    fetchRules();
  }, []);
  
  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/compliance/checklists`);
      setChecklists(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching compliance checklists:', err);
      setError('Failed to load compliance checklists');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRules = async () => {
    try {
      const response = await apiClient.get(`/compliance/rules`, {
        params: { active: true }
      });
      setRules(response.data);
    } catch (err) {
      console.error('Error fetching compliance rules:', err);
    }
  };
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenAddDialog = () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      rule_ids: []
    });
    setFormErrors({
      name: false,
      rule_ids: false
    });
    setOpenChecklistDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenChecklistDialog(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error if field is filled
    if (formErrors[name as keyof typeof formErrors] && value.trim() !== '') {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };
  
  const handleRulesChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedRules = event.target.value as number[];
    setFormData(prev => ({
      ...prev,
      rule_ids: selectedRules
    }));
    
    // Clear validation error if at least one rule is selected
    if (formErrors.rule_ids && selectedRules.length > 0) {
      setFormErrors(prev => ({
        ...prev,
        rule_ids: false
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {
      name: formData.name.trim() === '',
      rule_ids: formData.rule_ids.length === 0
    };
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(Boolean);
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post(`/compliance/checklists`, formData);
      handleCloseDialog();
      fetchChecklists();
    } catch (err) {
      console.error('Error saving checklist:', err);
      setError('Failed to save compliance checklist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteChecklist = (checklist: ComplianceChecklist) => {
    setSelectedChecklist(checklist);
    setConfirmDeleteOpen(true);
  };
  
  const handleViewChecklist = (checklistId: number) => {
    history.push(`/energy-audit/standards-reference/compliance/checklist/${checklistId}`);
  };
  
  const handleUpdateStatus = async (checklist: ComplianceChecklist, newStatus: 'draft' | 'active' | 'archived') => {
    try {
      await apiClient.put(`/compliance/checklists/${checklist.id}/status`, { status: newStatus });
      fetchChecklists();
    } catch (err) {
      console.error('Error updating checklist status:', err);
      setError('Failed to update checklist status');
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedChecklist) return;
    
    // In a real implementation, you would have an API endpoint to delete checklists
    // For now, we'll just refresh the list
    setConfirmDeleteOpen(false);
    setSelectedChecklist(null);
    // Simulate deletion by refetching
    fetchChecklists();
  };
  
  // Pagination
  const paginatedChecklists = checklists.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'active':
        return 'success';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getProgressColor = (checklist: ComplianceChecklist) => {
    if (!checklist.counts) return theme.palette.grey[400];
    
    const { passed, failed, pending } = checklist.counts;
    const total = checklist.total_rules || 0;
    
    if (pending === total) return theme.palette.warning.main;
    if (failed > 0) return theme.palette.error.main;
    if (passed === total) return theme.palette.success.main;
    
    return theme.palette.primary.main;
  };
  
  const renderProgress = (checklist: ComplianceChecklist) => {
    if (!checklist.counts || !checklist.total_rules) return null;
    
    const { passed, failed, pending, not_applicable } = checklist.counts;
    const total = checklist.total_rules;
    const completed = total - pending;
    const completionPercent = Math.round((completed / total) * 100);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <Box
            sx={{
              height: 8,
              borderRadius: 5,
              backgroundColor: theme.palette.grey[300],
              position: 'relative'
            }}
          >
            {/* Passed */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                height: '100%',
                borderRadius: 5,
                width: `${(passed / total) * 100}%`,
                backgroundColor: theme.palette.success.main
              }}
            />
            {/* Failed */}
            <Box
              sx={{
                position: 'absolute',
                left: `${(passed / total) * 100}%`,
                height: '100%',
                borderRadius: 5,
                width: `${(failed / total) * 100}%`,
                backgroundColor: theme.palette.error.main
              }}
            />
            {/* Not Applicable */}
            <Box
              sx={{
                position: 'absolute',
                left: `${((passed + failed) / total) * 100}%`,
                height: '100%',
                borderRadius: 5,
                width: `${(not_applicable / total) * 100}%`,
                backgroundColor: theme.palette.grey[500]
              }}
            />
          </Box>
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${completionPercent}%`}</Typography>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Compliance Checklists</Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAddDialog}
        >
          New Checklist
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && checklists.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {paginatedChecklists.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No checklists found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create your first compliance checklist to start tracking compliance.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={handleOpenAddDialog}
                sx={{ mt: 2 }}
              >
                Create Checklist
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedChecklists.map((checklist) => (
                  <Grid item xs={12} md={6} lg={4} key={checklist.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" component="div" noWrap>
                            {checklist.name}
                          </Typography>
                          <Chip 
                            label={checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1)} 
                            color={getStatusColor(checklist.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {checklist.description || 'No description'}
                        </Typography>
                        
                        {renderProgress(checklist)}
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Tooltip title="Pending">
                              <Chip 
                                label={checklist.counts?.pending || 0} 
                                size="small"
                                color="warning" 
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            </Tooltip>
                            <Tooltip title="Passed">
                              <Chip 
                                label={checklist.counts?.passed || 0} 
                                size="small"
                                color="success" 
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            </Tooltip>
                            <Tooltip title="Failed">
                              <Chip 
                                label={checklist.counts?.failed || 0} 
                                size="small"
                                color="error" 
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            </Tooltip>
                            <Tooltip title="Not Applicable">
                              <Chip 
                                label={checklist.counts?.not_applicable || 0} 
                                size="small"
                                color="default" 
                                variant="outlined"
                              />
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(checklist.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewChecklist(checklist.id)}
                        >
                          View
                        </Button>
                        
                        {checklist.status === 'draft' && (
                          <Button 
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleUpdateStatus(checklist, 'active')}
                            color="success"
                          >
                            Activate
                          </Button>
                        )}
                        {checklist.status === 'active' && (
                          <Button 
                            size="small"
                            startIcon={<ArchiveIcon />}
                            onClick={() => handleUpdateStatus(checklist, 'archived')}
                            color="warning"
                          >
                            Archive
                          </Button>
                        )}
                        {checklist.status === 'archived' && (
                          <Button 
                            size="small"
                            startIcon={<ArrowForwardIcon />}
                            onClick={() => handleUpdateStatus(checklist, 'active')}
                            color="primary"
                          >
                            Restore
                          </Button>
                        )}
                        
                        <Button 
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteChecklist(checklist)}
                          color="error"
                          sx={{ ml: 'auto' }}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={checklists.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </>
      )}
      
      {/* Add Checklist Dialog */}
      <Dialog
        open={openChecklistDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Compliance Checklist</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Checklist Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={formErrors.name}
                helperText={formErrors.name ? 'Checklist name is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={formErrors.rule_ids}>
                <InputLabel id="rules-select-label">Rules</InputLabel>
                <Select
                  labelId="rules-select-label"
                  multiple
                  value={formData.rule_ids}
                  onChange={handleRulesChange as any}
                  input={<OutlinedInput label="Rules" />}
                  renderValue={(selected) => `${selected.length} rules selected`}
                  MenuProps={MenuProps}
                >
                  {rules.map((rule) => (
                    <MenuItem key={rule.id} value={rule.id}>
                      <Checkbox checked={formData.rule_ids.indexOf(rule.id) > -1} />
                      <ListItemText 
                        primary={`${rule.rule_code}: ${rule.title}`} 
                        secondary={`${rule.severity} - ${rule.type}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.rule_ids && (
                  <FormControl error>
                    <FormHelperText>At least one rule must be selected</FormHelperText>
                  </FormControl>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Checklist'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Delete Compliance Checklist</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the checklist "{selectedChecklist?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove the checklist and all its check results.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceChecklists; 