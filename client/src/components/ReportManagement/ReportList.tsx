import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  FileCopy as CopyIcon,
  Description as TemplateIcon
} from '@mui/icons-material';
import { Report, ReportType, ReportStatus } from '../../types/reports';
import reportService from '../../services/reportService';
import { useHistory } from 'react-router-dom';
import { useApiRequest } from '../../hooks/useApiRequest';

// Report type labels and colors
const reportTypeLabels: Record<ReportType, string> = {
  'energy_audit': 'Energy Audit',
  'lighting': 'Lighting',
  'hvac': 'HVAC',
  'equipment': 'Equipment',
  'power_factor': 'Power Factor',
  'harmonic': 'Harmonic',
  'schedule_of_loads': 'Schedule of Loads',
  'custom': 'Custom'
};

const reportTypeColors: Record<ReportType, string> = {
  'energy_audit': 'primary',
  'lighting': 'secondary',
  'hvac': 'info',
  'equipment': 'success',
  'power_factor': 'warning',
  'harmonic': 'error',
  'schedule_of_loads': 'default',
  'custom': 'default'
};

// Report status labels and colors
const reportStatusLabels: Record<ReportStatus, string> = {
  'draft': 'Draft',
  'published': 'Published',
  'archived': 'Archived'
};

const reportStatusColors: Record<ReportStatus, string> = {
  'draft': 'warning',
  'published': 'success',
  'archived': 'default'
};

/**
 * ReportList component props
 */
interface ReportListProps {
  onEditReport?: (report: Report) => void;
  onViewReport?: (report: Report) => void;
  onCreateReport?: () => void;
  reportsType?: 'owned' | 'shared' | 'templates' | 'all';
  showActions?: boolean;
  showFilters?: boolean;
  maxItems?: number;
}

/**
 * ReportList component for displaying a list of reports
 */
const ReportList: React.FC<ReportListProps> = ({
  onEditReport,
  onViewReport,
  onCreateReport,
  reportsType = 'owned',
  showActions = true,
  showFilters = true,
  maxItems
}) => {
  const theme = useTheme();
  const history = useHistory();
  
  // State
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(maxItems || 10);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { sendRequest } = useApiRequest();
  
  // Load reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let url = '/api/reports';
        
        if (reportsType === 'shared') {
          url = '/api/reports/shared/list';
        } else if (reportsType === 'templates') {
          url = '/api/reports?is_template=true';
        } else if (reportsType === 'all') {
          url = '/api/reports';
        }
        
        const response = await sendRequest(url, 'GET');
        
        if (response.success) {
          setReports(response.data as Report[] || []);
          setFilteredReports(response.data as Report[] || []);
        } else {
          setError(response.message || 'Failed to load reports');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReports();
  }, [reportsType, sendRequest]);
  
  // Filter reports when filters change
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...reports];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(report => 
          report.title.toLowerCase().includes(query) || 
          (report.description && report.description.toLowerCase().includes(query))
        );
      }
      
      // Apply type filter
      if (typeFilter) {
        filtered = filtered.filter(report => report.type === typeFilter);
      }
      
      // Apply status filter
      if (statusFilter) {
        filtered = filtered.filter(report => report.status === statusFilter);
      }
      
      setFilteredReports(filtered);
      setPage(0); // Reset to first page when filters change
    };
    
    applyFilters();
  }, [reports, searchQuery, typeFilter, statusFilter]);
  
  // Handle pagination change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle report deletion
  const handleDeleteReport = async (reportId: number) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await sendRequest(`/api/reports/${reportId}`, 'DELETE');
        
        if (response.success) {
          // Remove from state
          const updatedReports = reports.filter(report => report.id !== reportId);
          setReports(updatedReports);
          
          // Also update filtered reports
          setFilteredReports(prev => prev.filter(report => report.id !== reportId));
        } else {
          setError(response.message || 'Failed to delete report');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete report');
        console.error('Error deleting report:', err);
      }
    }
  };
  
  // Handle report duplication
  const handleDuplicateReport = async (report: Report) => {
    try {
      // Create a new report based on the existing one
      const newReport = await reportService.createReport({
        title: `Copy of ${report.title}`,
        description: report.description,
        type: report.type,
        contents: report.contents,
        metadata: report.metadata
      });
      
      // Add the new report to the list
      setReports(prev => [newReport, ...prev]);
      
      // Navigate to edit the new report
      if (onEditReport) {
        onEditReport(newReport);
      } else {
        history.push(`/reports/edit/${newReport.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate report');
      console.error('Error duplicating report:', err);
    }
  };
  
  // Handle report sharing
  const handleShareReport = (report: Report) => {
    // Navigate to share page or open share dialog
    history.push(`/reports/share/${report.id}`);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Filters */}
      {showFilters && (
        <Box sx={{ mb: 3 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Search Reports"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="type-filter-label">Report Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Report Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(reportStatusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Reports table */}
      <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[2], borderRadius: 1 }}>
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Date</TableCell>
              {showActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  {showActions && (
                    <TableCell align="right">
                      <Skeleton variant="rectangular" width={120} height={36} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {report.title}
                      </Typography>
                      {report.is_template && (
                        <Chip 
                          size="small" 
                          label="Template" 
                          color="secondary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                    </Box>
                    {report.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          display: 'block', 
                          mt: 0.5, 
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          maxWidth: 300
                        }}
                      >
                        {report.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reportTypeLabels[report.type as ReportType] || report.type} 
                      color={reportTypeColors[report.type as ReportType] as any || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reportStatusLabels[report.status as ReportStatus] || report.status} 
                      color={reportStatusColors[report.status as ReportStatus] as any || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(report as any).creator_name || `User ID: ${report.created_by}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(report.created_at)}
                    </Typography>
                  </TableCell>
                  {showActions && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Report">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onViewReport ? onViewReport(report) : history.push(`/reports/view/${report.id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Only show edit if user has permission */}
                        {(!(report as any).permission || (report as any).permission === 'edit' || (report as any).permission === 'admin') && (
                          <Tooltip title="Edit Report">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEditReport ? onEditReport(report) : history.push(`/reports/edit/${report.id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Only show delete for owned reports */}
                        {reportsType === 'owned' && (
                          <Tooltip title="Delete Report">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Only show share for owned reports */}
                        {reportsType === 'owned' && (
                          <Tooltip title="Share Report">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleShareReport(report)}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActions ? 6 : 5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No reports found.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateReport || (() => history.push('/reports/create'))}
                    sx={{ mt: 2 }}
                  >
                    Create New Report
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportList; 