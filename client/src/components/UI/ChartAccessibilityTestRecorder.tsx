import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  SelectChangeEvent,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Assessment as AssessmentIcon,
  HelpOutline
} from '@mui/icons-material';
import { ChartType } from 'chart.js';
import { Link } from 'react-router-dom';
import AccessibilityKeyboardDemoChart from './AccessibilityKeyboardDemoChart';
import { 
  saveTestReport, 
  TestResult as StoredTestResult, 
  TestIssue as StoredTestIssue,
  exportTestReports
} from '../../utils/accessibility/testReportStorage';

// Type definitions for test results
interface TestResult {
  id: string;
  testId: string;
  testName: string;
  passed: boolean;
  notes: string;
}

interface TestIssue {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
}

interface TestReport {
  id: string;
  chartType: ChartType;
  screenReader: 'NVDA' | 'JAWS' | 'VoiceOver' | 'Narrator' | 'TalkBack' | 'Other';
  browser: string;
  os: string;
  testDate: string;
  tester: string;
  results: TestResult[];
  issues: TestIssue[];
  recommendations: string[];
  additionalNotes: string;
}

// Default test cases
const getDefaultTestCases = (category: string): { id: string; name: string }[] => {
  switch (category) {
    case 'chartNavigation':
      return [
        { id: 'SR1', name: 'Chart is announced when focused' },
        { id: 'SR2', name: 'Chart type is identified' },
        { id: 'SR3', name: 'Data points are announced with values' },
        { id: 'SR4', name: 'Navigation instructions are provided' },
        { id: 'SR5', name: 'Arrow keys history.push between data points' },
        { id: 'SR6', name: 'Home/End keys history.push to first/last points' },
        { id: 'SR7', name: 'Up/Down arrows history.push between datasets (if applicable)' },
        { id: 'SR8', name: 'Chart summary available (Alt+A)' },
      ];
    case 'dataTable':
      return [
        { id: 'DT1', name: 'Alt+D toggles data table view' },
        { id: 'DT2', name: 'Table is announced when activated' },
        { id: 'DT3', name: 'Headers are properly announced' },
        { id: 'DT4', name: 'Data cells are properly announced' },
        { id: 'DT5', name: 'Table navigation works with arrow keys' },
      ];
    case 'keyboardShortcuts':
      return [
        { id: 'KS1', name: 'Alt+H opens keyboard shortcuts help' },
        { id: 'KS2', name: 'Dialog is announced when opened' },
        { id: 'KS3', name: 'Shortcuts are navigable and readable' },
        { id: 'KS4', name: 'Dialog can be closed with Escape key' },
        { id: 'KS5', name: 'Focus returns to chart after closing' },
      ];
    case 'focusManagement':
      return [
        { id: 'FM1', name: 'Focus is not lost after interactions' },
        { id: 'FM2', name: 'Focus indicator is visible' },
        { id: 'FM3', name: 'Focus is trapped appropriately in dialogs' },
      ];
    case 'highContrast':
      return [
        { id: 'HC1', name: 'Chart elements are distinguishable' },
        { id: 'HC2', name: 'Focus indicators are visible' },
        { id: 'HC3', name: 'Data points are identifiable' },
      ];
    case 'all':
      return [
        ...getDefaultTestCases('chartNavigation'),
        ...getDefaultTestCases('dataTable'),
        ...getDefaultTestCases('keyboardShortcuts'),
        ...getDefaultTestCases('focusManagement'),
        ...getDefaultTestCases('highContrast'),
      ];
    default:
      return [];
  }
};

/**
 * Component for recording and documenting chart accessibility test results
 */
