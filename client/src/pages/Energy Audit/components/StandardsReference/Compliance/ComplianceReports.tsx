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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  TextField,
  useTheme
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import axios from 'axios';

// Types
interface CheckStatusCounts {
  pending: number;
  passed: number;
  failed: number;
  not_applicable: number;
  [key: string]: number;
}

interface ComplianceReport {
  id: number;
  name: string;
  description: string | null;
  checklist_id: number;
  checklist_name: string;
  status: 'draft' | 'final';
  created_at: string;
  created_by: number;
  creator_name: string;
  counts?: CheckStatusCounts;
  total_rules?: number;
  compliance_percentage?: number;
}

interface ReportFilter {
  status: string;
  date_range: string;
}

const ComplianceReports: React.FC = () => {
  const theme = useTheme();
  
  // This is a placeholder implementation, in a real app this would fetch from an API
  
  // State
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Filter state
  const [filters, setFilters] = useState<ReportFilter>({
    status: 'all',
    date_range: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Generate some dummy data for the UI
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const dummyReports: ComplianceReport[] = [
        {
          id: 1,
          name: 'Quarterly Electrical Compliance Report',
          description: 'Comprehensive evaluation of electrical systems compliance with PEC standards',
          checklist_id: 1,
          checklist_name: 'Electrical Systems - PEC 2017',
          status: 'final',
          created_at: '2023-09-15T10:30:00Z',
          created_by: 1,
          creator_name: 'John Doe',
          counts: {
            pending: 0,
            passed: 42,
            failed: 3,
            not_applicable: 5
          },
          total_rules: 50,
          compliance_percentage: 93.3
        },
        {
          id: 2,
          name: 'Emergency Lighting Compliance',
          description: 'Verification of emergency lighting systems against safety regulations',
          checklist_id: 2,
          checklist_name: 'Emergency Systems - NFPA 101',
          status: 'draft',
          created_at: '2023-10-02T14:15:00Z',
          created_by: 2,
          creator_name: 'Jane Smith',
          counts: {
            pending: 8,
            passed: 12,
            failed: 5,
            not_applicable: 0
          },
          total_rules: 25,
          compliance_percentage: 70.6
        },
        {
          id: 3,
          name: 'Annual Comprehensive Audit',
          description: 'Full compliance audit for all building electrical systems',
          checklist_id: 3,
          checklist_name: 'Full Building Audit - 2023',
          status: 'final',
          created_at: '2023-07-20T09:00:00Z',
          created_by: 1,
          creator_name: 'John Doe',
          counts: {
            pending: 0,
            passed: 78,
            failed: 7,
            not_applicable: 15
          },
          total_rules: 100,
          compliance_percentage: 91.8
        }
      ];
      
      setReports(dummyReports);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as keyof ReportFilter;
    const value = e.target.value as string;
    
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const applyFilters = () => {
    // In a real app, this would trigger API call with filters
    console.log('Applying filters:', filters);
    // For now, just simulate fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  
  const resetFilters = () => {
    setFilters({
      status: 'all',
      date_range: 'all'
    });
  };
  
  const handleGeneratePdf = (reportId: number) => {
    // In a real app, this would trigger PDF generation
    console.log('Generating PDF for report:', reportId);
  };
  
  const handlePrintReport = (reportId: number) => {
    // In a real app, this would open print dialog
    console.log('Printing report:', reportId);
  };
  
  const handleShareReport = (reportId: number) => {
    // In a real app, this would open sharing options
    console.log('Sharing report:', reportId);
  };
  
  const handleViewReport = (reportId: number) => {
    // In a real app, this would history.push to report details
    console.log('Viewing report details:', reportId);
  };
  
  // Pagination
  const paginatedReports = reports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'final':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const getComplianceColor = (percentage: number | undefined) => {
    if (!percentage) return theme.palette.grey[400];
    
    if (percentage >= 90) return theme.palette.success.main;
    if (percentage >= 75) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Compliance Reports</Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />} 
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<PdfIcon />} 
            onClick={() => console.log('Generate new report')}
          >
            Generate Report
          </Button>
        </Box>
      </Box>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  name="date_range"
                  value={filters.date_range}
                  label="Date Range"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent="flex-end" height="100%" alignItems="center">
                <Button 
                  variant="outlined" 
                  onClick={resetFilters} 
                  sx={{ mr: 1 }}
                >
                  Reset
                </Button>
                <Button 
                  variant="contained" 
                  onClick={applyFilters}
                >
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {reports.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No reports found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Generate your first compliance report by completing a checklist.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />} 
                sx={{ mt: 2 }}
              >
                Generate Report
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedReports.map((report) => (
                  <Grid item xs={12} key={report.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6" component="div">
                              {report.name}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Based on: {report.checklist_name}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {report.description}
                            </Typography>
                          </Box>
                          
                          <Box textAlign="right">
                            <Chip 
                              label={report.status.charAt(0).toUpperCase() + report.status.slice(1)} 
                              color={getStatusColor(report.status) as any}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            
                            <Typography variant="body2" color="text.secondary">
                              Created: {new Date(report.created_at).toLocaleDateString()}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary">
                              By: {report.creator_name}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ mr: 2 }}>
                                Compliance Score:
                              </Typography>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 24,
                                  backgroundColor: theme.palette.grey[200],
                                  borderRadius: 1,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    width: `${report.compliance_percentage}%`,
                                    backgroundColor: getComplianceColor(report.compliance_percentage),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="body2" color="white" fontWeight="bold">
                                    {report.compliance_percentage}%
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box display="flex" justifyContent="space-between">
                              <Box textAlign="center">
                                <Chip 
                                  label={report.counts?.passed || 0} 
                                  color="success" 
                                  sx={{ minWidth: 60 }}
                                />
                                <Typography variant="caption" display="block" mt={0.5}>
                                  Passed
                                </Typography>
                              </Box>
                              
                              <Box textAlign="center">
                                <Chip 
                                  label={report.counts?.failed || 0} 
                                  color="error" 
                                  sx={{ minWidth: 60 }}
                                />
                                <Typography variant="caption" display="block" mt={0.5}>
                                  Failed
                                </Typography>
                              </Box>
                              
                              <Box textAlign="center">
                                <Chip 
                                  label={report.counts?.not_applicable || 0} 
                                  color="default" 
                                  sx={{ minWidth: 60 }}
                                />
                                <Typography variant="caption" display="block" mt={0.5}>
                                  N/A
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box>
                          <Button
                            size="small"
                            startIcon={<PdfIcon />}
                            onClick={() => handleGeneratePdf(report.id)}
                          >
                            PDF
                          </Button>
                          <Button
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() => handlePrintReport(report.id)}
                          >
                            Print
                          </Button>
                          <Button
                            size="small"
                            startIcon={<ShareIcon />}
                            onClick={() => handleShareReport(report.id)}
                          >
                            Share
                          </Button>
                        </Box>
                        
                        <Button
                          size="small"
                          endIcon={<ChevronRightIcon />}
                          onClick={() => handleViewReport(report.id)}
                          color="primary"
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={reports.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default ComplianceReports; 