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
  Alert,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  Info as InfoIcon,
  NoteAdd as NoteAddIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Link as LinkIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import { STANDARDS_API, apiClient } from '../../../../utils/apiConfig';

interface SectionData {
  id: number;
  standard_id: number;
  section_number: string;
  title: string;
  content: string;
  has_tables: boolean;
  has_figures: boolean;
  tables: TableData[];
  figures: FigureData[];
  compliance_requirements: RequirementData[];
  educational_resources: ResourceData[];
}

interface TableData {
  id: number;
  table_number: string;
  title: string;
  content: any;
  notes?: string;
}

interface FigureData {
  id: number;
  figure_number: string;
  title: string;
  image_path: string;
  caption?: string;
}

interface RequirementData {
  id: number;
  requirement_type: 'mandatory' | 'prescriptive' | 'performance';
  description: string;
  verification_method?: string;
  severity: 'critical' | 'major' | 'minor';
}

interface ResourceData {
  id: number;
  resource_type: 'video' | 'article' | 'case_study' | 'webinar' | 'guide' | 'tool';
  title: string;
  description?: string;
  url: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  tags?: string;
}

interface NoteData {
  id: number;
  user_id: number;
  section_id: number;
  note_text: string;
  created_at: string;
  updated_at: string;
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

const SectionViewer: React.FC<{
  sectionId: number | null;
}> = ({ sectionId }) => {
  const [section, setSection] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<NoteData[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock user ID (replace with actual user ID from auth context in real app)
  const currentUserId = 1;

  // Fetch section data when ID changes
  useEffect(() => {
    if (sectionId) {
      fetchSection(sectionId);
      fetchUserNotes(sectionId);
    } else {
      setSection(null);
      setUserNotes([]);
    }
    setTabValue(0);
  }, [sectionId]);

  // Check if section is bookmarked
  useEffect(() => {
    if (sectionId) {
      checkBookmarkStatus(sectionId);
    }
  }, [sectionId]);

  const checkBookmarkStatus = async (sectionId: number) => {
    try {
      // In a real app, this would be a server API call
      // For now, we'll simulate with localStorage
      const bookmarks = JSON.parse(localStorage.getItem('standardBookmarks') || '[]');
      setBookmarked(bookmarks.includes(sectionId));
      
      // With a real API, it would be:
      // const response = await axios.get(`/api/standards-api/users/${currentUserId}/bookmarks`);
      // const bookmarks = response.data;
      // setBookmarked(bookmarks.some(b => b.section_id === sectionId));
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const fetchSection = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(STANDARDS_API.SECTION_BY_ID(id));
      setSection(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching section:', error);
      setError('Failed to load section. Please try again.');
      setLoading(false);
    }
  };

  const fetchUserNotes = async (sectionId: number) => {
    try {
      // In a real app, this would fetch from the server API
      // For demo purposes, use localStorage
      const allNotes = JSON.parse(localStorage.getItem('standardNotes') || '[]');
      const sectionNotes = allNotes.filter((note: NoteData) => note.section_id === sectionId);
      
      // Sort by updated_at (newest first)
      sectionNotes.sort((a: NoteData, b: NoteData) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      
      setUserNotes(sectionNotes);
      
      // With a real API, it would be:
      // const response = await axios.get(`/api/standards-api/users/${currentUserId}/sections/${sectionId}/notes`);
      // setUserNotes(response.data);
    } catch (error) {
      console.error('Error fetching user notes:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleBookmark = async () => {
    try {
      if (!section) return;
      
      // In a real app, this would be a server API call
      // For demo purposes, we'll use localStorage
      const bookmarks = JSON.parse(localStorage.getItem('standardBookmarks') || '[]');
      const bookmarksDetails = JSON.parse(localStorage.getItem('standardBookmarksDetails') || '[]');
      
      if (bookmarked) {
        // Remove from bookmarks
        const updatedBookmarks = bookmarks.filter((id: number) => id !== section.id);
        localStorage.setItem('standardBookmarks', JSON.stringify(updatedBookmarks));
        
        // Remove from bookmark details
        const updatedDetails = bookmarksDetails.filter((b: any) => b.section_id !== section.id);
        localStorage.setItem('standardBookmarksDetails', JSON.stringify(updatedDetails));
        
        setBookmarked(false);
        showSnackbar('Bookmark removed');
      } else {
        // Add to bookmarks
        bookmarks.push(section.id);
        localStorage.setItem('standardBookmarks', JSON.stringify(bookmarks));
        
        // Add to bookmark details - get standard info if available
        const standardInfo = await getStandardInfo(section.standard_id);
        
        const newBookmark = {
          id: Date.now(), // Generate a unique ID
          section_id: section.id,
          section_number: section.section_number,
          title: section.title,
          standard_id: section.standard_id,
          code_name: standardInfo?.code_name || 'Unknown',
          full_name: standardInfo?.full_name || 'Unknown Standard'
        };
        
        bookmarksDetails.push(newBookmark);
        localStorage.setItem('standardBookmarksDetails', JSON.stringify(bookmarksDetails));
        
        setBookmarked(true);
        showSnackbar('Bookmark added');
      }
      
      // With a real API, it would be:
      // if (bookmarked) {
      //   await axios.delete(`/api/standards-api/users/${currentUserId}/bookmarks/${section.id}`);
      // } else {
      //   await axios.post(`/api/standards-api/users/${currentUserId}/bookmarks`, { section_id: section.id });
      // }
      // setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showSnackbar('Error updating bookmark');
    }
  };
  
  // Helper function to get standard information by ID
  const getStandardInfo = async (standardId: number) => {
    try {
      // In a real app, this would fetch from the server
      // For demo, we'll check if we already have it in the response
      if (section?.standard_id === standardId) {
        const response = await axios.get(`/api/standards-api/standards/${standardId}`);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching standard info:', error);
      return null;
    }
  };

  const addNote = async () => {
    if (!section || !newNoteText.trim()) return;
    
    try {
      // In a real app, this would be a server API call
      // For demo purposes, use localStorage
      const allNotes = JSON.parse(localStorage.getItem('standardNotes') || '[]');
      
      const newNote: NoteData = {
        id: Date.now(), // Generate a unique ID
        user_id: currentUserId,
        section_id: section.id,
        note_text: newNoteText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      allNotes.push(newNote);
      localStorage.setItem('standardNotes', JSON.stringify(allNotes));
      
      // Update the UI
      setUserNotes([newNote, ...userNotes]);
      setNewNoteText('');
      setIsAddingNote(false);
      showSnackbar('Note added successfully');
      
      // With a real API, it would be:
      // const response = await axios.post(`/api/standards-api/users/${currentUserId}/sections/${section.id}/notes`, {
      //   note_text: newNoteText.trim()
      // });
      // const newNote = response.data;
      // setUserNotes([newNote, ...userNotes]);
    } catch (error) {
      console.error('Error adding note:', error);
      showSnackbar('Error adding note');
    }
  };

  const startEditingNote = (note: NoteData) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note_text);
  };

  const updateNote = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    
    try {
      // In a real app, this would be a server API call
      // For demo purposes, use localStorage
      const allNotes = JSON.parse(localStorage.getItem('standardNotes') || '[]');
      
      // Find and update the note
      const updatedNotes = allNotes.map((note: NoteData) => {
        if (note.id === editingNoteId) {
          return {
            ...note,
            note_text: editingNoteText.trim(),
            updated_at: new Date().toISOString()
          };
        }
        return note;
      });
      
      localStorage.setItem('standardNotes', JSON.stringify(updatedNotes));
      
      // Update the UI
      const updatedUserNotes = userNotes.map(note => {
        if (note.id === editingNoteId) {
          return {
            ...note,
            note_text: editingNoteText.trim(),
            updated_at: new Date().toISOString()
          };
        }
        return note;
      });
      
      setUserNotes(updatedUserNotes);
      setEditingNoteId(null);
      setEditingNoteText('');
      showSnackbar('Note updated successfully');
      
      // With a real API, it would be:
      // await axios.put(`/api/standards-api/users/${currentUserId}/notes/${editingNoteId}`, {
      //   note_text: editingNoteText.trim()
      // });
    } catch (error) {
      console.error('Error updating note:', error);
      showSnackbar('Error updating note');
    }
  };

  const openDeleteDialog = (noteId: number) => {
    setNoteToDelete(noteId);
    setIsDeleteDialogOpen(true);
  };

  const deleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      // In a real app, this would be a server API call
      // For demo purposes, use localStorage
      const allNotes = JSON.parse(localStorage.getItem('standardNotes') || '[]');
      
      // Remove the note
      const updatedNotes = allNotes.filter((note: NoteData) => note.id !== noteToDelete);
      localStorage.setItem('standardNotes', JSON.stringify(updatedNotes));
      
      // Update the UI
      const updatedUserNotes = userNotes.filter(note => note.id !== noteToDelete);
      setUserNotes(updatedUserNotes);
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
      showSnackbar('Note deleted successfully');
      
      // With a real API, it would be:
      // await axios.delete(`/api/standards-api/users/${currentUserId}/notes/${noteToDelete}`);
    } catch (error) {
      console.error('Error deleting note:', error);
      showSnackbar('Error deleting note');
    }
  };

  const printSection = () => {
    window.print();
  };

  const copyLinkToClipboard = () => {
    if (!sectionId) return;
    
    const url = `${window.location.origin}/energy-audit/standards-reference?section=${sectionId}`;
    navigator.clipboard.writeText(url).then(
      () => {
        showSnackbar('Link copied to clipboard');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        showSnackbar('Failed to copy link');
      }
    );
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Render Notes Tab
  const renderNotesTab = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">My Notes</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<NoteAddIcon />}
            onClick={() => setIsAddingNote(true)}
            disabled={isAddingNote}
          >
            Add Note
          </Button>
        </Box>
        
        {isAddingNote && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="subtitle1" gutterBottom>
              Add a New Note
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your notes here..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteText('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={addNote}
                disabled={!newNoteText.trim()}
              >
                Save Note
              </Button>
            </Box>
          </Paper>
        )}
        
        {userNotes.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            You haven't added any notes for this section yet. Click "Add Note" to create your first note.
          </Alert>
        ) : (
          <Box>
            {userNotes.map((note) => (
              <Paper 
                key={note.id} 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  bgcolor: editingNoteId === note.id ? 'action.hover' : 'background.paper',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main'
                }}
              >
                {editingNoteId === note.id ? (
                  <>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      sx={{ mb: 2 }}
                      autoFocus
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={updateNote}
                        disabled={!editingNoteText.trim()}
                      >
                        Update Note
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word'
                      }}
                    >
                      {note.note_text}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 1,
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {formatDate(note.updated_at)}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit Note">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => startEditingNote(note)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Note">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => openDeleteDialog(note.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Note</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={deleteNote} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
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
        <Typography variant="h6" color="text.secondary">
          Section not found
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : section ? (
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                {section.section_number && (
                  <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                    {section.section_number}
                  </Box>
                )}
                {section.title}
              </Typography>
            </Box>
            <Box>
              <Tooltip title={bookmarked ? "Remove Bookmark" : "Bookmark This Section"}>
                <IconButton onClick={toggleBookmark} color={bookmarked ? "primary" : "default"}>
                  {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Print Section">
                <IconButton onClick={printSection}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy Link">
                <IconButton onClick={copyLinkToClipboard}>
                  <LinkIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Content" icon={<InfoIcon fontSize="small" />} id="section-tab-0" aria-controls="section-tabpanel-0" />
            {section.tables && section.tables.length > 0 && (
              <Tab label={`Tables (${section.tables.length})`} id="section-tab-1" aria-controls="section-tabpanel-1" />
            )}
            {section.figures && section.figures.length > 0 && (
              <Tab label={`Figures (${section.figures.length})`} id="section-tab-2" aria-controls="section-tabpanel-2" />
            )}
            {section.compliance_requirements && section.compliance_requirements.length > 0 && (
              <Tab label="Compliance" id="section-tab-3" aria-controls="section-tabpanel-3" />
            )}
            {section.educational_resources && section.educational_resources.length > 0 && (
              <Tab label="Resources" icon={<SchoolIcon fontSize="small" />} id="section-tab-4" aria-controls="section-tabpanel-4" />
            )}
            <Tab label={`Notes (${userNotes.length})`} icon={<NotesIcon fontSize="small" />} id="section-tab-5" aria-controls="section-tabpanel-5" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ whiteSpace: 'pre-wrap' }}>
              <Typography variant="body1" dangerouslySetInnerHTML={{ __html: section.content }} />
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {section.tables && section.tables.length > 0 ? (
              section.tables.map((table) => (
                <Box key={table.id} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {table.table_number}: {table.title}
                  </Typography>
                  {renderTableContent(table.content)}
                  {table.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Note: {table.notes}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography>No tables available for this section.</Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {section.figures && section.figures.length > 0 ? (
              section.figures.map((figure) => (
                <Card key={figure.id} sx={{ mb: 4 }}>
                  <CardMedia
                    component="img"
                    image={figure.image_path || '/placeholder-image.png'}
                    alt={figure.title}
                    sx={{ maxHeight: 400, objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {figure.figure_number}: {figure.title}
                    </Typography>
                    {figure.caption && (
                      <Typography variant="body2" color="text.secondary">
                        {figure.caption}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography>No figures available for this section.</Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            {section.compliance_requirements && section.compliance_requirements.length > 0 ? (
              <List>
                {section.compliance_requirements.map((req) => (
                  <ListItem key={req.id} sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <ListItemIcon>
                      <Chip 
                        label={req.requirement_type} 
                        color={req.requirement_type === 'mandatory' ? 'error' : req.requirement_type === 'prescriptive' ? 'warning' : 'info'}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={req.description}
                      secondary={
                        <>
                          {req.verification_method && (
                            <Typography variant="body2" component="span">
                              <strong>Verification:</strong> {req.verification_method}
                            </Typography>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              size="small"
                              label={req.severity}
                              sx={{ 
                                bgcolor: getSeverityColor(req.severity),
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No compliance requirements defined for this section.</Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            {section.educational_resources && section.educational_resources.length > 0 ? (
              <Grid container spacing={3}>
                {section.educational_resources.map((resource) => (
                  <Grid item xs={12} md={6} key={resource.id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        {resource.title}
                      </Typography>
                      {resource.description && (
                        <Typography variant="body2" paragraph>
                          {resource.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Chip 
                            size="small" 
                            label={resource.resource_type.replace('_', ' ')} 
                            sx={{ mr: 1, textTransform: 'capitalize' }}
                          />
                          {resource.difficulty && (
                            <Chip 
                              size="small" 
                              label={resource.difficulty} 
                              color={
                                resource.difficulty === 'beginner' ? 'success' :
                                resource.difficulty === 'intermediate' ? 'warning' : 'error'
                              }
                            />
                          )}
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<DownloadIcon />}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </Button>
                      </Box>
                      {resource.duration && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Duration: {resource.duration}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography>No educational resources available for this section.</Typography>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={5}>
            {renderNotesTab()}
          </TabPanel>
          
          {/* Snackbar for notifications */}
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={3000} 
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          />
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Select a section to view its details
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SectionViewer; 