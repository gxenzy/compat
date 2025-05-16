import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  VerifiedUser as VerifiedUserIcon,
  Rule as RuleIcon,
  LightbulbOutlined as LightbulbIcon,
  ElectricalServices as ElectricalServicesIcon,
  AcUnit as AcUnitIcon,
  Info as InfoIcon,
  NavigateNext as NavigateNextIcon,
  Visibility as VisibilityIcon,
  Compare as CompareIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL, apiClient } from '../../../../utils/apiConfig';

interface CalculationResult {
  id: string;
  type: string;
  name: string;
  date: string;
  result: {
    [key: string]: any;
  };
}

interface ComplianceRule {
  id: number;
  rule_code: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  verification_method: string;
  evaluation_criteria: string;
  failure_impact: string;
  type: 'prescriptive' | 'performance' | 'mandatory';
  section_id: number;
  section_number: string;
  section_title: string;
  standard_id: number;
  standard_code: string;
}

interface ComplianceVerification {
  calculationId: string;
  ruleId: number;
  status: 'compliant' | 'non_compliant' | 'needs_review';
  details: string;
  verifiedAt: string;
}

interface ComplianceResultDetails {
  compliantCount: number;
  nonCompliantCount: number;
  needsReviewCount: number;
  status: 'passed' | 'failed' | 'needs_review';
  rules: {
    rule: ComplianceRule;
    status: 'compliant' | 'non_compliant' | 'needs_review';
    details: string;
  }[];
}

// Define the filter interface
interface RuleFilters {
  section: string;
  severity: string;
  type: string;
}

