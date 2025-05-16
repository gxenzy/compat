import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Grid,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import enhancedStandardsService from '../../services/EnhancedStandardsService';
import TagManagement from './TagManagement';

interface SectionData {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  content: string;
  parent_section_id: string | null;
  has_tables: boolean;
  has_figures: boolean;
  tables?: TableData[];
  figures?: FigureData[];
  compliance_requirements?: RequirementData[];
  educational_resources?: ResourceData[];
}

interface TableData {
  id: string;
  table_number: string;
  title: string;
  content: any;
  notes?: string;
}

interface FigureData {
  id: string;
  figure_number: string;
  title: string;
  image_path: string;
  caption?: string;
}

interface RequirementData {
  id: string;
  requirement_type: 'mandatory' | 'prescriptive' | 'performance';
  description: string;
  verification_method?: string;
  severity: 'critical' | 'major' | 'minor';
}

interface ResourceData {
  id: string;
  resource_type: 'video' | 'article' | 'case_study' | 'guide';
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`section-tabpanel-${index}`}
      aria-labelledby={`section-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface SectionViewerProps {
  sectionId: string | null;
  bookmarks: string[];
  onBookmarkToggle: (sectionId: string) => void;
}

const SectionViewer: React.FC<SectionViewerProps> = ({ 
  sectionId, 
  bookmarks = [],
  onBookmarkToggle 
}) => {
  const [section, setSection] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch section data when ID changes
  useEffect(() => {
    if (sectionId) {
      fetchSection(sectionId);
    } else {
      setSection(null);
    }
  }, [sectionId]);

  const fetchSection = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await enhancedStandardsService.getSectionById(id);
      setSection(data as SectionData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching section:', error);
      setError('Failed to load section. Please try again.');
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBookmarkToggle = () => {
    if (sectionId) {
      onBookmarkToggle(sectionId);
    }
  };

  const printSection = () => {
    window.print();
  };

  // Function to render table content from JSON
  const renderTableContent = (tableData: any) => {
    if (!tableData) return null;
    
    try {
      const data = typeof tableData === 'string' ? JSON.parse(tableData) : tableData;
      
      if (!data.headers || !data.rows) {
        return <Typography color="error">Invalid table format</Typography>;
      }
      
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              {data.headers.map((header: string, index: number) => (
                <TableCell key={index} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row: string[], rowIndex: number) => (
              <TableRow key={rowIndex}>
                {row.map((cell: string, cellIndex: number) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    } catch (error) {
      console.error('Error rendering table:', error);
      return <Typography color="error">Error parsing table data</Typography>;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'primary';
    }
  };

  if (!sectionId) {
    return (
      <Paper sx={{ p: 4, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a section to view its content
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 4, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, height: '100%' }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!section) {
    return (
      <Paper sx={{ p: 4, height: '100%' }}>
        <Alert severity="info">Section not found</Alert>
      </Paper>
    );
  }

  const isBookmarked = bookmarks.includes(sectionId);

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Section {section.section_number}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            {section.title}
          </Typography>
        </Box>
        <Box>
          <Tooltip title={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
            <IconButton onClick={handleBookmarkToggle}>
              {isBookmarked ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Print section">
            <IconButton onClick={printSection}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="section tabs">
        <Tab label="Content" id="section-tab-0" aria-controls="section-tabpanel-0" />
        {section.tables && section.tables.length > 0 && (
          <Tab label="Tables" id="section-tab-1" aria-controls="section-tabpanel-1" />
        )}
        {section.figures && section.figures.length > 0 && (
          <Tab label="Figures" id="section-tab-2" aria-controls="section-tabpanel-2" />
        )}
        {section.compliance_requirements && section.compliance_requirements.length > 0 && (
          <Tab label="Compliance" id="section-tab-3" aria-controls="section-tabpanel-3" />
        )}
        {section.educational_resources && section.educational_resources.length > 0 && (
          <Tab label="Resources" id="section-tab-4" aria-controls="section-tabpanel-4" />
        )}
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <div dangerouslySetInnerHTML={{ __html: section.content }} />
        <TagManagement sectionId={section.id} />
      </TabPanel>

      {/* Tables panel */}
      {section.tables && section.tables.length > 0 && (
        <TabPanel value={tabValue} index={1}>
          {section.tables.map((table) => (
            <Box key={table.id} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Table {table.table_number}: {table.title}
              </Typography>
              {renderTableContent(table.content)}
              {table.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Notes:</strong> {table.notes}
                </Typography>
              )}
            </Box>
          ))}
        </TabPanel>
      )}

      {/* Figures panel */}
      {section.figures && section.figures.length > 0 && (
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {section.figures.map((figure) => (
              <Grid item xs={12} md={6} key={figure.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="240"
                    image={figure.image_path}
                    alt={figure.title}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Figure {figure.figure_number}: {figure.title}
                    </Typography>
                    {figure.caption && (
                      <Typography variant="body2" color="text.secondary">
                        {figure.caption}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      )}

      {/* Compliance requirements panel */}
      {section.compliance_requirements && section.compliance_requirements.length > 0 && (
        <TabPanel value={tabValue} index={3}>
          <List>
            {section.compliance_requirements.map((requirement) => (
              <ListItem key={requirement.id} alignItems="flex-start">
                <ListItemIcon>
                  <InfoIcon color={getSeverityColor(requirement.severity) as any} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {requirement.requirement_type.charAt(0).toUpperCase() + requirement.requirement_type.slice(1)} Requirement
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" paragraph>
                        {requirement.description}
                      </Typography>
                      {requirement.verification_method && (
                        <Typography variant="body2">
                          <strong>Verification:</strong> {requirement.verification_method}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      )}

      {/* Educational resources panel */}
      {section.educational_resources && section.educational_resources.length > 0 && (
        <TabPanel value={tabValue} index={4}>
          <List>
            {section.educational_resources.map((resource) => (
              <ListItem key={resource.id} alignItems="flex-start">
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {resource.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" paragraph>
                        {resource.description}
                      </Typography>
                      {resource.difficulty && (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            backgroundColor:
                              resource.difficulty === 'beginner'
                                ? 'success.light'
                                : resource.difficulty === 'intermediate'
                                ? 'warning.light'
                                : 'error.light',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            mr: 1,
                          }}
                        >
                          {resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1)} level
                        </Typography>
                      )}
                      {resource.duration && (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            backgroundColor: 'default.light',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            mr: 1,
                          }}
                        >
                          Duration: {resource.duration}
                        </Typography>
                      )}
                      {resource.url && (
                        <Box sx={{ mt: 1 }}>
                          <Button 
                            component="a" 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            variant="outlined" 
                            size="small"
                          >
                            View Resource
                          </Button>
                        </Box>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      )}
    </Paper>
  );
};

export default SectionViewer; 