import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  List,
  ListItem,
  Button,
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SectionIcon from '@mui/icons-material/Article';
import { useHistory } from 'react-router-dom';

// Define interface for search result
interface SearchResult {
  id: string;
  standard_id: string;
  section_number: string;
  title: string;
  content: string;
  code_name: string;
  full_name: string;
  relevance?: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  bookmarks: string[];
  onBookmarkToggle: (sectionId: string) => void;
  onViewSection: (sectionId: string) => void;
}

// Helper function to highlight search terms in text
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === searchTerm.toLowerCase() ? 
      <mark key={i} style={{ backgroundColor: '#FFEB3B', padding: 0 }}>{part}</mark> : 
      part
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  error,
  query,
  bookmarks = [],
  onBookmarkToggle,
  onViewSection,
}) => {
  const history = useHistory();

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">Error</Typography>
        <Typography>{error}</Typography>
      </Paper>
    );
  }

  // Handle empty results
  if (results.length === 0 && query) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>No results found</Typography>
        <Typography color="text.secondary">
          Try adjusting your search terms or filters
        </Typography>
      </Paper>
    );
  }

  // Render search results
  return (
    <Box>
      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Found {results.length} results for "{query}"
        </Typography>
      )}
      
      <List sx={{ p: 0 }}>
        {results.map((result) => (
          <Card key={result.id} sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Grid container spacing={2}>
                <Grid item xs={10}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={result.code_name} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ mr: 1 }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      {result.section_number}
                    </Typography>
                    {result.relevance !== undefined && (
                      <Chip
                        label={`Relevance: ${result.relevance}`}
                        size="small"
                        sx={{ ml: 1, bgcolor: 'background.default' }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    {highlightSearchTerm(result.title, query)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {highlightSearchTerm(result.content, query)}
                  </Typography>
                </Grid>
                
                <Grid item xs={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Button
                    startIcon={bookmarks.includes(result.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    onClick={() => onBookmarkToggle(result.id)}
                    size="small"
                    variant="text"
                    color={bookmarks.includes(result.id) ? "primary" : "inherit"}
                    sx={{ mb: 1 }}
                  >
                    {bookmarks.includes(result.id) ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  
                  <Button
                    startIcon={<SectionIcon />}
                    onClick={() => onViewSection(result.id)}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 'auto' }}
                  >
                    View Section
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );
};

export default SearchResults; 