const ComplianceCalculatorIntegration: React.FC = () => {
  const [savedCalculations, setSavedCalculations] = useState<CalculationResult[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationResult | null>(null);
  const [applicableRules, setApplicableRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complianceResults, setComplianceResults] = useState<ComplianceResultDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);
  
  // Add the filters state
  const [filters, setFilters] = useState<RuleFilters>({
    section: '',
    severity: '',
    type: ''
  });

  useEffect(() => {
    loadSavedCalculations();
  }, []);

  const loadSavedCalculations = () => {
    // In a real app, this would be an API call
    // For now, load from localStorage
    try {
      const savedCalcs = localStorage.getItem('energyCalculations');
      if (savedCalcs) {
        const calculations = JSON.parse(savedCalcs);
        setSavedCalculations(calculations);
      }
    } catch (err) {
      console.error('Error loading saved calculations:', err);
      setError('Failed to load saved calculations');
    }
  };

  const handleSelectCalculation = async (calculation: CalculationResult) => {
    setSelectedCalculation(calculation);
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to get applicable rules
      // For now, let's simulate it
      
      // Fetch applicable rules based on calculation type
      const response = await apiClient.get(`/compliance/rules`, {
        params: { 
          calculationType: calculation.type 
        }
      });
      
      setApplicableRules(response.data);
      
      // Check if we have existing verification results
      const verificationResults = await checkCompliance(calculation, response.data);
      setComplianceResults(verificationResults);
      
    } catch (err) {
      console.error('Error fetching applicable rules:', err);
      setError('Failed to load applicable compliance rules');
      setApplicableRules([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCompliance = async (calculation: CalculationResult, rules: ComplianceRule[]): Promise<ComplianceResultDetails> => {
    // In a real app, this would call an API endpoint
    // For now, we'll simulate the compliance check logic
    
    try {
      const response = await apiClient.post(`/compliance/verify-calculation`, {
        calculationId: calculation.id,
        calculationType: calculation.type,
        calculationData: calculation.result
      });
      
      return response.data;
    } catch (err) {
      console.error('Error verifying compliance:', err);
      
      // Provide a fallback verification logic
      // This would normally be on the server side
      const results: ComplianceResultDetails = {
        compliantCount: 0,
        nonCompliantCount: 0,
        needsReviewCount: 0,
        status: 'needs_review',
        rules: []
      };
      
      // Simplified compliance check
      // In real implementation, this would be more sophisticated
      rules.forEach(rule => {
        let status: 'compliant' | 'non_compliant' | 'needs_review' = 'needs_review';
        let details = 'Manual verification required';
        
        // Example logic for illumination calculation
        if (calculation.type === 'illumination') {
          if (rule.rule_code.includes('PEC-1075')) {
            const requiredLux = extractRequiredLux(rule.evaluation_criteria);
            const calculatedLux = calculation.result.calculatedLux || 0;
            
            if (calculatedLux >= requiredLux) {
              status = 'compliant';
              details = `Calculated illumination (${calculatedLux} lux) meets the required minimum (${requiredLux} lux)`;
            } else {
              status = 'non_compliant';
              details = `Calculated illumination (${calculatedLux} lux) is below the required minimum (${requiredLux} lux)`;
            }
          }
        }
        
        // Example logic for power factor calculation
        if (calculation.type === 'power_factor') {
          if (rule.rule_code.includes('PEC-2050')) {
            const requiredPF = 0.90; // Most standards require at least 0.90
            const calculatedPF = calculation.result.powerFactor || 0;
            
            if (calculatedPF >= requiredPF) {
              status = 'compliant';
              details = `Calculated power factor (${calculatedPF}) meets the required minimum (${requiredPF})`;
            } else {
              status = 'non_compliant';
              details = `Calculated power factor (${calculatedPF}) is below the required minimum (${requiredPF})`;
            }
          }
        }
        
        // Add the result
        results.rules.push({
          rule,
          status,
          details
        });
        
        // Update counters
        if (status === 'compliant') results.compliantCount++;
        else if (status === 'non_compliant') results.nonCompliantCount++;
        else results.needsReviewCount++;
      });
      
      // Determine overall status
      if (results.nonCompliantCount > 0) {
        results.status = 'failed';
      } else if (results.needsReviewCount > 0) {
        results.status = 'needs_review';
      } else {
        results.status = 'passed';
      }
      
      return results;
    }
  };
  
  const extractRequiredLux = (criteria: string): number => {
    // Extract numeric value from criteria string
    // Example: "Minimum illuminance of 300 lux required"
    const match = criteria.match(/(\d+)\s*lux/);
    return match ? parseInt(match[1]) : 0;
  };
  
  const handleOpenRuleDetails = (rule: ComplianceRule) => {
    setSelectedRule(rule);
    setDetailsDialogOpen(true);
  };
  
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedRule(null);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return 'success';
      case 'non_compliant':
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed':
        return <CheckIcon />;
      case 'non_compliant':
      case 'failed':
        return <CloseIcon />;
      default:
        return <WarningIcon />;
    }
  };
  
  const getCalculationTypeIcon = (type: string) => {
    switch (type) {
      case 'illumination':
        return <LightbulbIcon />;
      case 'hvac':
        return <AcUnitIcon />;
      case 'power_factor':
        return <ElectricalServicesIcon />;
      default:
        return <AssessmentIcon />;
    }
  };
  
  const getCalculationTypeName = (type: string) => {
    switch (type) {
      case 'illumination':
        return 'Illumination';
      case 'hvac':
        return 'HVAC';
      case 'power_factor':
        return 'Power Factor';
      case 'equipment':
        return 'Equipment Load';
      case 'schedule_of_loads':
        return 'Schedule of Loads';
      case 'harmonic_distortion':
        return 'Harmonic Distortion';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  const fetchRules = async () => {
    const params: any = {};
    
    if (filters.section) {
      params.section_id = filters.section;
    }
    
    if (filters.severity) {
      params.severity = filters.severity;
    }
    
    if (filters.type) {
      params.type = filters.type;
    }
    
    // Only get active rules
    params.active = 'true';
    
    try {
      const response = await apiClient.get(`/compliance/rules`, { params });
      
      setApplicableRules(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      setError('Failed to load compliance rules');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        <VerifiedUserIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Calculator Compliance Verification
      </Typography>
      
      <Typography variant="body2" paragraph color="text.secondary">
        Verify your energy calculations against electrical code standards and compliance rules.
        Select a saved calculation to check its compliance status.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Saved Calculations
            </Typography>
            
            {savedCalculations.length === 0 ? (
              <Alert severity="info">
                No saved calculations found. Please save a calculation first.
              </Alert>
            ) : (
              <List>
                {savedCalculations.map((calc) => (
                  <ListItem 
                    key={calc.id}
                    button
                    selected={selectedCalculation?.id === calc.id}
                    onClick={() => handleSelectCalculation(calc)}
                    sx={{ 
                      mb: 1, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon>
                      {getCalculationTypeIcon(calc.type)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={calc.name}
                      secondary={`${getCalculationTypeName(calc.type)} - ${new Date(calc.date).toLocaleDateString()}`}
                    />
                    <IconButton size="small">
                      <NavigateNextIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {!selectedCalculation ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box textAlign="center">
                <CompareIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a calculation to verify compliance
                </Typography>
              </Box>
            </Paper>
          ) : loading ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : error ? (
            <Paper sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="h6">
                  {selectedCalculation.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCalculationTypeName(selectedCalculation.type)} calculation from {new Date(selectedCalculation.date).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Divider />
              
              {complianceResults && (
                <Box>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Compliance Status:</Typography>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(complianceResults.status)}
                        <Chip 
                          label={complianceResults.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(complianceResults.status) as any}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box textAlign="right">
                      <Grid container spacing={1}>
                        <Grid item>
                          <Chip 
                            icon={<CheckIcon />}
                            label={`${complianceResults.compliantCount} Compliant`}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Chip 
                            icon={<CloseIcon />}
                            label={`${complianceResults.nonCompliantCount} Non-Compliant`}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Chip 
                            icon={<WarningIcon />}
                            label={`${complianceResults.needsReviewCount} Needs Review`}
                            color="warning"
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Applicable Compliance Rules
                    </Typography>
                    
                    {complianceResults.rules.length === 0 ? (
                      <Alert severity="info">
                        No applicable compliance rules found for this calculation type.
                      </Alert>
                    ) : (
                      <List>
                        {complianceResults.rules.map((item, index) => (
                          <React.Fragment key={item.rule.id}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem 
                              sx={{ 
                                py: 2,
                                borderLeft: '4px solid',
                                borderLeftColor: getStatusColor(item.status) + '.main',
                                pl: 2
                              }}
                            >
                              <ListItemIcon>
                                {getStatusIcon(item.status)}
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Box display="flex" alignItems="center">
                                    <Typography variant="subtitle2">
                                      {item.rule.rule_code} - {item.rule.title}
                                    </Typography>
                                    <Chip 
                                      label={item.rule.severity}
                                      size="small"
                                      sx={{ ml: 1 }}
                                      color={
                                        item.rule.severity === 'critical' ? 'error' :
                                        item.rule.severity === 'major' ? 'warning' : 'info'
                                      }
                                    />
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      {item.rule.section_number} - {item.rule.section_title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {item.details}
                                    </Typography>
                                  </>
                                }
                              />
                              <Tooltip title="View Rule Details">
                                <IconButton 
                                  edge="end" 
                                  onClick={() => handleOpenRuleDetails(item.rule)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2, textAlign: 'right' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<LinkIcon />}
                    >
                      Create Compliance Checklist
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<AssessmentIcon />}
                      sx={{ ml: 2 }}
                    >
                      Generate Compliance Report
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Rule Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRule && (
          <>
            <DialogTitle>
              {selectedRule.rule_code} - {selectedRule.title}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Description:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedRule.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Standard Reference:</Typography>
                  <Typography variant="body2">
                    {selectedRule.standard_code}, Section {selectedRule.section_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRule.section_title}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Classification:</Typography>
                  <Box>
                    <Chip 
                      label={`Severity: ${selectedRule.severity.toUpperCase()}`}
                      size="small"
                      sx={{ mr: 1 }}
                      color={
                        selectedRule.severity === 'critical' ? 'error' :
                        selectedRule.severity === 'major' ? 'warning' : 'info'
                      }
                    />
                    <Chip 
                      label={`Type: ${selectedRule.type.toUpperCase()}`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Verification Method:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedRule.verification_method}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Evaluation Criteria:</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedRule.evaluation_criteria}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <AlertTitle>Failure Impact</AlertTitle>
                    {selectedRule.failure_impact}
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailsDialog}>
                Close
              </Button>
              <Button 
                color="primary" 
                variant="contained"
                onClick={handleCloseDetailsDialog}
              >
                Go to Standard
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ComplianceCalculatorIntegration;