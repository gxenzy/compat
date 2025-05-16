import React, { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Table, TableBody, Paper, Alert, Button, Box, Typography, TableContainer, TextField, Checkbox, Snackbar, IconButton, TableRow, TableCell, Stack, Tooltip, Menu, MenuItem, Chip, CircularProgress, Divider, TableHead, TablePagination } from '@mui/material';
import { AuditRow, AuditTableProps } from './types';
import AuditTableHeader from './AuditTableHeader';
import AuditTableRow from './AuditTableRow';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import * as XLSX from 'xlsx';
import { useUserRole } from '../../contexts/UserRoleContext';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import useEnergyAuditRealTime, { User } from '../../../../hooks/useEnergyAuditRealTime';

interface AuditTableContainerProps extends AuditTableProps {
  errorMessage?: string;
  onExport?: () => void;
  onImport?: (data: AuditRow[]) => void;
  onDuplicateRow?: (row: AuditRow) => void;
  onArchiveRow?: (row: AuditRow) => void;
  onQuickComment?: (row: AuditRow, comment: string) => void;
  rows?: AuditRow[];
  onRowChange?: (row: AuditRow) => void;
  onAddRow?: (row: AuditRow) => void;
  onDeleteRow?: (row: AuditRow) => void;
}

// Utility: Convert AuditRow[] to CSV string
const auditRowsToCSV = (rows: AuditRow[]): string => {
  const header = ['id', 'category', 'conditions', 'referenceStandards', 'completed', 'riskIndex_PO', 'riskIndex_SO', 'riskIndex_ARI', 'riskIndex_value', 'comments'];
  const data = rows.map(row => ({
    id: row.id,
    category: row.category,
    conditions: row.conditions.join('; '),
    referenceStandards: row.referenceStandards.join('; '),
    completed: row.completed ? 'TRUE' : 'FALSE',
    riskIndex_PO: row.riskIndex.PO,
    riskIndex_SO: row.riskIndex.SO,
    riskIndex_ARI: row.riskIndex.ARI,
    riskIndex_value: row.riskIndex.value,
    comments: row.comments || '',
  }));
  return Papa.unparse({ fields: header, data: data.map(row => header.map(h => (row as Record<string, any>)[h])) });
};

// Utility: Convert CSV string to AuditRow[]
const csvToAuditRows = (csv: string): AuditRow[] => {
  const result = Papa.parse(csv, { header: true });
  if (!result.data || !Array.isArray(result.data)) return [];
  return (result.data as any[]).map((row, idx) => ({
    id: row.id || String(idx + 1),
    category: row.category || '',
    conditions: (row.conditions || '').split(';').map((s: string) => s.trim()).filter(Boolean),
    referenceStandards: (row.referenceStandards || '').split(';').map((s: string) => s.trim()).filter(Boolean),
    completed: row.completed === 'TRUE',
    riskIndex: {
      PO: Number(row.riskIndex_PO) || 0,
      SO: row.riskIndex_SO || '',
      ARI: row.riskIndex_ARI || '',
      value: Number(row.riskIndex_value) || 0,
    },
    comments: row.comments || '',
  }));
};

const handleExport = (rows: AuditRow[]) => {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  saveAs(blob, 'audit-table-export.json');
};

const handleImport = (e: React.ChangeEvent<HTMLInputElement>, onImport?: (data: AuditRow[]) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      if (onImport) onImport(data);
    } catch (err) {
      alert('Invalid file format.');
    }
  };
  reader.readAsText(file);
};

const handleExportCSV = (rows: AuditRow[]) => {
  const csv = auditRowsToCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  saveAs(blob, 'audit-table-export.csv');
};

const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, onImport?: (data: AuditRow[]) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const rows = csvToAuditRows(event.target?.result as string);
      if (onImport) onImport(rows);
    } catch (err) {
      alert('Invalid CSV file format.');
    }
  };
  reader.readAsText(file);
};

