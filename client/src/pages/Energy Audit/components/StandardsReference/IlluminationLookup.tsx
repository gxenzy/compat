import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import axios from 'axios';
import { STANDARDS_API, apiClient } from '../../../../utils/apiConfig';

interface IlluminationRequirement {
  roomType: string;
  requiredIlluminance: number;
  notes: string;
  tableNumber: string;
  tableTitle: string;
  standard: string;
  standardFullName: string;
}

const IlluminationLookup: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IlluminationRequirement | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a room type to search');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.get(STANDARDS_API.ILLUMINATION(searchQuery));
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error looking up illumination requirements');
      console.error('Illumination lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Illumination Requirements Lookup
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Look up illumination requirements based on room type according to Philippine Electrical Code (PEC) 2017 standards.
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          label="Room Type"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g., Classroom, Office, Laboratory"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={isLoading}
          sx={{ ml: 1, minWidth: '120px' }}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Illumination requirement found for {result.roomType}
          </Alert>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="subtitle1">
                      Illumination Requirement Details
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" width="40%">
                    Room Type
                  </TableCell>
                  <TableCell>{result.roomType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Required Illuminance
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${result.requiredIlluminance} lux`} 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Notes
                  </TableCell>
                  <TableCell>{result.notes}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Reference
                  </TableCell>
                  <TableCell>
                    {result.standardFullName} ({result.standard}), 
                    Table {result.tableNumber}: {result.tableTitle}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: This information is based on {result.standard} requirements. Always consult the
            full standard for comprehensive guidance.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default IlluminationLookup; 
 
 