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
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  useTheme,
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  RemoveCircle as RemoveCircleIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PhotoCamera as PhotoCameraIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';

// Types
interface CheckStatusCounts {
  pending: number;
  passed: number;
  failed: number;
  not_applicable: number;
  [key: string]: number;
}

interface ComplianceCheck {
  id: number;
  checklist_id: number;
  rule_id: number;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  notes: string | null;
  evidence: string | null;
  checked_by: number | null;
  checked_by_name: string | null;
  checked_at: string | null;
  created_at: string;
  updated_at: string | null;
  rule_code: string;
  rule_title: string;
  rule_description: string;
  severity: 'critical' | 'major' | 'minor';
  type: 'prescriptive' | 'performance' | 'mandatory';
  verification_method: string | null;
  evaluation_criteria: string | null;
  failure_impact: string | null;
  remediation_advice: string | null;
  section_number: string;
  section_title: string;
  standard_code: string;
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
}

interface CheckDetailState {
  id: number;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  notes: string;
  evidence: string;
}

interface CheckFilterState {
  status: string;
  severity: string;
  type: string;
  searchTerm: string;
}

const ChecklistDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  
  // State
  const [checklist, setChecklist] = useState<ComplianceChecklist | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [filteredChecks, setFilteredChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [counts, setCounts] = useState<CheckStatusCounts>({
    pending: 0,
    passed: 0,
    failed: 0,
    not_applicable: 0
  });
  
  // Current check being edited
  const [currentCheck, setCurrentCheck] = useState<CheckDetailState | null>(null);
  const [checkDetailOpen, setCheckDetailOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<CheckFilterState>({
    status: 'all',
    severity: 'all',
    type: 'all',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Update status confirmation
  const [statusUpdateConfirm, setStatusUpdateConfirm] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchChecklistDetails(parseInt(id));
    }
  }, [id]);
  
  useEffect(() => {
    applyFilters();
  }, [checks, filters]);
  
  const fetchChecklistDetails = async (checklistId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/compliance/checklists/${checklistId}`);
      setChecklist(response.data.checklist);
      setChecks(response.data.checks);
      setCounts(response.data.counts);
      setError(null);
    } catch (err) {
      console.error('Error fetching checklist details:', err);
      setError('Failed to load checklist details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenCheckDetail = (check: ComplianceCheck) => {
    setCurrentCheck({
      id: check.id,
      status: check.status,
      notes: check.notes || '',
      evidence: check.evidence || ''
    });
    setCheckDetailOpen(true);
  };
  
  const handleCloseCheckDetail = () => {
    setCheckDetailOpen(false);
    setCurrentCheck(null);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const target = e.target;
    const name = target.name as keyof CheckFilterState;
    const value = target.value as string;
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = () => {
    let filtered = [...checks];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(check => check.status === filters.status);
    }
    
    // Apply severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(check => check.severity === filters.severity);
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(check => check.type === filters.type);
    }
    
    // Apply search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(check => 
        check.rule_code.toLowerCase().includes(searchLower) ||
        check.rule_title.toLowerCase().includes(searchLower) ||
        check.rule_description.toLowerCase().includes(searchLower) ||
        check.section_number.toLowerCase().includes(searchLower) ||
        check.section_title.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredChecks(filtered);
  };
  
  const resetFilters = () => {
    setFilters({
      status: 'all',
      severity: 'all',
      type: 'all',
      searchTerm: ''
    });
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentCheck) return;
    
    setCurrentCheck({
      ...currentCheck,
      status: e.target.value as 'pending' | 'passed' | 'failed' | 'not_applicable'
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentCheck) return;
    
    const { name, value } = e.target;
    setCurrentCheck({
      ...currentCheck,
      [name]: value
    });
  };
  
  const handleSaveCheck = async () => {
    if (!currentCheck || !checklist) return;
    
    setLoading(true);
    try {
      await axios.put(`/api/compliance/checklists/${checklist.id}/checks/${currentCheck.id}`, {
        status: currentCheck.status,
        notes: currentCheck.notes,
        evidence: currentCheck.evidence
      });
      
      // Update local state
      setChecks(prevChecks => 
        prevChecks.map(check => 
          check.id === currentCheck.id 
            ? { 
                ...check, 
                status: currentCheck.status,
                notes: currentCheck.notes,
                evidence: currentCheck.evidence
              } 
            : check
        )
      );
      
      // Update counts
      const newCounts = { ...counts };
      const checkToUpdate = checks.find(c => c.id === currentCheck.id);
      
      if (checkToUpdate) {
        // Decrement old status count
        newCounts[checkToUpdate.status]--;
        // Increment new status count
        newCounts[currentCheck.status]++;
        setCounts(newCounts);
      }
      
      handleCloseCheckDetail();
      
      // Check if all checks are complete, and if so, show confirmation to activate checklist
      if (newCounts.pending === 0 && checklist.status === 'draft') {
        setStatusUpdateConfirm(true);
      }
    } catch (err) {
      console.error('Error updating check:', err);
      setError('Failed to update check');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateChecklistStatus = async () => {
    if (!checklist) return;
    
    setLoading(true);
    try {
      await axios.put(`/api/compliance/checklists/${checklist.id}/status`, {
        status: 'active'
      });
      
      // Update local state
      setChecklist({
        ...checklist,
        status: 'active'
      });
      
      setStatusUpdateConfirm(false);
    } catch (err) {
      console.error('Error updating checklist status:', err);
      setError('Failed to update checklist status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToChecklists = () => {
    history.push('/energy-audit/standards-reference/compliance'); // Adjust this path as needed
  };
  
  // Pagination
  const paginatedChecks = filteredChecks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'major':
        return <WarningIcon color="warning" />;
      case 'minor':
        return <InfoIcon color="info" />;
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <CloseIcon color="error" />;
      case 'not_applicable':
        return <RemoveCircleIcon color="disabled" />;
      default:
        return <CancelIcon color="warning" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'not_applicable':
        return 'default';
      default:
        return 'warning';
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'major':
        return 'warning';
      case 'minor':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mandatory':
        return 'primary';
      case 'prescriptive':
        return 'secondary';
      case 'performance':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const checklistProgress = checklist ? 
    Math.round(((counts.passed + counts.failed + counts.not_applicable) / 
    (counts.pending + counts.passed + counts.failed + counts.not_applicable)) * 100) : 0;
  
  if (loading && !checklist) {
    return (
      <Box p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !checklist) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToChecklists}
          sx={{ mt: 2 }}
        >
          Back to Checklists
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              underline="hover"
              color="inherit"
              onClick={handleBackToChecklists}
              sx={{ cursor: 'pointer' }}
            >
              Checklists
            </Link>
            <Typography color="text.primary">{checklist?.name}</Typography>
          </Breadcrumbs>
          
          <Typography variant="h5" gutterBottom>
            {checklist?.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {checklist?.description || 'No description'}
          </Typography>
        </Box>
        
        <Box textAlign="right">
          <Chip 
            label={checklist?.status ? checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1) : 'Unknown'} 
            color={
              checklist?.status === 'draft' ? 'warning' : 
              checklist?.status === 'active' ? 'success' : 'default'
            }
            sx={{ mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Created: {checklist ? new Date(checklist.created_at).toLocaleDateString() : ''}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            By: {checklist?.creator_name}
          </Typography>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Progress: {checklistProgress}% Complete
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={checklistProgress} 
          sx={{ height: 10, borderRadius: 5, mb: 2 }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color={theme.palette.warning.main}>
                {counts.pending}
              </Typography>
              <Typography variant="body2">Pending</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color={theme.palette.success.main}>
                {counts.passed}
              </Typography>
              <Typography variant="body2">Passed</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color={theme.palette.error.main}>
                {counts.failed}
              </Typography>
              <Typography variant="body2">Failed</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color={theme.palette.grey[500]}>
                {counts.not_applicable}
              </Typography>
              <Typography variant="body2">N/A</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Compliance Checks</Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleBackToChecklists}
            startIcon={<ArrowBackIcon />}
          >
            Back to Checklists
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="passed">Passed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="not_applicable">Not Applicable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  name="severity"
                  value={filters.severity}
                  label="Severity"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                  <MenuItem value="minor">Minor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={filters.type}
                  label="Type"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="mandatory">Mandatory</MenuItem>
                  <MenuItem value="prescriptive">Prescriptive</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                sx={{ mr: 1 }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {loading && filteredChecks.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Rule Code</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No compliance checks found matching the filter criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getSeverityIcon(check.severity)}
                            <Typography sx={{ ml: 1 }}>
                              {check.rule_code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={check.rule_description}>
                            <Typography>{check.rule_title}</Typography>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary">
                            {check.section_number} - {check.section_title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={check.severity.charAt(0).toUpperCase() + check.severity.slice(1)} 
                            color={getSeverityColor(check.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={check.type.charAt(0).toUpperCase() + check.type.slice(1)} 
                            color={getTypeColor(check.type) as any}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(check.status)}
                            <Chip 
                              label={check.status.replace('_', ' ').charAt(0).toUpperCase() + check.status.replace('_', ' ').slice(1)} 
                              color={getStatusColor(check.status) as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleOpenCheckDetail(check)}
                            variant="outlined"
                          >
                            {check.status === 'pending' ? 'Verify' : 'Update'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredChecks.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}
      
      {/* Check Detail Dialog */}
      <Dialog
        open={checkDetailOpen}
        onClose={handleCloseCheckDetail}
        maxWidth="md"
        fullWidth
      >
        {currentCheck && (
          <>
            <DialogTitle>
              Verify Compliance Check
            </DialogTitle>
            <DialogContent>
              {/* Rule information */}
              {checks.find(c => c.id === currentCheck.id) && (
                <Box mb={3}>
                  <Card variant="outlined">
                    <CardHeader
                      title={checks.find(c => c.id === currentCheck.id)?.rule_title}
                      subheader={`${checks.find(c => c.id === currentCheck.id)?.rule_code} - ${checks.find(c => c.id === currentCheck.id)?.section_number}`}
                    />
                    <CardContent>
                      <Typography variant="body2" gutterBottom>
                        {checks.find(c => c.id === currentCheck.id)?.rule_description}
                      </Typography>
                      
                      <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Verification Method:</Typography>
                          <Typography variant="body2">
                            {checks.find(c => c.id === currentCheck.id)?.verification_method || 'Not specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Evaluation Criteria:</Typography>
                          <Typography variant="body2">
                            {checks.find(c => c.id === currentCheck.id)?.evaluation_criteria || 'Not specified'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Compliance Status</FormLabel>
                    <RadioGroup 
                      row 
                      name="status" 
                      value={currentCheck.status} 
                      onChange={handleStatusChange}
                    >
                      <FormControlLabel 
                        value="passed" 
                        control={<Radio color="success" />} 
                        label="Passed" 
                      />
                      <FormControlLabel 
                        value="failed" 
                        control={<Radio color="error" />} 
                        label="Failed" 
                      />
                      <FormControlLabel 
                        value="pending" 
                        control={<Radio color="warning" />} 
                        label="Pending" 
                      />
                      <FormControlLabel 
                        value="not_applicable" 
                        control={<Radio />} 
                        label="Not Applicable" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={currentCheck.notes}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    placeholder="Enter verification notes, observations, or other relevant information"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Evidence"
                    name="evidence"
                    value={currentCheck.evidence}
                    onChange={handleInputChange}
                    placeholder="Add URLs to photos, documents, or other evidence"
                    InputProps={{
                      endAdornment: (
                        <Box>
                          <Tooltip title="Attach File">
                            <IconButton>
                              <AttachFileIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Take Photo">
                            <IconButton>
                              <PhotoCameraIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ),
                    }}
                  />
                  <FormHelperText>
                    Add links to evidence or use the attachment buttons (functionality to be implemented)
                  </FormHelperText>
                </Grid>
                
                {currentCheck.status === 'failed' && checks.find(c => c.id === currentCheck.id)?.remediation_advice && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2">Remediation Advice:</Typography>
                      <Typography variant="body2">
                        {checks.find(c => c.id === currentCheck.id)?.remediation_advice}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                
                {currentCheck.status === 'failed' && checks.find(c => c.id === currentCheck.id)?.failure_impact && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2">Failure Impact:</Typography>
                      <Typography variant="body2">
                        {checks.find(c => c.id === currentCheck.id)?.failure_impact}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCheckDetail}>Cancel</Button>
              <Button 
                onClick={handleSaveCheck}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Checklist Status Update Confirmation */}
      <Dialog
        open={statusUpdateConfirm}
        onClose={() => setStatusUpdateConfirm(false)}
      >
        <DialogTitle>Activate Checklist</DialogTitle>
        <DialogContent>
          <Typography>
            All checks are now complete. Would you like to activate this checklist?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Activating the checklist will mark it as ready for reporting and will make it read-only.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateConfirm(false)}>
            Keep as Draft
          </Button>
          <Button 
            onClick={handleUpdateChecklistStatus}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Activate Checklist'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistDetail; 