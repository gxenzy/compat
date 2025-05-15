import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Button,
  Stack,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  ElectricalServices as ElectricalServicesIcon,
  AcUnit as AcUnitIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../../../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';

// Import actual components for real implementation
// In a real scenario these would be imported from their actual paths
import ElectricalInspectionChecklist from './ElectricalInspectionChecklist';
import HVACInspectionChecklist from './HVACInspectionChecklist';

// Define types for inspection items
interface InspectionItem {
  id: string;
  category: string;
  item: string;
  reference: string;
  explanation: string;
  standard: string;
}

// PEC 2017 based electrical inspection items
// These are based on actual Philippine Electrical Code 2017 requirements
const electricalItems: InspectionItem[] = [
  {
    id: 'e1',
    category: 'Wiring',
    item: 'Verify conductors are properly sized according to ampacity tables',
    reference: 'PEC 2017 Section 3.10.15',
    explanation: 'Conductors must be sized based on load calculations and ambient temperature. Reference Table 3.10.15 for proper sizing.',
    standard: 'Conductors must have sufficient ampacity after applicable derating factors'
  },
  {
    id: 'e2',
    category: 'Wiring',
    item: 'Check for proper color coding of conductors',
    reference: 'PEC 2017 Section 3.10.5.1',
    explanation: 'Grounded conductors must be white or gray, equipment grounding conductors must be green, bare, or green with yellow stripes.',
    standard: 'All conductors must be properly identified according to their function'
  },
  {
    id: 'e3', 
    category: 'Grounding',
    item: 'Verify proper grounding electrode system',
    reference: 'PEC 2017 Section 5.0.20',
    explanation: 'Grounding electrode system must include all available electrodes including metal underground water pipe, metal frame of building, concrete-encased electrode, or ground ring.',
    standard: 'Grounding electrode system must provide path to earth with resistance less than 25 ohms'
  },
  {
    id: 'e4',
    category: 'Panels',
    item: 'Check working clearances in front of electrical equipment',
    reference: 'PEC 2017 Section 2.10.2',
    explanation: 'Working space must be minimum depth of 900mm for 0-150V to ground, 1.0m for 151-600V to ground. Width must be 30 inches or width of equipment.',
    standard: 'Sufficient working space must be maintained in front of all electrical equipment'
  },
  {
    id: 'e5',
    category: 'Branch Circuits',
    item: 'Verify proper overcurrent protection for branch circuits',
    reference: 'PEC 2017 Section 4.0.24',
    explanation: 'Branch circuits must be protected at their rated ampacity. Standard sizes: 15A, 20A, 30A, 40A, 50A, etc.',
    standard: 'Overcurrent protection must not exceed conductor ampacity after adjustment factors'
  }
];

