import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  TipsAndUpdates as TipsIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkFilledIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandLess,
  ExpandMore,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import axios from 'axios';
import TagFilter from './TagFilter';
import { API_BASE_URL, STANDARDS_API, apiClient } from '../../../../utils/apiConfig';

interface SearchResult {
  id: number;
  title: string;
  section_number: string;
  content: string;
  standard_id: number;
  code_name: string;
  full_name: string;
  relevance?: number;
  tags?: { id: number; name: string }[];
}

interface StandardsSearchProps {
  onSectionSelect: (sectionId: number) => void;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  standardId: string;
  exactMatch: boolean;
  fields: string[];
  timestamp: number;
  saved: boolean;
  name?: string;
  tags?: number[];
}

const StandardsSearch: React.FC<StandardsSearchProps> = ({ onSectionSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [standards, setStandards] = useState<{id: number, code_name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInContent, setSearchInContent] = useState(true);
  const [searchInSectionNumber, setSearchInSectionNumber] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  
  // Search history and saved searches
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(true);
  const [recentSearchesOpen, setRecentSearchesOpen] = useState(true);
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('standardsSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Error parsing search history:', err);
      }
    }
  }, []);
  
  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('standardsSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  // Fetch standards list for filter dropdown
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await apiClient.get(`${API_BASE_URL}/standards`);
        setStandards(response.data);
      } catch (err) {
        console.error('Error fetching standards:', err);
        setError('Failed to load standards for filtering.');
      }
    };
    
    fetchStandards();
  }, []);
  
  // Add a search to history
  const addToSearchHistory = (
    query: string, 
    standardId: string, 
    exactMatch: boolean, 
    fields: string[],
    tags: number[] = []
  ) => {
    if (!query && !standardId && tags.length === 0) return;
    
    const newSearchItem: SearchHistoryItem = {
      id: `search_${Date.now()}`,
      query,
      standardId,
      exactMatch,
      fields,
      timestamp: Date.now(),
      saved: false,
      tags
    };
    
    // Filter out duplicate searches (same query, standard, and options)
    const updatedHistory = searchHistory.filter(item => 
      !(item.query === query && 
        item.standardId === standardId && 
        item.exactMatch === exactMatch && 
        JSON.stringify(item.fields) === JSON.stringify(fields) &&
        JSON.stringify(item.tags) === JSON.stringify(tags))
    );
    
    // Add new search to the beginning (most recent)
    setSearchHistory([newSearchItem, ...updatedHistory]);
  };
  
  // Save a search with a name
  const saveSearch = () => {
    if (!searchName.trim()) return;
    
    // Find the most recent search (should be at index 0)
    if (searchHistory.length > 0) {
      const updatedHistory = [...searchHistory];
      updatedHistory[0] = {
        ...updatedHistory[0],
        saved: true,
        name: searchName.trim()
      };
      
      setSearchHistory(updatedHistory);
      setSaveDialogOpen(false);
      setSearchName('');
    }
  };
  
  // Apply a search from history
  const applySearch = (search: SearchHistoryItem) => {
    setSearchTerm(search.query);
    setSelectedStandard(search.standardId);
    setExactMatch(search.exactMatch);
    
    // Set search fields
    setSearchInTitle(search.fields.includes('title'));
    setSearchInContent(search.fields.includes('content'));
    setSearchInSectionNumber(search.fields.includes('section_number'));
    
    // Set tags if available
    if (search.tags) {
      setSelectedTags(search.tags);
    } else {
      setSelectedTags([]);
    }
    
    // Close the drawer
    setHistoryDrawerOpen(false);
    
    // Execute the search
    handleSearch(search.query, search.standardId, search.exactMatch, search.fields, search.tags);
  };
  
  // Delete a search from history
  const deleteSearch = (searchId: string) => {
    setSearchHistory(searchHistory.filter(item => item.id !== searchId));
  };
  
  // Toggle saved status for a search
  const toggleSavedStatus = (searchId: string) => {
    setSearchHistory(searchHistory.map(item => 
      item.id === searchId 
        ? { ...item, saved: !item.saved } 
        : item
    ));
  };
  
  const handleSearch = async (
    searchQuery?: string, 
    standardId?: string, 
    isExactMatch?: boolean, 
    searchFields?: string[],
    tags?: number[]
  ) => {
    // Use provided parameters or current state
    const query = searchQuery !== undefined ? searchQuery : searchTerm;
    const standard = standardId !== undefined ? standardId : selectedStandard;
    const exact = isExactMatch !== undefined ? isExactMatch : exactMatch;
    const tagsToUse = tags !== undefined ? tags : selectedTags;
    
    let fields: string[] = [];
    if (searchFields) {
      fields = searchFields;
    } else {
      if (searchInTitle) fields.push('title');
      if (searchInContent) fields.push('content');
      if (searchInSectionNumber) fields.push('section_number');
    }
    
    if (!query && !standard && tagsToUse.length === 0) {
      setError('Please enter a search term, select a standard, or choose tags');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Build the search params
      const params: Record<string, any> = {};
      
      if (query) {
        params.q = query;
      }
      
      if (standard) {
        params.standardId = standard;
      }
      
      if (tagsToUse.length > 0) {
        params.tags = tagsToUse;
      }
      
      if (exact) {
        params.exactMatch = exact;
      }
      
      if (fields.length > 0) {
        params.fields = fields.join(',');
      }
      
      // Execute search
      const response = await apiClient.get(`${API_BASE_URL}/search/sections`, { params });
      
      setSearchResults(response.data);
      setSearchExecuted(true);
      
      // Add to search history
      addToSearchHistory(query, standard, exact, fields, tagsToUse);
    } catch (err) {
      console.error('Error executing search:', err);
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClear = () => {
    setSearchTerm('');
    setSelectedStandard('');
    setExactMatch(false);
    setSearchInTitle(true);
    setSearchInContent(true);
    setSearchInSectionNumber(true);
    setSelectedTags([]);
    setSearchResults([]);
    setSearchExecuted(false);
    setError(null);
  };
  
  const handleStandardChange = (event: SelectChangeEvent<string>) => {
    setSelectedStandard(event.target.value);
  };
  
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleTagsChange = (tags: number[]) => {
    setSelectedTags(tags);
  };
  
  const createSnippet = (content: string, term: string): string => {
    if (!term) return content.substring(0, 200) + '...';
    
    const lowerContent = content.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    // Find position of the search term
    const position = lowerContent.indexOf(lowerTerm);
    
    if (position === -1) {
      // Term not found, just return the start of the content
      return content.substring(0, 200) + '...';
    }
    
    // Calculate start and end positions for the snippet
    let start = Math.max(0, position - 100);
    let end = Math.min(content.length, position + term.length + 100);
    
    // Adjust to not cut words
    if (start > 0) {
      // Find the next space before the start
      const spaceBeforeStart = content.lastIndexOf(' ', start);
      if (spaceBeforeStart !== -1) {
        start = spaceBeforeStart + 1;
      }
    }
    
    if (end < content.length) {
      // Find the next space after the end
      const spaceAfterEnd = content.indexOf(' ', end);
      if (spaceAfterEnd !== -1) {
        end = spaceAfterEnd;
      }
    }
    
    // Create snippet with ellipsis if needed
    let snippet = '';
    
    if (start > 0) {
      snippet += '...';
    }
    
    snippet += content.substring(start, end);
    
    if (end < content.length) {
      snippet += '...';
    }
    
    return snippet;
  };
  
  const highlightTerm = (text: string, term: string): JSX.Element => {
    if (!term) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() 
            ? <mark key={i} style={{ backgroundColor: '#ffeb3b' }}>{part}</mark> 
            : part
        )}
      </>
    );
  };
  
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };
  
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const getStandardName = (standardId: string): string => {
    if (!standardId) return '';
    const standard = standards.find(s => s.id.toString() === standardId);
    return standard ? standard.code_name : '';
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <SearchIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">Search Standards</Typography>
          
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Search History">
              <IconButton onClick={() => setHistoryDrawerOpen(true)}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Filters">
              <IconButton onClick={toggleFilters}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          label="Search Standards"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          variant="outlined"
          placeholder="Enter keywords to search..."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm && (
                  <IconButton
                    aria-label="clear search"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        {filtersVisible && (
          <Box mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Standard</InputLabel>
                  <Select
                    value={selectedStandard}
                    onChange={handleStandardChange}
                    label="Filter by Standard"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>All Standards</em>
                    </MenuItem>
                    {standards.map((standard) => (
                      <MenuItem key={standard.id} value={standard.id.toString()}>
                        {standard.code_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Options
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exactMatch}
                          onChange={(e) => setExactMatch(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Exact Match"
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                      Search in:
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchInTitle}
                          onChange={(e) => setSearchInTitle(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Title"
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchInContent}
                          onChange={(e) => setSearchInContent(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Content"
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchInSectionNumber}
                          onChange={(e) => setSearchInSectionNumber(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Section Number"
                    />
                  </FormGroup>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Add Tag Filter component */}
            <Box mt={2}>
              <TagFilter onTagsChange={handleTagsChange} initialSelectedTags={selectedTags} />
            </Box>
          </Box>
        )}
        
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            Search
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
        </Box>
      </Paper>
      
      {/* Search Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : searchExecuted && searchResults.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No results found for your search criteria. Try broadening your search.
        </Alert>
      ) : searchResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
            </Typography>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() => setSaveDialogOpen(true)}
            >
              Save Search
            </Button>
          </Box>
          
          <List>
            {searchResults.map((result) => (
              <React.Fragment key={result.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={() => onSectionSelect(result.id)}
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="subtitle1" component="div">
                          {highlightTerm(result.section_number, searchTerm)}{' '}
                          {highlightTerm(result.title, searchTerm)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {result.code_name}{' - '}{result.full_name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'inline' }}
                        >
                          {highlightTerm(createSnippet(result.content, searchTerm), searchTerm)}
                        </Typography>
                        
                        {/* Display tags if available */}
                        {result.tags && result.tags.length > 0 && (
                          <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
                            <TagIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            {result.tags.map(tag => (
                              <Chip
                                key={tag.id}
                                label={tag.name}
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Add this tag to selected tags and search
                                  if (!selectedTags.includes(tag.id)) {
                                    const newTags = [...selectedTags, tag.id];
                                    setSelectedTags(newTags);
                                    handleSearch(searchTerm, selectedStandard, exactMatch, undefined, newTags);
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Save Search Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
      >
        <DialogTitle>Save Search</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Give this search a name to save it for future use.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Search Name"
            fullWidth
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={saveSearch} 
            color="primary"
            disabled={!searchName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Search History Drawer */}
      <Drawer
        anchor="right"
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Search History</Typography>
            <IconButton
              sx={{ ml: 'auto' }}
              onClick={() => setHistoryDrawerOpen(false)}
            >
              <ClearIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Saved Searches */}
          <Box mb={2}>
            <ListItemButton onClick={() => setSavedSearchesOpen(!savedSearchesOpen)}>
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary="Saved Searches" />
              {savedSearchesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={savedSearchesOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {searchHistory.filter(item => item.saved).length === 0 ? (
                  <ListItem sx={{ pl: 4 }}>
                    <ListItemText 
                      primary="No saved searches" 
                      primaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                ) : (
                  searchHistory
                    .filter(item => item.saved)
                    .map(item => (
                      <ListItem
                        key={item.id}
                        sx={{ pl: 4 }}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSearch(item.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        button
                        onClick={() => applySearch(item)}
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <>
                              {item.query && <span>Query: "{item.query}"</span>}
                              {item.standardId && <span> • Standard: {getStandardName(item.standardId)}</span>}
                              {item.tags && item.tags.length > 0 && <span> • Tags: {item.tags.length}</span>}
                            </>
                          }
                        />
                      </ListItem>
                    ))
                )}
              </List>
            </Collapse>
          </Box>
          
          {/* Recent Searches */}
          <Box>
            <ListItemButton onClick={() => setRecentSearchesOpen(!recentSearchesOpen)}>
              <ListItemIcon>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="Recent Searches" />
              {recentSearchesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={recentSearchesOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {searchHistory.filter(item => !item.saved).length === 0 ? (
                  <ListItem sx={{ pl: 4 }}>
                    <ListItemText 
                      primary="No recent searches" 
                      primaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                ) : (
                  searchHistory
                    .filter(item => !item.saved)
                    .slice(0, 10) // Show only the 10 most recent
                    .map(item => (
                      <ListItem
                        key={item.id}
                        sx={{ pl: 4 }}
                        secondaryAction={
                          <Box>
                            <IconButton 
                              edge="end" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSavedStatus(item.id);
                              }}
                            >
                              <StarBorderIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSearch(item.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        button
                        onClick={() => applySearch(item)}
                      >
                        <ListItemText
                          primary={
                            <>
                              {item.query ? `"${item.query}"` : "Standard/Tag Search"}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {formatDate(item.timestamp)}
                              </Typography>
                            </>
                          }
                          secondary={
                            <>
                              {item.standardId && <span>Standard: {getStandardName(item.standardId)}</span>}
                              {item.tags && item.tags.length > 0 && 
                                <span>{item.standardId ? ' • ' : ''}Tags: {item.tags.length}</span>
                              }
                            </>
                          }
                        />
                      </ListItem>
                    ))
                )}
              </List>
            </Collapse>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StandardsSearch; 
 
 