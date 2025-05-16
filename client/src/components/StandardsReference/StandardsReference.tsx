import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  Button,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StandardsBrowser from './StandardsBrowser';
import SectionViewer from './SectionViewer';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import enhancedStandardsService from '../../services/EnhancedStandardsService';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`standards-tabpanel-${index}`}
      aria-labelledby={`standards-tab-${index}`}
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

const StandardsReference: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<any>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [standards, setStandards] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>('standards-bookmarks', []);

  useEffect(() => {
    // Load standards for search filters
    const loadStandards = async () => {
      try {
        const standards = await enhancedStandardsService.getStandards();
        setStandards(standards);
      } catch (error) {
        console.error('Error loading standards:', error);
      }
    };
    loadStandards();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSectionId(sectionId);
  };

  const handleSearch = async (query: string, options: any = {}) => {
    setSearchQuery(query);
    setSearchOptions(options);
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await enhancedStandardsService.searchSections(query, options);
      setSearchResults(results);
      // Switch to search tab if we're not already there
      setActiveTab(1);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookmarkToggle = (sectionId: string) => {
    setBookmarks(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleViewSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setActiveTab(0); // Switch to browse tab to view the section
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Standards Reference System
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Browse and search electrical standards, building codes, and energy efficiency guidelines
      </Typography>
      
      {/* Search Bar - Always visible at the top */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <SearchBar 
          onSearch={handleSearch}
          standards={standards}
        />
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="standards reference tabs"
        >
          <Tab 
            icon={<MenuBookIcon />} 
            iconPosition="start" 
            label="Browse" 
            id="standards-tab-0"
            aria-controls="standards-tabpanel-0"
          />
          <Tab 
            icon={<SearchIcon />} 
            iconPosition="start" 
            label="Search Results" 
            id="standards-tab-1"
            aria-controls="standards-tabpanel-1"
          />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3} sx={{ height: 'calc(100vh - 300px)' }}>
          <Grid item xs={12} md={4}>
            <StandardsBrowser onSectionSelect={handleSectionSelect} />
          </Grid>
          <Grid item xs={12} md={8}>
            <SectionViewer 
              sectionId={selectedSectionId} 
              bookmarks={bookmarks}
              onBookmarkToggle={handleBookmarkToggle}
            />
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
          <SearchResults 
            results={searchResults}
            loading={isSearching}
            error={searchError}
            query={searchQuery}
            bookmarks={bookmarks}
            onBookmarkToggle={handleBookmarkToggle}
            onViewSection={handleViewSection}
          />
        </Box>
      </TabPanel>
    </Box>
  );
};

export default StandardsReference; 