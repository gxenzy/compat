import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Description as DocumentIcon,
  PictureAsPdf as PDFIcon,
  InsertChart as ChartIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Mail as EmailIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';

const mockReportTemplates = [
  { id: '1', name: 'Comprehensive Audit Report', description: 'Complete report with all findings, recommendations, and financial analysis' },
  { id: '2', name: 'Executive Summary', description: 'Brief overview of key findings and recommendations for executive team' },
  { id: '3', name: 'Financial Analysis Report', description: 'Detailed ROI calculations and financial projections' },
  { id: '4', name: 'Technical Report', description: 'Detailed technical findings and specifications' },
  { id: '5', name: 'Compliance Documentation', description: 'Documentation for regulatory compliance and certification' }
];

const mockAuditData = {
  auditId: 'EA-2023-1025',
  buildingName: 'Corporate Headquarters',
  buildingAddress: '123 Business Park, Anytown, CA 90210',
  auditDate: '2023-10-15',
  auditType: 'Level 2 Energy Audit',
  auditors: ['John Doe', 'Sarah Johnson'],
  totalAreas: 12,
  findings: 24,
  recommendations: 18,
  estimatedSavings: '$85,750 annually',
  simplePayback: '3.2 years',
  co2Reduction: '215 metric tons annually'
};

const ReportGenerator: React.FC = () => {
  const theme = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('1');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const history = useHistory();
  const [includeOptions, setIncludeOptions] = useState({
    executiveSummary: true,
    findings: true,
    recommendations: true,
    financialAnalysis: true,
    implementationPlan: true,
    appendices: false,
    images: true,
    charts: true
  });

  const handleOptionChange = (option: keyof typeof includeOptions) => {
    setIncludeOptions({
      ...includeOptions,
      [option]: !includeOptions[option]
    });
  };

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
      setReportGenerated(true);
    }, 3000);
  };

  const handleDownloadReport = () => {
    // In a real app, this would trigger the download of a generated PDF
    alert('Downloading report...');
  };

  const handleEmailReport = () => {
    // In a real app, this would open an email dialog
    alert('Email functionality would be implemented here');
  };

  const handleEditWithBuilder = () => {
    // In a real app, you'd store the current report state and pass it to the builder
    // Here we'll simply history.push to the builder
    history.push('/energy-audit/audit-workflow');
  };

  const getTemplate = (id: string) => {
    return mockReportTemplates.find(t => t.id === id) || mockReportTemplates[0];
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Audit Report Generator</Typography>
        
        {reportGenerated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />}
              onClick={handleEmailReport}
            >
              Email
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Report Options</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Template</Typography>
              <List sx={{ bgcolor: 'background.paper' }}>
                {mockReportTemplates.map((template) => (
                  <ListItem 
                    key={template.id}
                    button
                    selected={selectedTemplate === template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    sx={{ 
                      borderRadius: 1,
                      border: selectedTemplate === template.id ? `1px solid ${theme.palette.primary.main}` : 'none',
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      <DocumentIcon color={selectedTemplate === template.id ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={template.name} 
                      secondary={template.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>Include in Report</Typography>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.executiveSummary} 
                    onChange={() => handleOptionChange('executiveSummary')}
                  />
                }
                label="Executive Summary"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.findings} 
                    onChange={() => handleOptionChange('findings')}
                  />
                }
                label="Audit Findings"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.recommendations} 
                    onChange={() => handleOptionChange('recommendations')}
                  />
                }
                label="Recommendations"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.financialAnalysis} 
                    onChange={() => handleOptionChange('financialAnalysis')}
                  />
                }
                label="Financial Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.implementationPlan} 
                    onChange={() => handleOptionChange('implementationPlan')}
                  />
                }
                label="Implementation Plan"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.appendices} 
                    onChange={() => handleOptionChange('appendices')}
                  />
                }
                label="Appendices"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.images} 
                    onChange={() => handleOptionChange('images')}
                  />
                }
                label="Images & Photos"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includeOptions.charts} 
                    onChange={() => handleOptionChange('charts')}
                  />
                }
                label="Charts & Graphs"
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditWithBuilder}
                sx={{ mt: 2 }}
              >
                Advanced Report Builder
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Report Content</Typography>
            
            <TextField
              fullWidth
              label="Report Title"
              variant="outlined"
              value={customTitle || `${mockAuditData.buildingName} - ${getTemplate(selectedTemplate).name}`}
              onChange={(e) => setCustomTitle(e.target.value)}
              margin="normal"
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Building Name"
                  value={mockAuditData.buildingName}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Audit Date"
                  value={mockAuditData.auditDate}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Building Address"
                  value={mockAuditData.buildingAddress}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Audit Type"
                  value={mockAuditData.auditType}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prepared By"
                  value={mockAuditData.auditors.join(', ')}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>Audit Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Areas Assessed</Typography>
                    <Typography variant="h5">{mockAuditData.totalAreas}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Findings</Typography>
                    <Typography variant="h5">{mockAuditData.findings}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Recommendations</Typography>
                    <Typography variant="h5">{mockAuditData.recommendations}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Potential Savings</Typography>
                    <Typography variant="h5">{mockAuditData.estimatedSavings.split(' ')[0]}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This report will include {Object.values(includeOptions).filter(Boolean).length} of 8 possible sections based on your selections.
                  {!includeOptions.executiveSummary && ' Consider adding an Executive Summary for better readability.'}
                </Typography>
              </Alert>
              
              {reportGenerated ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="success.main">
                    Report Generated Successfully
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Your {getTemplate(selectedTemplate).name} is ready to download or share
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                    <Chip icon={<PDFIcon />} label="PDF" color="primary" />
                    <Chip icon={<ChartIcon />} label="Charts" />
                    <Chip icon={<ImageIcon />} label="Images" />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={generatingReport ? <CircularProgress size={20} color="inherit" /> : <PDFIcon />}
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    fullWidth
                  >
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    disabled={generatingReport}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    disabled={generatingReport}
                  >
                    Save Draft
                  </Button>
                </Box>
              )}
              
              {generatingReport && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Processing data and generating report...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
          
          {reportGenerated && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Report Preview</Typography>
              <Box sx={{ 
                p: 3, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                bgcolor: 'background.paper',
                height: 300,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Typography variant="h5" gutterBottom align="center">
                  {customTitle || `${mockAuditData.buildingName} - ${getTemplate(selectedTemplate).name}`}
                </Typography>
                <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                  Prepared for: Sample Client Organization
                </Typography>
                <Typography variant="body2" gutterBottom align="center">
                  Audit Date: {mockAuditData.auditDate} | Report Date: {new Date().toLocaleDateString()}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                <Typography variant="body2" paragraph>
                  This report summarizes the findings of the {mockAuditData.auditType} conducted at {mockAuditData.buildingName} 
                  on {mockAuditData.auditDate}. The audit identified {mockAuditData.findings} energy efficiency opportunities 
                  with {mockAuditData.recommendations} recommended measures for implementation.
                </Typography>
                
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  height: 100,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Button startIcon={<PreviewIcon />}>View Full Preview</Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportGenerator; 