// ASHRAE based HVAC inspection items
// These are based on actual ASHRAE standards
const hvacItems: InspectionItem[] = [
  {
    id: 'h1',
    category: 'Ventilation',
    item: 'Verify minimum outdoor air ventilation rates',
    reference: 'ASHRAE 62.1-2019 Section 6.2',
    explanation: 'Different space types require different minimum outdoor air ventilation rates based on occupancy and floor area.',
    standard: 'Minimum ventilation rates must meet both per-person and per-area requirements'
  },
  {
    id: 'h2',
    category: 'Thermal Comfort',
    item: 'Ensure indoor conditions meet thermal comfort standards',
    reference: 'ASHRAE 55-2017 Section 5.3',
    explanation: 'Acceptable thermal comfort depends on temperature, humidity, air speed, metabolic rate, and clothing insulation.',
    standard: 'Operative temperature should be between 19-28°C depending on season and humidity'
  },
  {
    id: 'h3',
    category: 'Energy Efficiency',
    item: 'Check minimum energy efficiency ratios for cooling equipment',
    reference: 'ASHRAE 90.1-2019 Section 6.4.1',
    explanation: 'Minimum efficiency requirements vary by equipment type, capacity, and application.',
    standard: 'Equipment must meet minimum energy efficiency ratio (EER) or integrated energy efficiency ratio (IEER)'
  },
  {
    id: 'h4',
    category: 'Controls',
    item: 'Verify temperature setback controls during unoccupied hours',
    reference: 'ASHRAE 90.1-2019 Section 6.4.3',
    explanation: 'Automatic setback controls are required to reduce energy consumption during unoccupied periods.',
    standard: 'Systems must have capability for at least 8°C temperature setback and 7-day programmable schedule'
  },
  {
    id: 'h5',
    category: 'Air Distribution',
    item: 'Check duct insulation and sealing',
    reference: 'ASHRAE 90.1-2019 Section 6.4.4.2',
    explanation: 'Ducts must be properly sealed and insulated to minimize energy losses.',
    standard: 'Ductwork must be sealed according to static pressure class and insulated based on location'
  }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inspection-tabpanel-${index}`}
      aria-labelledby={`inspection-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inspection-tab-${index}`,
    'aria-controls': `inspection-tabpanel-${index}`,
  };
}

// Custom component for viewing reference-based checklist items
const ReferenceBasedChecklist: React.FC<{items: InspectionItem[]}> = ({items}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isSpecialTheme = ['blue', 'gray', 'energy', 'dark', 'darkBlue'].includes(mode);
  
  const handleAccordionChange = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };
  
  const handleCheckChange = (itemId: string) => {
    setCheckedItems(prev => 
      prev.includes(itemId) 
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]
    );
  };
  
  const handleNoteChange = (itemId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [itemId]: value
    }));
  };
  
  const handleSave = () => {
    // In a real implementation, this would save to a database or file
    // For educational purposes, we'll just show what would be saved
    const data = {
      timestamp: new Date().toISOString(),
      checkedItems,
      notes,
      totalItems: items.length,
      completedItems: checkedItems.length
    };
    
    alert(`Inspection data saved. Completed ${checkedItems.length} of ${items.length} items.`);
    console.log("Saved inspection data:", data);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2">
          Completed: {checkedItems.length} of {items.length} items ({Math.round((checkedItems.length / items.length) * 100)}%)
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={checkedItems.length === 0}
        >
          Save Inspection Data
        </Button>
      </Box>

      {items.map(item => (
        <Accordion 
          key={item.id}
          expanded={expandedItem === item.id}
          onChange={() => handleAccordionChange(item.id)}
          sx={{ 
            mb: 1,
            border: checkedItems.includes(item.id) 
              ? isSpecialTheme ? '1px solid #4caf50' : '1px solid #4caf50' 
              : isSpecialTheme ? `1px solid ${alpha('#ffffff', 0.12)}` : '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: checkedItems.includes(item.id) 
              ? isSpecialTheme ? alpha('#4caf50', 0.1) : 'rgba(76, 175, 80, 0.05)' 
              : 'inherit',
            color: isSpecialTheme ? theme.palette.text.primary : 'inherit',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={checkedItems.includes(item.id)}
                    onChange={() => handleCheckChange(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label=""
                sx={{ mr: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{item.item}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.category} | Reference: {item.reference}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Standard Requirements:</Typography>
              <Typography variant="body2" paragraph>{item.standard}</Typography>
              
              <Typography variant="subtitle2" gutterBottom>Explanation:</Typography>
              <Typography variant="body2" paragraph>{item.explanation}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Inspector Notes:</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                placeholder="Enter your observations and findings here..."
                value={notes[item.id] || ''}
                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                size="small"
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<CloudUploadIcon />}
                >
                  Upload Evidence
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InfoOutlinedIcon />}
                >
                  View Reference
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

const InspectionChecklistComponent: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    inspector: '',
    building: '',
    date: new Date().toISOString().slice(0, 10),
    purpose: 'educational'
  });
  
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isSpecialTheme = ['blue', 'gray', 'energy', 'dark', 'darkBlue'].includes(mode);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setInspectionData({
      ...inspectionData,
      [field]: event.target.value
    });
  };
  
  const handleSelectChange = (field: string) => (event: SelectChangeEvent) => {
    setInspectionData({
      ...inspectionData,
      [field]: event.target.value
    });
  };
  
  const startNewInspection = (tab: number) => {
    setIsLoading(true);
    
    // Simulate loading of actual standards and references
    setTimeout(() => {
      setIsLoading(false);
      setTabValue(tab);
    }, 1000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Inspection Checklists</Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Educational reference-based checklists for comprehensive inspections based on PEC 2017 and ASHRAE standards
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="inspection checklist tabs"
        >
          <Tab icon={<CheckCircleOutlineIcon />} label="Overview" {...a11yProps(0)} />
          <Tab icon={<ElectricalServicesIcon />} label="Electrical Systems" {...a11yProps(1)} />
          <Tab icon={<AcUnitIcon />} label="HVAC Systems" {...a11yProps(2)} />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Educational Inspection Checklists
            </Typography>
            <Typography variant="body1" paragraph>
              These checklists are designed for educational purposes to help engineering students 
              understand and apply industry standards during energy audits. They're based on actual 
              Philippine Electrical Code (PEC) 2017 and ASHRAE Standards, with proper references and explanations.
            </Typography>
            
            <Paper sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : '#f9f9f9',
              color: isSpecialTheme ? theme.palette.text.primary : 'inherit',
            }}>
              <Typography variant="h6" gutterBottom>New Inspection</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Inspector Name"
                    fullWidth
                    value={inspectionData.inspector}
                    onChange={handleInputChange('inspector')}
                    helperText="Student or faculty member conducting the inspection"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Building/Area"
                    fullWidth
                    value={inspectionData.building}
                    onChange={handleInputChange('building')}
                    helperText="Campus building or area being inspected"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    value={inspectionData.date}
                    onChange={handleInputChange('date')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="purpose-label">Inspection Purpose</InputLabel>
                    <Select
                      labelId="purpose-label"
                      value={inspectionData.purpose}
                      label="Inspection Purpose"
                      onChange={handleSelectChange('purpose')}
                    >
                      <MenuItem value="educational">Educational Exercise</MenuItem>
                      <MenuItem value="assessment">Building Assessment</MenuItem>
                      <MenuItem value="thesis">Thesis Research</MenuItem>
                      <MenuItem value="maintenance">Maintenance Planning</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{
                  bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : undefined,
                  color: isSpecialTheme ? theme.palette.text.primary : undefined,
                }}>
                  <CardContent>
                    <ElectricalServicesIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Electrical Inspection Checklist
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Based on Philippine Electrical Code (PEC) 2017 with actual section references and requirements.
                      Includes wiring methods, grounding, overcurrent protection, and safety compliance.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      endIcon={<ArrowForwardIcon />} 
                      sx={{ mt: 2 }}
                      onClick={() => startNewInspection(1)}
                    >
                      Start Electrical Inspection
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card sx={{
                  bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : undefined,
                  color: isSpecialTheme ? theme.palette.text.primary : undefined,
                }}>
                  <CardContent>
                    <AcUnitIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      HVAC Inspection Checklist
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Based on ASHRAE Standards 55, 62.1, and 90.1 with actual technical requirements.
                      Includes ventilation, thermal comfort, energy efficiency, and controls assessment.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      endIcon={<ArrowForwardIcon />} 
                      sx={{ mt: 2 }}
                      onClick={() => startNewInspection(2)}
                    >
                      Start HVAC Inspection
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Paper sx={{ 
              p: 3, 
              mt: 4, 
              bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : '#f5f5f5',
              color: isSpecialTheme ? theme.palette.text.primary : 'inherit',
            }}>
              <Typography variant="h6" gutterBottom>
                Educational Objectives
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>1. Standards Application:</strong> Learn to apply industry standards in practical scenarios
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>2. Technical Documentation:</strong> Practice proper inspection documentation techniques
                  </Typography>
                  <Typography variant="body2">
                    <strong>3. Analytical Skills:</strong> Develop critical evaluation of building systems
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>4. Energy Efficiency:</strong> Identify energy saving opportunities
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>5. Safety Compliance:</strong> Recognize safety issues and code violations
                  </Typography>
                  <Typography variant="body2">
                    <strong>6. Professional Development:</strong> Build practical engineering skills
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined"
                  sx={{
                    bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : undefined,
                    color: isSpecialTheme ? theme.palette.text.primary : undefined,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="h6">PEC 2017 Reference</Typography>
                    </Stack>
                    <Typography variant="body2" paragraph>
                      The Philippine Electrical Code (PEC) 2017 establishes practical safeguarding of persons and property
                      from hazards arising from the use of electricity. It contains provisions considered necessary for safety.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Key sections relevant to educational energy audits include wiring methods (Article 3),
                      equipment for general use (Article 4), and special occupancies (Article 5).
                    </Typography>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
                      View PEC 2017 Quick Reference
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined"
                  sx={{
                    bgcolor: isSpecialTheme ? alpha('#ffffff', 0.07) : undefined,
                    color: isSpecialTheme ? theme.palette.text.primary : undefined,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="h6">ASHRAE Standards</Typography>
                    </Stack>
                    <Typography variant="body2" paragraph>
                      ASHRAE standards relevant to energy audits include:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      - ASHRAE 55: Thermal Environmental Conditions for Human Occupancy
                    </Typography>
                    <Typography variant="body2" paragraph>
                      - ASHRAE 62.1: Ventilation for Acceptable Indoor Air Quality
                    </Typography>
                    <Typography variant="body2" paragraph>
                      - ASHRAE 90.1: Energy Standard for Buildings Except Low-Rise Residential Buildings
                    </Typography>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
                      View ASHRAE Quick Reference
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Electrical Inspection Checklist Tab */}
        <TabPanel value={tabValue} index={1}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Electrical Inspection Checklist</Typography>
                <Typography variant="body2">
                  Based on <strong>PEC 2017</strong> Requirements
                </Typography>
              </Box>
              
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  bgcolor: isSpecialTheme ? alpha('#03a9f4', 0.1) : undefined,
                  color: isSpecialTheme ? theme.palette.text.primary : undefined,
                  '& .MuiAlert-icon': {
                    color: isSpecialTheme ? '#03a9f4' : undefined
                  }
                }}
              >
                This is an educational checklist based on actual PEC 2017 requirements. Complete each item based on your manual inspection.
              </Alert>
              
              <ReferenceBasedChecklist items={electricalItems} />
            </Box>
          )}
        </TabPanel>
        
        {/* HVAC Inspection Checklist Tab */}
        <TabPanel value={tabValue} index={2}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">HVAC Inspection Checklist</Typography>
                <Typography variant="body2">
                  Based on <strong>ASHRAE</strong> Standards
                </Typography>
              </Box>
              
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  bgcolor: isSpecialTheme ? alpha('#03a9f4', 0.1) : undefined,
                  color: isSpecialTheme ? theme.palette.text.primary : undefined,
                  '& .MuiAlert-icon': {
                    color: isSpecialTheme ? '#03a9f4' : undefined
                  }
                }}
              >
                This is an educational checklist based on actual ASHRAE standards. Complete each item based on your manual inspection.
              </Alert>
              
              <ReferenceBasedChecklist items={hvacItems} />
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default InspectionChecklistComponent; 