import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import {
  ElectricalServices as ElectricalServicesIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  WaterDrop as WaterDropIcon,
  ArrowForward as ArrowForwardIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { loadSavedCalculations } from './utils/storage';
import { VoltageDropResult } from './utils/voltageDropUtils';

interface SavedVoltageDropCalculation {
  id: string;
  name: string;
  timestamp: number;
  data: {
    inputs: any;
    results: VoltageDropResult;
    [key: string]: any;
  };
}

interface VoltageDropWidgetProps {
  maxItems?: number;
  onNavigateToCalculator?: () => void;
}

const VoltageDropWidget: React.FC<VoltageDropWidgetProps> = ({
  maxItems = 5,
  onNavigateToCalculator
}) => {
  const [calculations, setCalculations] = useState<SavedVoltageDropCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceStats, setComplianceStats] = useState({
    compliant: 0,
    nonCompliant: 0,
    total: 0
  });
  
  useEffect(() => {
    loadCalculationsFromStorage();
  }, []);
  
  const loadCalculationsFromStorage = async () => {
    setLoading(true);
    try {
      const savedCalcs = loadSavedCalculations('voltage-drop');
      
      if (savedCalcs && savedCalcs.length > 0) {
        // Sort by timestamp, newest first
        const sortedCalcs = savedCalcs
          .filter((calc: any) => calc.data && calc.data.results)
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, maxItems);
        
        setCalculations(sortedCalcs as SavedVoltageDropCalculation[]);
        
        // Calculate compliance stats
        const compliant = sortedCalcs.filter(
          (calc: any) => calc.data.results.compliance === 'compliant'
        ).length;
        
        setComplianceStats({
          compliant,
          nonCompliant: sortedCalcs.length - compliant,
          total: sortedCalcs.length
        });
      } else {
        setCalculations([]);
      }
    } catch (err) {
      console.error('Error loading voltage drop calculations:', err);
      setError('Failed to load voltage drop calculations');
    } finally {
      setLoading(false);
    }
  };
  
  const getCompliancePercentage = (): number => {
    if (complianceStats.total === 0) return 0;
    return Math.round((complianceStats.compliant / complianceStats.total) * 100);
  };
  
  const getAverageVoltageDropPercentage = (): number => {
    if (calculations.length === 0) return 0;
    
    const sum = calculations.reduce(
      (total, calc) => total + calc.data.results.voltageDropPercent,
      0
    );
    
    return Math.round((sum / calculations.length) * 100) / 100;
  };
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <ElectricalServicesIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Voltage Drop Analysis
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : calculations.length === 0 ? (
          <Alert 
            severity="info"
            sx={{ mb: 2 }}
          >
            No voltage drop calculations found. Use the calculator to analyze your circuits.
          </Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    PEC Compliance
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      mt: 1
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={getCompliancePercentage()}
                      size={80}
                      thickness={5}
                      color={getCompliancePercentage() >= 70 ? 'success' : 'warning'}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h6" component="div">
                        {getCompliancePercentage()}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box mt={1} display="flex" justifyContent="center">
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${complianceStats.compliant} OK`}
                      size="small"
                      color="success"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      icon={<WarningIcon />}
                      label={`${complianceStats.nonCompliant} Issues`}
                      size="small"
                      color="warning"
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Circuit Statistics
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg. Voltage Drop
                        </Typography>
                        <Typography variant="h6">
                          {getAverageVoltageDropPercentage()}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Analyzed Circuits
                        </Typography>
                        <Typography variant="h6">
                          {complianceStats.total}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recent Analysis
                        </Typography>
                        <Typography variant="body2">
                          {calculations.length > 0 ? (
                            new Date(calculations[0].timestamp).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          ) : 'None'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2" gutterBottom>
              Recent Calculations
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {calculations.slice(0, 3).map((calc) => (
                <ListItem key={calc.id} dense>
                  <ListItemIcon>
                    {calc.data.results.compliance === 'compliant' ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <WarningIcon color="warning" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={calc.name}
                    secondary={`Drop: ${calc.data.results.voltageDropPercent.toFixed(2)}% | ${calc.data.inputs.conductorSize}`}
                  />
                  <Chip
                    label={`${calc.data.inputs.loadCurrent.toFixed(1)}A`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        
        <Box mt={2} display="flex" justifyContent="flex-start">
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={onNavigateToCalculator}
            sx={{ alignSelf: 'flex-start' }}
          >
            Open Calculator
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VoltageDropWidget; 