// Utility: Convert AuditRow[] to worksheet and download as XLSX
const handleExportXLSX = (rows: AuditRow[]) => {
  const ws = XLSX.utils.json_to_sheet(rows.map(row => ({
    id: row.id,
    category: row.category,
    conditions: row.conditions.join('; '),
    referenceStandards: row.referenceStandards.join('; '),
    completed: row.completed ? 'TRUE' : 'FALSE',
    riskIndex_PO: row.riskIndex.PO,
    riskIndex_SO: row.riskIndex.SO,
    riskIndex_ARI: row.riskIndex.ARI,
    riskIndex_value: row.riskIndex.value,
    comments: row.comments || '',
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AuditTable');
  XLSX.writeFile(wb, 'audit-table-export.xlsx');
};

const handleImportXLSX = (e: React.ChangeEvent<HTMLInputElement>, onImport?: (data: AuditRow[]) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      // Convert to AuditRow[]
      const rows = (json as any[]).map((row, idx) => ({
        id: row.id || String(idx + 1),
        category: row.category || '',
        conditions: (row.conditions || '').split(';').map((s: string) => s.trim()).filter(Boolean),
        referenceStandards: (row.referenceStandards || '').split(';').map((s: string) => s.trim()).filter(Boolean),
        completed: row.completed === 'TRUE',
        riskIndex: {
          PO: Number(row.riskIndex_PO) || 0,
          SO: row.riskIndex_SO || '',
          ARI: row.riskIndex_ARI || '',
          value: Number(row.riskIndex_value) || 0,
        },
        comments: row.comments || '',
      }));
      if (onImport) onImport(rows);
    } catch (err) {
      alert('Invalid XLSX file format.');
    }
  };
  reader.readAsArrayBuffer(file);
};

// Define type for audit entry
interface AuditEntry {
  id: string;
  name: string;
  buildingName: string;
  address: string;
  date: string;
  status: 'draft' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  type: 'lighting' | 'hvac' | 'equipment' | 'comprehensive' | 'specialized';
  assignedTo: string;
  lastModified: string;
  issues: number;
  warnings: number;
  score?: number;
  notes?: string;
  progress?: number;
  client?: string;
}

// Mock data for development
const MOCK_AUDITS: AuditEntry[] = [
  {
    id: 'audit-001',
    name: 'Main Office Lighting Audit',
    buildingName: 'Corporate HQ',
    address: '123 Business Ave, New York, NY',
    date: '2023-08-15',
    status: 'in-progress',
    type: 'lighting',
    assignedTo: 'John Doe',
    lastModified: '2023-08-20T14:30:00',
    issues: 5,
    warnings: 12,
    score: 72,
    progress: 65,
    client: 'Acme Corp'
  },
  {
    id: 'audit-002',
    name: 'Manufacturing Plant HVAC Assessment',
    buildingName: 'Plant Building B',
    address: '456 Industrial Pkwy, Chicago, IL',
    date: '2023-07-22',
    status: 'completed',
    type: 'hvac',
    assignedTo: 'Sarah Johnson',
    lastModified: '2023-08-15T09:45:00',
    issues: 2,
    warnings: 7,
    score: 86,
    progress: 100,
    client: 'Manufacturing Plus Inc.'
  },
  {
    id: 'audit-003',
    name: 'Retail Store Energy Assessment',
    buildingName: 'Downtown Flagship Store',
    address: '789 Retail Row, San Francisco, CA',
    date: '2023-08-05',
    status: 'draft',
    type: 'comprehensive',
    assignedTo: 'Michael Chen',
    lastModified: '2023-08-10T16:20:00',
    issues: 0,
    warnings: 3,
    score: undefined,
    progress: 25,
    client: 'FashionRetail Co.'
  },
  {
    id: 'audit-004',
    name: 'Hospital Equipment Audit',
    buildingName: 'General Hospital East Wing',
    address: '321 Healthcare Blvd, Boston, MA',
    date: '2023-07-10',
    status: 'approved',
    type: 'equipment',
    assignedTo: 'Lisa Williams',
    lastModified: '2023-08-01T11:15:00',
    issues: 1,
    warnings: 5,
    score: 91,
    progress: 100,
    client: 'Boston Healthcare Systems'
  },
  {
    id: 'audit-005',
    name: 'School District HVAC Compliance',
    buildingName: 'Washington High School',
    address: '555 Education Dr, Seattle, WA',
    date: '2023-08-12',
    status: 'rejected',
    type: 'hvac',
    assignedTo: 'Robert Martinez',
    lastModified: '2023-08-18T15:40:00',
    issues: 12,
    warnings: 8,
    score: 45,
    progress: 90,
    client: 'Northwest School District'
  },
  {
    id: 'audit-006',
    name: 'Data Center Cooling Assessment',
    buildingName: 'Tech Park Data Center',
    address: '888 Server Lane, Austin, TX',
    date: '2023-07-28',
    status: 'in-progress',
    type: 'specialized',
    assignedTo: 'David Kim',
    lastModified: '2023-08-19T10:10:00',
    issues: 3,
    warnings: 9,
    score: 68,
    progress: 70,
    client: 'DataHost Technologies'
  },
  {
    id: 'audit-007',
    name: 'Hotel Lighting Efficiency Audit',
    buildingName: 'Grand Plaza Hotel',
    address: '999 Hospitality Way, Las Vegas, NV',
    date: '2023-08-08',
    status: 'completed',
    type: 'lighting',
    assignedTo: 'Jennifer Patel',
    lastModified: '2023-08-17T14:00:00',
    issues: 4,
    warnings: 11,
    score: 79,
    progress: 100,
    client: 'Luxury Stays Inc.'
  },
  {
    id: 'audit-008',
    name: 'Office Complex Full Assessment',
    buildingName: 'Parkview Office Towers',
    address: '444 Business Park, Atlanta, GA',
    date: '2023-07-15',
    status: 'in-progress',
    type: 'comprehensive',
    assignedTo: 'Thomas Wilson',
    lastModified: '2023-08-15T11:30:00',
    issues: 7,
    warnings: 14,
    score: 62,
    progress: 50,
    client: 'Business Group LLC'
  }
];

// Status options for filtering
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

// Type options for filtering
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'specialized', label: 'Specialized' }
];

