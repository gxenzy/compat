import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
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
  FormHelperText,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VisibilityOff as InactiveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';
import complianceService from '../../../../../services/complianceService';
import { API_BASE_URL, apiClient } from '../../../../../utils/apiConfig';

interface ComplianceRule {
  id: number;
  section_id: number;
  rule_code: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  type: 'prescriptive' | 'performance' | 'mandatory';
  verification_method: string | null;
  evaluation_criteria: string | null;
  failure_impact: string | null;
  remediation_advice: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
  section_number: string;
  section_title: string;
  standard_code: string;
}

interface StandardSection {
  id: number;
  section_number: string;
  title: string;
  standard_id: number;
  standard_code?: string;
}

interface Filter {
  search: string;
  section_id: string;
  severity: string;
  type: string;
  active: boolean;
}

const ComplianceRules: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [sections, setSections] = useState<StandardSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'add' | 'edit'>('add');
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    section_id: '',
    rule_code: '',
    title: '',
    description: '',
    severity: 'major',
    type: 'mandatory',
    verification_method: '',
    evaluation_criteria: '',
    failure_impact: '',
    remediation_advice: '',
    active: true
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    section_id: false,
    rule_code: false,
    title: false,
    description: false
  });
  
  // Filters
  const [filters, setFilters] = useState<Filter>({
    search: '',
    section_id: '',
    severity: '',
    type: '',
    active: true
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchRules();
    fetchSections();
  }, []);
  
  const fetchRules = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      const params: any = {};
      
      if (filters.section_id) {
        params.section_id = filters.section_id;
      }
      
      if (filters.severity) {
        params.severity = filters.severity;
      }
      
      if (filters.type) {
        params.type = filters.type;
      }
      
      params.active = filters.active.toString();
      
      const data = await complianceService.getRules(params);
      setRules(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching compliance rules:', err);
      setError('Failed to load compliance rules');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSections = async () => {
    try {
      try {
        const response = await apiClient.get(`/standards-api/standards`);
        setSections(response.data);
      } catch (apiError) {
        console.warn('API fetch failed, using mock sections data:', apiError);
        // Use mock data as fallback
        setSections([
          {
            id: 101,
            section_number: "1.3",
            title: "General Requirements",
            standard_id: 1,
            standard_code: "PEC-2017"
          },
          {
            id: 202,
            section_number: "2.0",
            title: "Lighting Systems",
            standard_id: 2,
            standard_code: "PEEP"
          },
          {
            id: 301,
            section_number: "3.2",
            title: "Electrical Safety",
            standard_id: 3,
            standard_code: "NFPA-70"
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenAddDialog = () => {
    // Reset form
    setFormData({
      section_id: '',
      rule_code: '',
      title: '',
      description: '',
      severity: 'major',
      type: 'mandatory',
      verification_method: '',
      evaluation_criteria: '',
      failure_impact: '',
      remediation_advice: '',
      active: true
    });
    setFormErrors({
      section_id: false,
      rule_code: false,
      title: false,
      description: false
    });
    setDialogAction('add');
    setOpenRuleDialog(true);
  };
  
  const handleOpenEditDialog = (rule: ComplianceRule) => {
    setSelectedRule(rule);
    setFormData({
      section_id: rule.section_id.toString(),
      rule_code: rule.rule_code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      type: rule.type,
      verification_method: rule.verification_method || '',
      evaluation_criteria: rule.evaluation_criteria || '',
      failure_impact: rule.failure_impact || '',
      remediation_advice: rule.remediation_advice || '',
      active: rule.active
    });
    setDialogAction('edit');
    setOpenRuleDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenRuleDialog(false);
    setSelectedRule(null);
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
  
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error if field is filled
    if (name === 'section_id' && formErrors.section_id && value !== '') {
      setFormErrors(prev => ({
        ...prev,
        section_id: false
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {
      section_id: formData.section_id === '',
      rule_code: formData.rule_code.trim() === '',
      title: formData.title.trim() === '',
      description: formData.description.trim() === ''
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
      if (dialogAction === 'add') {
        await apiClient.post(`/compliance/rules`, formData);
      } else {
        await apiClient.put(`/compliance/rules/${selectedRule?.id}`, formData);
      }
      
      handleCloseDialog();
      fetchRules();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save compliance rule');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRule = (rule: ComplianceRule) => {
    setSelectedRule(rule);
    setConfirmDeleteOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedRule) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/compliance/rules/${selectedRule.id}`);
      fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete compliance rule');
    } finally {
      setLoading(false);
      setConfirmDeleteOpen(false);
      setSelectedRule(null);
    }
  };
  
  const handleFilterChange = (name: keyof Filter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = () => {
    fetchRules();
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      section_id: '',
      severity: '',
      type: '',
      active: true
    });
  };
  
  // Client-side search filter
  const filteredRules = rules.filter(rule => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      rule.rule_code.toLowerCase().includes(searchLower) ||
      rule.title.toLowerCase().includes(searchLower) ||
      rule.description.toLowerCase().includes(searchLower) ||
      rule.section_number.toLowerCase().includes(searchLower) ||
      rule.section_title.toLowerCase().includes(searchLower) ||
      rule.standard_code.toLowerCase().includes(searchLower)
    );
  });
  
  // Pagination
  const paginatedRules = filteredRules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
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
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Compliance Rules</Typography>
        
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
            startIcon={<AddIcon />} 
            onClick={handleOpenAddDialog}
          >
            New Rule
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                name="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  value={filters.section_id}
                  label="Section"
                  name="section_id"
                  onChange={(e) => handleFilterChange('section_id', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Sections</em>
                  </MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.section_number} - {section.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  label="Severity"
                  name="severity"
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Severities</em>
                  </MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                  <MenuItem value="minor">Minor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  name="type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  <MenuItem value="mandatory">Mandatory</MenuItem>
                  <MenuItem value="prescriptive">Prescriptive</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={12} lg={2}>
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
      
      {loading && rules.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule Code</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No compliance rules found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.rule_code}</TableCell>
                      <TableCell>{rule.title}</TableCell>
                      <TableCell>
                        <Tooltip title={rule.section_title}>
                          <span>{rule.section_number}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)} 
                          color={getSeverityColor(rule.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={rule.type.charAt(0).toUpperCase() + rule.type.slice(1)} 
                          color={getTypeColor(rule.type) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rule.active ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEditDialog(rule)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteRule(rule)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRules.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      
      {/* Add/Edit Rule Dialog */}
      <Dialog
        open={openRuleDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogAction === 'add' ? 'Add New Compliance Rule' : 'Edit Compliance Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={formErrors.section_id}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section_id}
                  label="Section"
                  name="section_id"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">
                    <em>Select a Section</em>
                  </MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.section_number} - {section.title}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.section_id && (
                  <FormHelperText>Section is required</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Code"
                name="rule_code"
                value={formData.rule_code}
                onChange={handleInputChange}
                error={formErrors.rule_code}
                helperText={formErrors.rule_code ? 'Rule code is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={formErrors.title}
                helperText={formErrors.title ? 'Title is required' : ''}
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
                error={formErrors.description}
                helperText={formErrors.description ? 'Description is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  name="severity"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                  <MenuItem value="minor">Minor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  name="type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="mandatory">Mandatory</MenuItem>
                  <MenuItem value="prescriptive">Prescriptive</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Verification Method"
                name="verification_method"
                value={formData.verification_method}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Evaluation Criteria"
                name="evaluation_criteria"
                value={formData.evaluation_criteria}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Failure Impact"
                name="failure_impact"
                value={formData.failure_impact}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remediation Advice"
                name="remediation_advice"
                value={formData.remediation_advice}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
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
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Delete Compliance Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the rule "{selectedRule?.rule_code}: {selectedRule?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove the rule from the system. If the rule is used in any checklists, it will be marked as inactive instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete}
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceRules; 