const ChartAccessibilityTestRecorder: React.FC = () => {
  // State for test configuration
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [screenReader, setScreenReader] = useState<'NVDA' | 'JAWS' | 'VoiceOver' | 'Narrator' | 'TalkBack' | 'Other'>('NVDA');
  const [browser, setBrowser] = useState('Chrome');
  const [os, setOs] = useState('Windows');
  const [tester, setTester] = useState('');
  
  // State for test results
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [issues, setIssues] = useState<TestIssue[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>(['']);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // State for new issue form
  const [newIssue, setNewIssue] = useState<Omit<TestIssue, 'id'>>({
    description: '',
    severity: 'medium',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Handle chart type change
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value as ChartType);
  };
  
  // Handle screen reader change
  const handleScreenReaderChange = (event: SelectChangeEvent) => {
    setScreenReader(event.target.value as 'NVDA' | 'JAWS' | 'VoiceOver' | 'Narrator' | 'TalkBack' | 'Other');
  };
  
  // Handle result change
  const handleResultChange = (testId: string, passed: boolean, notes: string = '') => {
    setTestResults(prev => {
      const existing = prev.find(r => r.testId === testId);
      if (existing) {
        return prev.map(r => r.testId === testId ? { ...r, passed, notes } : r);
      } else {
        return [...prev, {
          id: Date.now().toString(),
          testId,
          testName: getDefaultTestCases('all').find(t => t.id === testId)?.name || testId,
          passed,
          notes
        }];
      }
    });
  };
  
  // Handle issue form change
  const handleIssueChange = (field: keyof Omit<TestIssue, 'id'>, value: string) => {
    setNewIssue(prev => ({ ...prev, [field]: value }));
  };
  
  // Add new issue
  const addIssue = () => {
    if (newIssue.description.trim() === '') return;
    
    setIssues(prev => [...prev, {
      id: Date.now().toString(),
      ...newIssue
    }]);
    
    // Reset form
    setNewIssue({
      description: '',
      severity: 'medium',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: ''
    });
  };
  
  // Delete issue
  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== id));
  };
  
  // Add recommendation
  const addRecommendation = () => {
    setRecommendations(prev => [...prev, '']);
  };
  
  // Update recommendation
  const updateRecommendation = (index: number, value: string) => {
    setRecommendations(prev => prev.map((rec, i) => i === index ? value : rec));
  };
  
  // Delete recommendation
  const deleteRecommendation = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };
  
  // Save test report
  const saveReport = () => {
    if (!chartType || !screenReader || !browser || !os || !tester) {
      setSnackbarMessage('Please fill out all test configuration fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      const report = saveTestReport({
        chartType,
        screenReader,
        browser,
        os,
        tester,
        results: testResults,
        issues,
        recommendations,
        additionalNotes
      });
      
      setSnackbarMessage('Test report saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving test report:', error);
      setSnackbarMessage('Error saving test report. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Generate test report
  const generateReport = (): string => {
    const testDate = new Date().toISOString().split('T')[0];
    
    let report = `# Screen Reader Accessibility Test Report\n\n`;
    
    // Test configuration
    report += `## Test Configuration\n`;
    report += `- **Chart Type:** ${chartType}\n`;
    report += `- **Screen Reader:** ${screenReader}\n`;
    report += `- **Browser:** ${browser}\n`;
    report += `- **OS:** ${os}\n`;
    report += `- **Test Date:** ${testDate}\n`;
    report += `- **Tester:** ${tester}\n\n`;
    
    // Test results by category
    report += `## Test Results\n\n`;
    
    // Chart navigation
    report += `### Chart Navigation\n`;
    report += `| ID | Test Case | Result | Notes |\n`;
    report += `|----|-----------|--------|-------|\n`;
    
    getDefaultTestCases('chartNavigation').forEach(testCase => {
      const result = testResults.find(r => r.testId === testCase.id);
      report += `| ${testCase.id} | ${testCase.name} | ${result ? (result.passed ? 'Pass' : 'Fail') : 'Not Tested'} | ${result?.notes || ''} |\n`;
    });
    
    report += `\n`;
    
    // Data table view
    report += `### Data Table View\n`;
    report += `| ID | Test Case | Result | Notes |\n`;
    report += `|----|-----------|--------|-------|\n`;
    
    getDefaultTestCases('dataTable').forEach(testCase => {
      const result = testResults.find(r => r.testId === testCase.id);
      report += `| ${testCase.id} | ${testCase.name} | ${result ? (result.passed ? 'Pass' : 'Fail') : 'Not Tested'} | ${result?.notes || ''} |\n`;
    });
    
    report += `\n`;
    
    // Keyboard shortcuts
    report += `### Keyboard Shortcuts Help\n`;
    report += `| ID | Test Case | Result | Notes |\n`;
    report += `|----|-----------|--------|-------|\n`;
    
    getDefaultTestCases('keyboardShortcuts').forEach(testCase => {
      const result = testResults.find(r => r.testId === testCase.id);
      report += `| ${testCase.id} | ${testCase.name} | ${result ? (result.passed ? 'Pass' : 'Fail') : 'Not Tested'} | ${result?.notes || ''} |\n`;
    });
    
    report += `\n`;
    
    // Focus management
    report += `### Focus Management\n`;
    report += `| ID | Test Case | Result | Notes |\n`;
    report += `|----|-----------|--------|-------|\n`;
    
    getDefaultTestCases('focusManagement').forEach(testCase => {
      const result = testResults.find(r => r.testId === testCase.id);
      report += `| ${testCase.id} | ${testCase.name} | ${result ? (result.passed ? 'Pass' : 'Fail') : 'Not Tested'} | ${result?.notes || ''} |\n`;
    });
    
    report += `\n`;
    
    // High contrast mode
    report += `### High Contrast Mode\n`;
    report += `| ID | Test Case | Result | Notes |\n`;
    report += `|----|-----------|--------|-------|\n`;
    
    getDefaultTestCases('highContrast').forEach(testCase => {
      const result = testResults.find(r => r.testId === testCase.id);
      report += `| ${testCase.id} | ${testCase.name} | ${result ? (result.passed ? 'Pass' : 'Fail') : 'Not Tested'} | ${result?.notes || ''} |\n`;
    });
    
    report += `\n`;
    
    // Issues found
    report += `## Issues Found\n\n`;
    
    if (issues.length === 0) {
      report += `No issues found.\n\n`;
    } else {
      issues.forEach((issue, index) => {
        report += `### Issue ${index + 1}: ${issue.description}\n`;
        report += `- **Severity:** ${issue.severity}\n`;
        report += `- **Steps to Reproduce:**\n  ${issue.stepsToReproduce.split('\n').join('\n  ')}\n`;
        report += `- **Expected Behavior:** ${issue.expectedBehavior}\n`;
        report += `- **Actual Behavior:** ${issue.actualBehavior}\n\n`;
      });
    }
    
    // Recommendations
    report += `## Recommendations\n\n`;
    
    if (recommendations.filter(r => r.trim() !== '').length === 0) {
      report += `No recommendations at this time.\n\n`;
    } else {
      recommendations.filter(r => r.trim() !== '').forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += `\n`;
    }
    
    // Additional notes
    if (additionalNotes.trim() !== '') {
      report += `## Additional Notes\n\n${additionalNotes}\n\n`;
    }
    
    return report;
  };
  
  // Download report
  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const filename = `chart-accessibility-test-${chartType}-${screenReader.toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chart Accessibility Test Recorder
      </Typography>
      
      <Typography variant="body1" paragraph>
        Use this tool to document your findings when testing chart accessibility with screen readers and other assistive technologies.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Chart and Test Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Test Configuration</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="chart-type-label">Chart Type</InputLabel>
                  <Select
                    labelId="chart-type-label"
                    value={chartType}
                    label="Chart Type"
                    onChange={handleChartTypeChange}
                  >
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                    <MenuItem value="doughnut">Doughnut Chart</MenuItem>
                    <MenuItem value="radar">Radar Chart</MenuItem>
                    <MenuItem value="scatter">Scatter Chart</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="screen-reader-label">Screen Reader</InputLabel>
                  <Select
                    labelId="screen-reader-label"
                    value={screenReader}
                    label="Screen Reader"
                    onChange={handleScreenReaderChange}
                  >
                    <MenuItem value="NVDA">NVDA</MenuItem>
                    <MenuItem value="JAWS">JAWS</MenuItem>
                    <MenuItem value="VoiceOver">VoiceOver</MenuItem>
                    <MenuItem value="Narrator">Narrator</MenuItem>
                    <MenuItem value="TalkBack">TalkBack</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Browser" 
                  value={browser} 
                  onChange={(e) => setBrowser(e.target.value)} 
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Operating System" 
                  value={os} 
                  onChange={(e) => setOs(e.target.value)} 
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Tester Name" 
                  value={tester} 
                  onChange={(e) => setTester(e.target.value)} 
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Test Chart</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 350 }}>
              <AccessibilityKeyboardDemoChart chartType={chartType} />
            </Box>
          </Paper>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />} 
              onClick={saveReport}
            >
              Save Test Report
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<DownloadIcon />} 
              onClick={downloadReport}
            >
              Download Report
            </Button>
            
            <Button
              component={Link}
              to="/settings/accessibility/test-reports"
              variant="outlined"
              startIcon={<AssessmentIcon />}
            >
              View All Reports
            </Button>
            
            <Button
              component={Link}
              to="/settings/accessibility/testing-guide"
              variant="outlined"
              startIcon={<HelpOutline />}
            >
              Testing Guide
            </Button>
          </Box>
        </Grid>
        
        {/* Right column - Test Results */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Test Results</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Chart Navigation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Test Case</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDefaultTestCases('chartNavigation').map((testCase) => {
                        const result = testResults.find(r => r.testId === testCase.id);
                        
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell>{testCase.id}</TableCell>
                            <TableCell>{testCase.name}</TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={result?.passed || false}
                                    onChange={(e) => handleResultChange(testCase.id, e.target.checked, result?.notes || '')}
                                  />
                                }
                                label={result?.passed ? "Pass" : "Fail"}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Notes"
                                value={result?.notes || ''}
                                onChange={(e) => handleResultChange(testCase.id, result?.passed || false, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Data Table View</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Test Case</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDefaultTestCases('dataTable').map((testCase) => {
                        const result = testResults.find(r => r.testId === testCase.id);
                        
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell>{testCase.id}</TableCell>
                            <TableCell>{testCase.name}</TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={result?.passed || false}
                                    onChange={(e) => handleResultChange(testCase.id, e.target.checked, result?.notes || '')}
                                  />
                                }
                                label={result?.passed ? "Pass" : "Fail"}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Notes"
                                value={result?.notes || ''}
                                onChange={(e) => handleResultChange(testCase.id, result?.passed || false, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Keyboard Shortcuts</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Test Case</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDefaultTestCases('keyboardShortcuts').map((testCase) => {
                        const result = testResults.find(r => r.testId === testCase.id);
                        
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell>{testCase.id}</TableCell>
                            <TableCell>{testCase.name}</TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={result?.passed || false}
                                    onChange={(e) => handleResultChange(testCase.id, e.target.checked, result?.notes || '')}
                                  />
                                }
                                label={result?.passed ? "Pass" : "Fail"}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Notes"
                                value={result?.notes || ''}
                                onChange={(e) => handleResultChange(testCase.id, result?.passed || false, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Focus Management</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Test Case</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDefaultTestCases('focusManagement').map((testCase) => {
                        const result = testResults.find(r => r.testId === testCase.id);
                        
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell>{testCase.id}</TableCell>
                            <TableCell>{testCase.name}</TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={result?.passed || false}
                                    onChange={(e) => handleResultChange(testCase.id, e.target.checked, result?.notes || '')}
                                  />
                                }
                                label={result?.passed ? "Pass" : "Fail"}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Notes"
                                value={result?.notes || ''}
                                onChange={(e) => handleResultChange(testCase.id, result?.passed || false, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>High Contrast Mode</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Test Case</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDefaultTestCases('highContrast').map((testCase) => {
                        const result = testResults.find(r => r.testId === testCase.id);
                        
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell>{testCase.id}</TableCell>
                            <TableCell>{testCase.name}</TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={result?.passed || false}
                                    onChange={(e) => handleResultChange(testCase.id, e.target.checked, result?.notes || '')}
                                  />
                                }
                                label={result?.passed ? "Pass" : "Fail"}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Notes"
                                value={result?.notes || ''}
                                onChange={(e) => handleResultChange(testCase.id, result?.passed || false, e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Issues Found</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {issues.map((issue) => (
              <Box key={issue.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1">{issue.description}</Typography>
                  <Box>
                    <Chip 
                      label={issue.severity} 
                      color={
                        issue.severity === 'critical' ? 'error' :
                        issue.severity === 'high' ? 'warning' :
                        issue.severity === 'medium' ? 'info' : 'default'
                      } 
                      size="small" 
                      sx={{ mr: 1 }} 
                    />
                    <IconButton size="small" onClick={() => deleteIssue(issue.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2"><strong>Steps to Reproduce:</strong> {issue.stepsToReproduce}</Typography>
                <Typography variant="body2"><strong>Expected Behavior:</strong> {issue.expectedBehavior}</Typography>
                <Typography variant="body2"><strong>Actual Behavior:</strong> {issue.actualBehavior}</Typography>
              </Box>
            ))}
            
            <Typography variant="subtitle1" gutterBottom>Add New Issue</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField 
                  fullWidth 
                  label="Issue Description" 
                  value={newIssue.description} 
                  onChange={(e) => handleIssueChange('description', e.target.value)} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="severity-label">Severity</InputLabel>
                  <Select
                    labelId="severity-label"
                    value={newIssue.severity}
                    label="Severity"
                    onChange={(e) => handleIssueChange('severity', e.target.value as 'critical' | 'high' | 'medium' | 'low')}
                  >
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={2} 
                  label="Steps to Reproduce" 
                  value={newIssue.stepsToReproduce} 
                  onChange={(e) => handleIssueChange('stepsToReproduce', e.target.value)} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Expected Behavior" 
                  value={newIssue.expectedBehavior} 
                  onChange={(e) => handleIssueChange('expectedBehavior', e.target.value)} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Actual Behavior" 
                  value={newIssue.actualBehavior} 
                  onChange={(e) => handleIssueChange('actualBehavior', e.target.value)} 
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />} 
                  onClick={addIssue}
                >
                  Add Issue
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Recommendations</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recommendations.map((recommendation, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                <Typography sx={{ mr: 1 }}>{index + 1}.</Typography>
                <TextField 
                  fullWidth 
                  value={recommendation} 
                  onChange={(e) => updateRecommendation(index, e.target.value)} 
                />
                <IconButton 
                  size="small" 
                  onClick={() => deleteRecommendation(index)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={addRecommendation}
              sx={{ mt: 1 }}
            >
              Add Recommendation
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Additional Notes</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField 
              fullWidth 
              multiline 
              rows={4} 
              value={additionalNotes} 
              onChange={(e) => setAdditionalNotes(e.target.value)} 
              placeholder="Enter any additional observations or notes about the testing experience"
            />
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChartAccessibilityTestRecorder; 