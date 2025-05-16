import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  TextField,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Book as BookIcon,
  Article as ArticleIcon,
  Search as SearchIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Bookmark as BookmarkIcon,
  Clear as ClearIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { STANDARDS_API, apiClient } from '../../../../utils/apiConfig';

interface Standard {
  id: number;
  code_name: string;
  full_name: string;
  version: string;
  issuing_body: string;
}

interface Section {
  id: number;
  standard_id: number;
  section_number: string;
  title: string;
  parent_section_id: number | null;
  has_tables: boolean;
  has_figures: boolean;
}

interface SearchResult {
  id: number;
  standard_id: number;
  section_number: string;
  title: string;
  code_name: string;
  full_name: string;
}

interface BreadcrumbItem {
  id: number;
  title: string;
  isStandard?: boolean;
}

const StandardsBrowser: React.FC<{
  onSectionSelect: (sectionId: number) => void;
}> = ({ onSectionSelect }) => {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bookmarkedSections, setBookmarkedSections] = useState<number[]>([]);

  // Fetch standards on component mount
  useEffect(() => {
    fetchStandards();
    loadBookmarks();
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        searchSections(searchQuery);
      }, 500);
      
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Load user bookmarks
  const loadBookmarks = () => {
    const bookmarks = JSON.parse(localStorage.getItem('standardBookmarks') || '[]');
    setBookmarkedSections(bookmarks);
  };

  // Fetch all standards
  const fetchStandards = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(STANDARDS_API.STANDARDS);
      setStandards(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching standards:', error);
      setLoading(false);
    }
  };

  // Fetch sections for a standard
  const fetchSections = async (standardId: number, parentId: number | null = null) => {
    try {
      setLoading(true);
      const url = STANDARDS_API.SECTIONS_BY_STANDARD(standardId, parentId || undefined);
      const response = await apiClient.get(url);
      setSections(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setLoading(false);
    }
  };

  // Search sections
  const searchSections = async (query: string) => {
    try {
      const response = await apiClient.get(STANDARDS_API.SEARCH_SECTIONS(query));
      setSearchResults(response.data);
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching sections:', error);
      setIsSearching(false);
    }
  };

  // Handle standard selection
  const handleStandardSelect = (standard: Standard) => {
    setSelectedStandard(standard);
    setSelectedSectionId(null);
    fetchSections(standard.id);
    setBreadcrumbs([{ id: standard.id, title: standard.code_name, isStandard: true }]);
  };

  // Handle section selection
  const handleSectionSelect = (section: Section) => {
    // If section has content, tables, or figures, view it
    if (section.has_tables || section.has_figures) {
      setSelectedSectionId(section.id);
      onSectionSelect(section.id);
    } else {
      // Navigate to child sections
      fetchSections(selectedStandard!.id, section.id);
      setSelectedSectionId(section.id);
      
      // Update breadcrumbs
      setBreadcrumbs([
        ...breadcrumbs,
        { id: section.id, title: `${section.section_number} ${section.title}` }
      ]);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    onSectionSelect(result.id);
    
    // When selecting from search, also update the standard and breadcrumb context
    if (selectedStandard?.id !== result.standard_id) {
      const standard = standards.find(s => s.id === result.standard_id);
      if (standard) {
        setSelectedStandard(standard);
        setBreadcrumbs([
          { id: standard.id, title: standard.code_name, isStandard: true },
          { id: result.id, title: `${result.section_number} ${result.title}` }
        ]);
      }
    }
  };

  // Navigate to breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    
    const item = breadcrumbs[index];
    
    if (item.isStandard) {
      setSelectedSectionId(null);
      fetchSections(item.id);
    } else {
      const parentItem = index > 0 ? breadcrumbs[index - 1] : null;
      if (parentItem && parentItem.isStandard) {
        fetchSections(parentItem.id, item.id);
      }
      setSelectedSectionId(item.id);
    }
  };

  // Reset to standards list (home)
  const goToStandardsList = () => {
    setSelectedStandard(null);
    setSelectedSectionId(null);
    setBreadcrumbs([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Check if a section is bookmarked
  const isBookmarked = (sectionId: number) => {
    return bookmarkedSections.includes(sectionId);
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Standards Browser
        </Typography>
        <TextField
          fullWidth
          placeholder="Search standards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            endAdornment: searchQuery ? (
              <IconButton size="small" onClick={clearSearch}>
                <ClearIcon />
              </IconButton>
            ) : isSearching ? (
              <CircularProgress size={20} />
            ) : null
          }}
        />
      </Box>
      
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Back to all standards">
            <IconButton size="small" onClick={goToStandardsList} sx={{ mr: 1 }}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Breadcrumbs separator="›" sx={{ flexGrow: 1 }}>
            {breadcrumbs.map((item, index) => (
              <Link
                key={index}
                color="inherit"
                component="button"
                variant="body2"
                onClick={() => navigateToBreadcrumb(index)}
                sx={{ 
                  fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal',
                  textDecoration: 'none' 
                }}
              >
                {item.title}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : searchQuery.length >= 3 ? (
          // Search results
          <List>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <ListItem
                  key={result.id}
                  button
                  onClick={() => handleSearchResultSelect(result)}
                  sx={{
                    borderLeft: isBookmarked(result.id) ? '4px solid' : 'none',
                    borderColor: 'primary.main',
                    pl: isBookmarked(result.id) ? 1 : 2,
                  }}
                >
                  <ListItemIcon>
                    <ArticleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${result.section_number} ${result.title}`}
                    secondary={`${result.code_name}`}
                  />
                  {isBookmarked(result.id) && (
                    <BookmarkIcon color="primary" fontSize="small" />
                  )}
                </ListItem>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                {isSearching ? (
                  <Typography>Searching...</Typography>
                ) : (
                  <Typography>No results found</Typography>
                )}
              </Box>
            )}
          </List>
        ) : !selectedStandard ? (
          // Standards list
          <List>
            {standards.map((standard) => (
              <React.Fragment key={standard.id}>
                <ListItem 
                  button
                  onClick={() => handleStandardSelect(standard)}
                >
                  <ListItemIcon>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {standard.code_name}
                        <Chip 
                          label={standard.version} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={standard.full_name}
                  />
                  <ChevronRightIcon />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          // Sections list
          <List>
            {sections.length > 0 ? (
              sections.map((section) => (
                <React.Fragment key={section.id}>
                  <ListItem 
                    button 
                    onClick={() => handleSectionSelect(section)}
                    sx={{
                      borderLeft: isBookmarked(section.id) ? '4px solid' : 'none',
                      borderColor: 'primary.main',
                      pl: isBookmarked(section.id) ? 1 : 2,
                    }}
                  >
                    <ListItemIcon>
                      {section.has_tables || section.has_figures ? (
                        <ArticleIcon />
                      ) : (
                        selectedSectionId === section.id ? (
                          <FolderOpenIcon />
                        ) : (
                          <FolderIcon />
                        )
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${section.section_number} ${section.title}`}
                    />
                    {isBookmarked(section.id) && (
                      <BookmarkIcon color="primary" fontSize="small" />
                    )}
                    {!(section.has_tables || section.has_figures) && <ChevronRightIcon />}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography>No sections found</Typography>
              </Box>
            )}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default StandardsBrowser; 