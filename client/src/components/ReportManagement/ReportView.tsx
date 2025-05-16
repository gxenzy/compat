import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useHistory, useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { ChartTypeRegistry } from 'chart.js';
import { 
  Report, 
  ReportType, 
  ReportStatus,
  TextReportContent,
  ChartReportContent,
  TableReportContent,
  ImageReportContent,
  SectionHeaderReportContent,
  PageBreakReportContent,
  TocReportContent,
  ReportContent
} from '../../types/reports';
import reportService from '../../services/reportService';
import { PDFExporter } from '../../utils/pdfExporter';

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

// Chart cache to store rendered chart data
interface ChartCache {
  [key: string]: {
    instance: Chart | null;
    data: any;
    options: any;
    timestamp: number;
  };
}

// Global chart cache
const chartCache: ChartCache = {};

/**
 * ReportView component for viewing reports
 */
const ReportView: React.FC = () => {
  const theme = useTheme();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  
  // Report state
  const [report, setReport] = useState<Report | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // PDF export state
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);
  
  // Load report data
  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const reportData = await reportService.getReportById(parseInt(id));
        setReport(reportData);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
        console.error('Error loading report:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReport();
  }, [id]);
  
  // Clean up chart cache when component unmounts
  useEffect(() => {
    return () => {
      cleanupChartCache();
    };
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Handle edit report
  const handleEditReport = () => {
    if (report) {
      history.push(`/reports/edit/${report.id}`);
    }
  };
  
  // Handle share report
  const handleShareReport = () => {
    if (report) {
      history.push(`/reports/share/${report.id}`);
    }
  };
  
  // Handle download report as PDF
  const handleDownloadReport = async () => {
    if (!report) return;
    
    try {
      setExportingPDF(true);
      
      // Generate PDF
      const pdfBlob = await PDFExporter.generatePDF(report);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportingPDF(false);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      setExportingPDF(false);
    }
  };
  
  // Handle print report
  const handlePrintReport = () => {
    window.print();
  };
  
  // Handle back to reports list
  const handleBackToList = () => {
    history.push('/reports');
  };
  
  // Render content based on content type
  const renderContent = (content: ReportContent, index: number) => {
    switch (content.content_type) {
      case 'text':
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="body1">
              {(content as TextReportContent).content.isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: (content as TextReportContent).content.text }} />
              ) : (
                (content as TextReportContent).content.text
              )}
            </Typography>
          </Box>
        );
        
      case 'section_header':
        const headerContent = (content as SectionHeaderReportContent).content;
        const HeaderTag = `h${headerContent.level}` as keyof JSX.IntrinsicElements;
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <HeaderTag>{headerContent.title}</HeaderTag>
          </Box>
        );
        
      case 'image':
        const imageContent = (content as ImageReportContent).content;
        return (
          <Box key={index} sx={{ mb: 3, textAlign: 'center' }}>
            <img 
              src={imageContent.url} 
              alt={imageContent.altText || imageContent.caption || 'Report image'} 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                width: imageContent.width ? `${imageContent.width}px` : 'auto',
                maxHeight: imageContent.height ? `${imageContent.height}px` : 'auto'
              }} 
            />
            {imageContent.caption && (
              <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
                {imageContent.caption}
              </Typography>
            )}
          </Box>
        );
        
      case 'chart':
        // Implement Chart rendering
        const chartContent = (content as ChartReportContent).content;
        const chartId = `chart-${index}-${Date.now()}`;
        
        return (
          <Box key={index} sx={{ mb: 3, p: 2, height: chartContent.height || 300 }}>
            <canvas id={chartId} width="100%" height={chartContent.height || 300}></canvas>
            {chartContent.caption && (
              <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
                {chartContent.caption}
              </Typography>
            )}
            
            {/* Initialize chart after component renders */}
            <ChartRenderer 
              chartId={chartId} 
              chartType={chartContent.chartType} 
              data={chartContent.data} 
              options={chartContent.options} 
            />
          </Box>
        );
        
      case 'table':
        const tableContent = (content as TableReportContent).content;
        return (
          <Box key={index} sx={{ mb: 3, overflowX: 'auto' }}>
            {tableContent.caption && (
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {tableContent.caption}
              </Typography>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {tableContent.headers.map((header, i) => (
                    <th key={i} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableContent.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        );
        
      case 'page_break':
        const pageBreakContent = content as PageBreakReportContent;
        return (
          <Box key={index} className="page-break" sx={{ 
            my: 4, 
            borderTop: '1px dashed grey',
            pageBreakAfter: 'always',
            '@media print': {
              borderTop: 'none'
            }
          }}>
            <Typography variant="caption" color="text.secondary" sx={{
              display: 'block',
              textAlign: 'center',
              '@media print': {
                display: 'none'
              }
            }}>
              {pageBreakContent.content.type === 'section' ? 'Section Break' : 'Page Break'}
            </Typography>
          </Box>
        );
        
      case 'toc':
        // Table of Contents is typically generated when printing
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="h3">
              {(content as TocReportContent).content.title || 'Table of Contents'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Table of Contents will be generated in the final PDF)
            </Typography>
          </Box>
        );
        
      default:
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Unknown content type: {content.content_type}
            </Typography>
          </Box>
        );
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !report) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load report'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={handleBackToList}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="report-view" sx={{ '@media print': { px: 0 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        '@media print': {
          display: 'none'
        }
      }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBackToList}
        >
          Back to Reports
        </Button>
        <Box>
          <Tooltip title="Edit Report">
            <IconButton onClick={handleEditReport} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Report">
            <IconButton onClick={handleShareReport} sx={{ mr: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton 
              onClick={handleDownloadReport} 
              sx={{ mr: 1 }}
              disabled={exportingPDF}
              aria-label="Download report as PDF"
            >
              {exportingPDF ? <CircularProgress size={24} /> : <DownloadIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrintReport}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Paper sx={{ p: 4, mb: 3 }} elevation={2}>
        <Grid container spacing={2}>
          {report.metadata?.company_logo && (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <img 
                src={report.metadata.company_logo}
                alt="Company Logo"
                style={{ maxHeight: '60px', maxWidth: '200px' }}
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="h4" component="h1">
              {report.title}
            </Typography>
            
            {report.description && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                {report.description}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
              <Chip 
                label={reportTypeLabels[report.type] || report.type} 
                color={reportTypeColors[report.type] as any || 'default'}
                variant="outlined"
              />
              <Chip 
                label={reportStatusLabels[report.status] || report.status} 
                color={reportStatusColors[report.status] as any || 'default'}
              />
              {report.is_template && <Chip label="Template" variant="outlined" />}
              {report.is_public && <Chip label="Public" variant="outlined" />}
            </Box>
          </Grid>
          
          {report.metadata && (
            <Grid item xs={12}>
              {report.metadata.cover_image && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <img 
                    src={report.metadata.cover_image}
                    alt="Report Cover"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                  />
                </Box>
              )}
            
              <Grid container spacing={2}>
                {report.metadata.client_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Client:</strong> {report.metadata.client_name}
                    </Typography>
                  </Grid>
                )}
                
                {report.metadata.facility_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Facility:</strong> {report.metadata.facility_name}
                    </Typography>
                  </Grid>
                )}
                
                {report.metadata.audit_date && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Audit Date:</strong> {new Date(report.metadata.audit_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                
                {report.metadata.auditor_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Auditor:</strong> {report.metadata.auditor_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {report.metadata.executive_summary && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Executive Summary</Typography>
                  <Typography variant="body1">
                    {report.metadata.executive_summary}
                  </Typography>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 4 }} elevation={2}>
        <Box className="report-content">
          {!report.contents || report.contents.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center">
              This report has no content.
            </Typography>
          ) : (
            report.contents.sort((a, b) => a.order_index - b.order_index).map((content, index) => 
              renderContent(content, index)
            )
          )}
        </Box>
      </Paper>
      
      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        '@media print': {
          display: 'none'
        }
      }}>
        <Typography variant="body2" color="text.secondary">
          Created: {formatDate(report.created_at)} | Last Updated: {formatDate(report.updated_at)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Version: {report.version}
        </Typography>
      </Box>
    </Box>
  );
};

// Chart renderer component with caching
const ChartRenderer: React.FC<{
  chartId: string;
  chartType: string;
  data: any;
  options: any;
}> = ({ chartId, chartType, data, options }) => {
  useEffect(() => {
    let chartInstance: Chart | null = null;
    
    // Create the chart after component mounts
    const createChart = () => {
      const canvas = document.getElementById(chartId) as HTMLCanvasElement;
      if (!canvas) {
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      
      // Check cache first
      const cacheKey = `${chartId}-${chartType}`;
      const cachedChart = chartCache[cacheKey];
      
      // Generate chart data
      const chartData = data && Object.keys(data).length > 0 ? data : getSampleData(chartType);
      const chartOptions = options && Object.keys(options).length > 0 ? options : getDefaultOptions(chartType);
      
      // If we have a cached chart with the same data, reuse it
      if (cachedChart && 
          JSON.stringify(cachedChart.data) === JSON.stringify(chartData) && 
          JSON.stringify(cachedChart.options) === JSON.stringify(chartOptions)) {
        
        console.log('Using cached chart instance:', cacheKey);
        chartInstance = cachedChart.instance;
        
        // Update the timestamp
        chartCache[cacheKey].timestamp = Date.now();
        
        // If the chart instance was destroyed, recreate it
        if (!chartInstance) {
          chartInstance = new Chart(ctx, {
            type: chartType as keyof ChartTypeRegistry,
            data: chartData,
            options: chartOptions
          });
          
          // Update the cache
          chartCache[cacheKey].instance = chartInstance;
        }
        
        return;
      }
      
      // Destroy existing chart instance if it exists
      if (cachedChart && cachedChart.instance) {
        cachedChart.instance.destroy();
      }
      
      // Create new chart
      chartInstance = new Chart(ctx, {
        type: chartType as keyof ChartTypeRegistry,
        data: chartData,
        options: chartOptions
      });
      
      // Cache the chart
      chartCache[cacheKey] = {
        instance: chartInstance,
        data: chartData,
        options: chartOptions,
        timestamp: Date.now()
      };
    };
    
    createChart();
    
    // Cleanup chart instance on unmount
    return () => {
      // We don't destroy the chart instance on unmount to maintain cache
      // The chart instances will be cleaned up when the cache is cleared
      // or when a new chart with the same ID is created
    };
  }, [chartId, chartType, data, options]);
  
  return null;
};

// Clean up chart cache (call this periodically or on component unmount)
const cleanupChartCache = () => {
  const now = Date.now();
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  
  Object.keys(chartCache).forEach(key => {
    // If the chart hasn't been used in 30 minutes, destroy it and remove from cache
    if (now - chartCache[key].timestamp > CACHE_TTL) {
      const instance = chartCache[key]?.instance;
      if (instance) {
        instance.destroy();
      }
      delete chartCache[key];
    }
  });
};

// Generate sample data for chart preview
const getSampleData = (chartType: string) => {
  const labels = ['January', 'February', 'March', 'April', 'May', 'June'];
  
  switch (chartType) {
    case 'bar':
      return {
        labels,
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ]
      };
      
    case 'line':
      return {
        labels,
        datasets: [
          {
            label: 'Energy Cost ($)',
            data: [12, 19, 3, 5, 2, 3],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      };
      
    case 'pie':
    case 'doughnut':
      return {
        labels: ['Lighting', 'HVAC', 'Equipment', 'Other'],
        datasets: [
          {
            data: [30, 40, 20, 10],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
      
    default:
      return {
        labels,
        datasets: [
          {
            label: 'Data',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
          }
        ]
      };
  }
};

// Default chart options
const getDefaultOptions = (chartType: string) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title'
      }
    }
  };
  
  switch (chartType) {
    case 'bar':
    case 'line':
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };
      
    case 'pie':
    case 'doughnut':
      return baseOptions;
      
    default:
      return baseOptions;
  }
};

export default ReportView; 