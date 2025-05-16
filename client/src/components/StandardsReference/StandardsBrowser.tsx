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
  Collapse
} from '@mui/material';
import { 
  Book as BookIcon,
  Article as ArticleIcon,
  Search as SearchIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import axios from 'axios';
import TagFilter from './TagFilter';
import enhancedStandardsService from '../../services/EnhancedStandardsService';

interface Standard {
  id: string;
  code_name: string;
  full_name: string;
  version: string;
  issuing_body: string;
}

interface Section {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  parent_section_id: string | null;
  has_tables: boolean;
  has_figures: boolean;
}

interface SearchResult {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  code_name: string;
  full_name: string;
}

interface BreadcrumbItem {
  id: string;
  title: string;
  isStandard?: boolean;
}

interface SearchFilters {
  tags: string[];
}

const StandardsBrowser: React.FC<{
  onSectionSelect: (sectionId: string) => void;
}> = ({ onSectionSelect }) => {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({ tags: [] });

  // Fetch standards on component mount
  useEffect(() => {
    fetchStandards();
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
  }, [searchQuery, filters.tags]);

  // Fetch all standards
  const fetchStandards = async () => {
    try {
      setLoading(true);
      const data = await enhancedStandardsService.getStandards();
      setStandards(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching standards:', error);
      setLoading(false);
    }
  };

  // Fetch sections for a standard
  const fetchSections = async (standardId: string, parentId: string | null = null) => {
    try {
      setLoading(true);
      const data = await enhancedStandardsService.getSections(standardId, parentId as string);
      setSections(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setLoading(false);
    }
  };

  // Search sections
  const searchSections = async (query: string) => {
    try {
      const options = {
        standardId: selectedStandard?.id,
        tags: filters.tags
      };
      
      const results = await enhancedStandardsService.searchSections(query, options);
      setSearchResults(results);
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
    // If section has tables or figures, view it
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
  };

  // Handle tag filter changes
  const handleTagFilterChange = (selectedTagIds: string[]) => {
    setFilters(prev => ({ ...prev, tags: selectedTagIds }));
    
    // If there's an active search, refresh it
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      searchSections(searchQuery);
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
            startAdornment: <SearchIcon color="action" />,
            endAdornment: isSearching ? <CircularProgress size={20} /> : null
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Tag filtering */}
        <TagFilter onFilterChange={handleTagFilterChange} />
      </Box>
      
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs separator="›">
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
                >
                  <ListItemIcon>
                    <ArticleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${result.section_number} ${result.title}`}
                    secondary={`${result.code_name}`}
                  />
                </ListItem>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                {isSearching ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography color="text.secondary">
                    No results found for "{searchQuery}"
                  </Typography>
                )}
              </Box>
            )}
          </List>
        ) : (
          // Standard browser
          <div>
            {!selectedStandard ? (
              // Standards list
              <List>
                {standards.map((standard) => (
                  <ListItem
                    key={standard.id}
                    button
                    onClick={() => handleStandardSelect(standard)}
                  >
                    <ListItemIcon>
                      <BookIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={standard.code_name}
                      secondary={`${standard.full_name} (${standard.version})`}
                    />
                    <ChevronRightIcon color="action" />
                  </ListItem>
                ))}
              </List>
            ) : (
              // List of sections
              <List>
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <ListItem
                      key={section.id}
                      button
                      onClick={() => handleSectionSelect(section)}
                      selected={section.id === selectedSectionId}
                    >
                      <ListItemIcon>
                        {section.has_tables || section.has_figures ? (
                          <ArticleIcon />
                        ) : (
                          section.id === selectedSectionId ? <FolderOpenIcon /> : <FolderIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${section.section_number} ${section.title}`}
                      />
                      <ChevronRightIcon color="action" />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography color="text.secondary">
                      No sections found
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </div>
        )}
      </Box>
    </Paper>
  );
};

export default StandardsBrowser; 