// Status chip colors
const STATUS_COLORS: Record<string, { color: string; icon: React.ReactElement }> = {
  draft: { color: 'default', icon: <EditIcon fontSize="small" /> },
  'in-progress': { color: 'primary', icon: <LiveTvIcon fontSize="small" /> },
  completed: { color: 'success', icon: <LiveTvIcon fontSize="small" /> },
  approved: { color: 'success', icon: <LiveTvIcon fontSize="small" /> },
  rejected: { color: 'error', icon: <LiveTvIcon fontSize="small" /> }
};

const AuditTableContainer: React.FC<AuditTableContainerProps> = ({
  errorMessage,
  onExport,
  onImport,
  onDuplicateRow,
  onArchiveRow,
  onQuickComment,
  rows,
  onRowChange,
  onAddRow,
  onDeleteRow,
}) => {
  // Get user role for permissions
  const { role, permissions } = useUserRole();
  
  // State for audits and filtering
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Collaboration state
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const { isConnected, activeUsers } = useEnergyAuditRealTime(selectedAuditId || '');
  
  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<AuditEntry | null>(null);
  
  // Load audit data
  useEffect(() => {
    const fetchAudits = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set audits from mock data (would be API in real app)
      setAudits(MOCK_AUDITS);
      setFilteredAudits(MOCK_AUDITS);
      setLoading(false);
    };
    
    fetchAudits();
  }, []);
  
  // Handle filtering and searching
  useEffect(() => {
    const filtered = audits.filter(audit => {
      const matchesSearch = searchTerm === '' || 
        audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
      const matchesType = typeFilter === 'all' || audit.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    setFilteredAudits(filtered);
    setPage(0); // Reset to first page when filters change
  }, [searchTerm, statusFilter, typeFilter, audits]);
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, audit: AuditEntry) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(audit);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };
  
  // Handle view audit
  const handleViewAudit = (auditId: string) => {
    console.log(`Viewing audit: ${auditId}`);
    setSelectedAuditId(auditId);
    // In a real app, history.push to audit view page
    handleMenuClose();
  };
  
  // Handle edit audit
  const handleEditAudit = (auditId: string) => {
    console.log(`Editing audit: ${auditId}`);
    // In a real app, history.push to audit edit page
    handleMenuClose();
  };
  
  // Handle delete audit
  const handleDeleteAudit = (auditId: string) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      console.log(`Deleting audit: ${auditId}`);
      setAudits(prevAudits => prevAudits.filter(audit => audit.id !== auditId));
    }
    handleMenuClose();
  };
  
  // Handle export to Excel
  const handleExportToExcel = useCallback(() => {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(filteredAudits.map(audit => ({
      'Audit Name': audit.name,
      'Building': audit.buildingName,
      'Address': audit.address,
      'Date': audit.date,
      'Status': audit.status,
      'Type': audit.type,
      'Assigned To': audit.assignedTo,
      'Last Modified': new Date(audit.lastModified).toLocaleString(),
      'Issues': audit.issues,
      'Warnings': audit.warnings,
      'Score': audit.score || 'N/A',
      'Progress': `${audit.progress || 0}%`,
      'Client': audit.client || 'N/A'
    })));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audits');
    
    // Generate file
    XLSX.writeFile(workbook, 'energy_audits.xlsx');
  }, [filteredAudits]);
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Render row if virtualized list is used
  const renderRow = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const audit = filteredAudits[index + page * rowsPerPage];
      if (!audit) return null;
      
      const statusConfig = STATUS_COLORS[audit.status] || { color: 'default', icon: <LiveTvIcon fontSize="small" /> };
      
      return (
        <TableRow hover key={audit.id} style={style}>
          <TableCell>{audit.name}</TableCell>
          <TableCell>{audit.buildingName}</TableCell>
          <TableCell>{audit.date}</TableCell>
          <TableCell>
            <Chip 
              label={audit.status.charAt(0).toUpperCase() + audit.status.slice(1)} 
              color={statusConfig.color as any} 
              size="small" 
              icon={statusConfig.icon}
            />
          </TableCell>
          <TableCell>
            {audit.type.charAt(0).toUpperCase() + audit.type.slice(1)}
          </TableCell>
          <TableCell>{audit.assignedTo}</TableCell>
          <TableCell align="center">
            <Stack direction="row" spacing={1} alignItems="center">
              {audit.issues > 0 && (
                <Tooltip title={`${audit.issues} issues`}>
                  <Chip 
                    label={audit.issues} 
                    color="error" 
                    size="small" 
                    icon={<ErrorIcon fontSize="small" />}
                  />
                </Tooltip>
              )}
              {audit.warnings > 0 && (
                <Tooltip title={`${audit.warnings} warnings`}>
                  <Chip 
                    label={audit.warnings} 
                    color="warning" 
                    size="small" 
                    icon={<WarningIcon fontSize="small" />}
                  />
                </Tooltip>
              )}
            </Stack>
          </TableCell>
          <TableCell align="right">
            <IconButton 
              size="small" 
              onClick={(e) => handleMenuOpen(e, audit)}
              aria-label="more options"
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    },
    [filteredAudits, page, rowsPerPage]
  );
  
  // Current page slice for non-virtualized rendering
  const currentAudits = useMemo(() => {
    return filteredAudits.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredAudits, page, rowsPerPage]);
  
  return (
    <Box>
      {/* Header with title and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Energy Audits
        </Typography>
        
        <Stack direction="row" spacing={1}>
          {permissions.canExport && (
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={handleExportToExcel}
              disabled={filteredAudits.length === 0 || loading}
            >
              Export
            </Button>
          )}
          
          {permissions.canEdit && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              disabled={loading}
            >
              New Audit
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Filter toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="Search audits..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Type"
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        
        {/* Collaboration status indicator */}
        {selectedAuditId && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                icon={<LiveTvIcon />} 
                label={isConnected ? 'Connected' : 'Disconnected'} 
                color={isConnected ? 'success' : 'error'} 
                size="small" 
              />
              
              <Typography variant="body2" color="text.secondary">
                {activeUsers.length} active user(s)
              </Typography>
              
              <Stack direction="row" spacing={0.5}>
                {activeUsers.slice(0, 3).map(user => (
                  <Tooltip key={user.userId} title={user.userName}>
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: 'primary.main', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.userName.charAt(0).toUpperCase()}
                    </Box>
                  </Tooltip>
                ))}
                {activeUsers.length > 3 && (
                  <Tooltip title={`${activeUsers.length - 3} more users`}>
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: 'grey.500', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      +{activeUsers.length - 3}
                    </Box>
                  </Tooltip>
                )}
              </Stack>
              
              <Button 
                variant="outlined" 
                size="small" 
                color="inherit"
                startIcon={<UndoIcon />}
                sx={{ ml: 'auto' }}
              >
                Undo
              </Button>
              
              <Button 
                variant="outlined" 
                size="small" 
                color="inherit"
                startIcon={<RedoIcon />}
              >
                Redo
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
      
      {/* Table with audits */}
      <Paper>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <CircularProgress />
            </Box>
          ) : filteredAudits.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <Typography variant="body1" color="text.secondary">
                No audits found. Try adjusting your filters.
              </Typography>
            </Box>
          ) : (
            <Table stickyHeader aria-label="energy audits table">
              <TableHead>
                <TableRow>
                  <TableCell>Audit Name</TableCell>
                  <TableCell>Building</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="center">Issues</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentAudits.map((audit) => {
                  const statusConfig = STATUS_COLORS[audit.status] || { color: 'default', icon: <LiveTvIcon fontSize="small" /> };
                  
                  return (
                    <TableRow hover key={audit.id}>
                      <TableCell>{audit.name}</TableCell>
                      <TableCell>{audit.buildingName}</TableCell>
                      <TableCell>{audit.date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={audit.status.charAt(0).toUpperCase() + audit.status.slice(1)} 
                          color={statusConfig.color as any} 
                          size="small" 
                          icon={statusConfig.icon}
                        />
                      </TableCell>
                      <TableCell>
                        {audit.type.charAt(0).toUpperCase() + audit.type.slice(1)}
                      </TableCell>
                      <TableCell>{audit.assignedTo}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {audit.issues > 0 && (
                            <Tooltip title={`${audit.issues} issues`}>
                              <Chip 
                                label={audit.issues} 
                                color="error" 
                                size="small" 
                                icon={<ErrorIcon fontSize="small" />}
                              />
                            </Tooltip>
                          )}
                          {audit.warnings > 0 && (
                            <Tooltip title={`${audit.warnings} warnings`}>
                              <Chip 
                                label={audit.warnings} 
                                color="warning" 
                                size="small" 
                                icon={<WarningIcon fontSize="small" />}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, audit)}
                          aria-label="more options"
                        >
                          <FilterListIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAudits.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => selectedRow && handleViewAudit(selectedRow.id)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View
        </MenuItem>
        
        {permissions.canEdit && (
          <MenuItem onClick={() => selectedRow && handleEditAudit(selectedRow.id)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        
        {permissions.canDelete && (
          <MenuItem onClick={() => selectedRow && handleDeleteAudit(selectedRow.id)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default AuditTableContainer; 