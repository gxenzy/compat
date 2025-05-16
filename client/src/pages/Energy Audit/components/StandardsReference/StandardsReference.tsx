import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  List,
  ListItem,
  Chip,
  IconButton
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import axios from 'axios';
import IlluminationLookup from './IlluminationLookup';
import StandardsBrowser from './StandardsBrowser';
import SectionViewer from './SectionViewer';
import StandardsSearch from './StandardsSearch';
import ComplianceChecker from './ComplianceChecker';
import { API_BASE_URL } from '../../../../utils/apiConfig';

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
      id={`standards-tabpanel-${index}`}
      aria-labelledby={`standards-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `standards-tab-${index}`,
    'aria-controls': `standards-tabpanel-${index}`,
  };
}

interface Standard {
  id: number;
  code_name: string;
  full_name: string;
  version: string;
  issuing_body: string;
  description: string;
}

interface BookmarkData {
  id: number;
  section_id: number;
  section_number: string;
  title: string;
  standard_id: number;
  code_name: string;
  full_name: string;
}

const StandardsReference: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  useEffect(() => {
    const fetchStandards = async () => {
      setLoading(true);
      try {
        // Use direct connection to backend server with API_BASE_URL
        const response = await axios.get(`${API_BASE_URL}/standards`);
        setStandards(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching standards:', err);
        setError('Failed to load standards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandards();
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    // In a real app, this would fetch from the server
    // For demo purposes, use localStorage
    const bookmarkIds = JSON.parse(localStorage.getItem('standardBookmarks') || '[]');
    
    // Get bookmark details from localStorage if available
    const bookmarksDetails = JSON.parse(localStorage.getItem('standardBookmarksDetails') || '[]');
    
    setBookmarks(bookmarksDetails);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear selected section when changing tabs
    if (newValue !== 1 && newValue !== 2) {
      setSelectedSectionId(null);
    }
    
    // Refresh bookmarks when switching to the bookmarks tab
    if (newValue === 3) {
      loadBookmarks();
    }
  };

  const handleSectionSelect = (sectionId: number) => {
    setSelectedSectionId(sectionId);
    // If not on the Browse or Bookmarks tab, switch to Browse
    if (tabValue !== 1 && tabValue !== 3) {
      setTabValue(1);
    }
  };

  const handleBookmarkSelect = (bookmarkData: BookmarkData) => {
    setSelectedSectionId(bookmarkData.section_id);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <MenuBookIcon sx={{ mr: 1, verticalAlign: 'top' }} />
          Standards Reference
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Access Philippine Electrical Code (PEC) and other relevant standards for energy auditing and compliance verification.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="standards reference tabs"
        >
          <Tab icon={<LightbulbIcon />} label="Illumination" {...a11yProps(0)} />
          <Tab icon={<AccountTreeIcon />} label="Browse Standards" {...a11yProps(1)} />
          <Tab icon={<SearchIcon />} label="Search Standards" {...a11yProps(2)} />
          <Tab icon={<BookmarkIcon />} label="Bookmarks" {...a11yProps(3)} />
          <Tab icon={<VerifiedIcon />} label="Compliance" {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <IlluminationLookup />
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Illumination Requirements
            </Typography>
            <Typography variant="body2" paragraph>
              The Philippine Electrical Code (PEC) 2017 specifies minimum illumination levels for various spaces in Rule 1075. These
              requirements ensure adequate lighting for comfort, safety, and productivity while promoting energy efficiency.
            </Typography>
            <Typography variant="body2" paragraph>
              The lookup tool above allows you to find the required illumination level for different space types. When conducting
              an energy audit, measure actual illumination levels using a lux meter and compare against these standards.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Common Illumination Terms:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography variant="body2" component="li">
                <strong>Lux (lx):</strong> The unit of illuminance, measuring light intensity on a surface.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>Luminous Flux (Lumens):</strong> The total amount of light emitted by a source.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>Efficacy (lm/W):</strong> A measure of how efficiently a light source produces visible light.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>Uniformity Ratio:</strong> The ratio between minimum and average illuminance in a space.
              </Typography>
            </Box>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading && !selectedSectionId ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error && !selectedSectionId ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <StandardsBrowser onSectionSelect={handleSectionSelect} />
              </Grid>
              <Grid item xs={12} md={8}>
                {selectedSectionId ? (
                  <SectionViewer sectionId={selectedSectionId} />
                ) : (
                  <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography color="textSecondary">
                      Select a section from the browser to view its content
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <StandardsSearch onSectionSelect={handleSectionSelect} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Bookmarks
            </Typography>
            {bookmarks.length === 0 ? (
              <Alert severity="info">
                You haven't bookmarked any standards sections yet. Browse standards and use the bookmark icon to save sections for quick access.
              </Alert>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search your bookmarks..."
                    variant="outlined"
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    onChange={(e) => {
                      // Local search functionality
                      const searchTerm = e.target.value.toLowerCase();
                      if (!searchTerm) {
                        loadBookmarks(); // Reset to all bookmarks
                        return;
                      }
                      
                      const allBookmarks = JSON.parse(localStorage.getItem('standardBookmarksDetails') || '[]');
                      const filtered = allBookmarks.filter((bookmark: BookmarkData) => 
                        bookmark.title.toLowerCase().includes(searchTerm) || 
                        bookmark.section_number.toLowerCase().includes(searchTerm) ||
                        bookmark.code_name.toLowerCase().includes(searchTerm)
                      );
                      setBookmarks(filtered);
                    }}
                  />
                </Box>
              
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ borderRight: { xs: 0, md: 1 }, borderColor: 'divider', pr: { xs: 0, md: 2 }, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Saved Bookmarks ({bookmarks.length})
                      </Typography>
                      <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                        {bookmarks.map((bookmark) => (
                          <ListItem 
                            key={bookmark.id}
                            disablePadding
                            sx={{ 
                              mb: 1,
                              bgcolor: selectedSectionId === bookmark.section_id ? 'action.selected' : 'background.paper',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Box
                              sx={{ 
                                p: 2, 
                                width: '100%',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleBookmarkSelect(bookmark)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Chip 
                                  size="small" 
                                  label={bookmark.code_name} 
                                  sx={{ mr: 1, fontWeight: 'bold' }} 
                                  color="primary"
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {bookmark.section_number}
                                </Typography>
                              </Box>
                              
                              <Typography 
                                variant="subtitle2"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {bookmark.title}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Remove bookmark
                                    const bookmarks = JSON.parse(localStorage.getItem('standardBookmarks') || '[]');
                                    const updatedBookmarks = bookmarks.filter((id: number) => id !== bookmark.section_id);
                                    localStorage.setItem('standardBookmarks', JSON.stringify(updatedBookmarks));
                                    
                                    // Remove from bookmark details
                                    const bookmarksDetails = JSON.parse(localStorage.getItem('standardBookmarksDetails') || '[]');
                                    const updatedDetails = bookmarksDetails.filter((b: any) => b.section_id !== bookmark.section_id);
                                    localStorage.setItem('standardBookmarksDetails', JSON.stringify(updatedDetails));
                                    
                                    // Update UI
                                    setBookmarks(updatedDetails);
                                    
                                    // Show notification
                                    const snackDiv = document.createElement('div');
                                    snackDiv.textContent = 'Bookmark removed';
                                    window.setTimeout(() => snackDiv.remove(), 3000);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    {selectedSectionId ? (
                      <SectionViewer sectionId={selectedSectionId} />
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '300px',
                        bgcolor: 'background.default',
                        borderRadius: 1,
                      }}>
                        <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary">
                          Select a bookmark to view its content
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <ComplianceChecker />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StandardsReference; 