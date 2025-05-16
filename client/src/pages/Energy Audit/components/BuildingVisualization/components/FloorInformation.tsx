import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  Tooltip,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  Stack,
  Tab,
  Tabs,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  InfoOutlined,
  SquareFoot,
  Person,
  Room,
  CategoryOutlined,
  Check,
  Warning
} from '@mui/icons-material';
import { RoomDetail } from '../interfaces/buildingInterfaces';
import { getFloorById } from '../config/floorPlanConfig';

interface FloorInformationProps {
  floorId: string;
  rooms: RoomDetail[];
  selectedRoom: RoomDetail | null;
  onSelectRoom: (room: RoomDetail) => void;
  onAddRoom: () => void;
  onEditRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  isEditMode: boolean;
}

const FloorInformation: React.FC<FloorInformationProps> = ({
  floorId,
  rooms,
  selectedRoom,
  onSelectRoom,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  isEditMode
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [filterText, setFilterText] = useState('');
  
  // Get floor info
  const floorInfo = getFloorById(floorId);
  
  // Filter rooms based on search text
  const filteredRooms = rooms
    .filter(room => 
      room.name.toLowerCase().includes(filterText.toLowerCase()) ||
      room.roomType?.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Calculate floor statistics
  const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
  const averageCompliance = rooms.length > 0
    ? rooms.reduce((sum, room) => sum + (room.compliance || 0), 0) / rooms.length
    : 0;
  
  // Room type distribution for potential chart
  const roomTypes = rooms.reduce((acc, room) => {
    const type = room.roomType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Get compliance status icon
  const getComplianceIcon = (compliance: number) => {
    if (compliance >= 90) {
      return <Check fontSize="small" color="success" />;
    } else if (compliance >= 70) {
      return <Warning fontSize="small" color="warning" />;
    } else {
      return <Warning fontSize="small" color="error" />;
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText', 
        p: 2,
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}>
        <Typography variant="h6">
          {floorInfo?.name || `Floor ${floorId}`} Information
        </Typography>
        <Typography variant="body2" color="inherit">
          {floorInfo?.description || 'Floor plan details and room information'}
        </Typography>
      </Box>
      
      {/* Floor Statistics */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" color="primary">
                  {rooms.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rooms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" color="primary">
                  {totalArea.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  m²
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" color="primary">
                  {totalCapacity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacity
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: '48px',
            }
          }}
        >
          <Tab label="Rooms" />
          <Tab label="Selected Room" disabled={!selectedRoom} />
        </Tabs>
      </Box>
      
      {/* Room List Tab */}
      {tabValue === 0 && (
        <Box sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search rooms..."
            fullWidth
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ mb: 1 }}
          />
          
          {/* Room List */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 1
          }}>
            {filteredRooms.length > 0 ? (
              <List dense disablePadding>
                {filteredRooms.map((room, index) => (
                  <React.Fragment key={room.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      button 
                      selected={selectedRoom?.id === room.id}
                      onClick={() => onSelectRoom(room)}
                      sx={{
                        bgcolor: selectedRoom?.id === room.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: '120px' }}>
                              {room.name}
                            </Typography>
                            {getComplianceIcon(room.compliance || 0)}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {room.roomType || 'Unknown'} • {room.area.toFixed(1)} m²
                          </Typography>
                        }
                      />
                      
                      {isEditMode && (
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit Room">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => onEditRoom(room.id)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Room">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => onDeleteRoom(room.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filterText
                    ? 'No rooms match your search'
                    : 'No rooms on this floor'}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Add Room Button */}
          {isEditMode && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />}
              onClick={onAddRoom}
              fullWidth
              sx={{ mt: 2 }}
            >
              Add New Room
            </Button>
          )}
        </Box>
      )}
      
      {/* Selected Room Details Tab */}
      {tabValue === 1 && selectedRoom && (
        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {selectedRoom.name}
          </Typography>
          
          <Chip 
            label={selectedRoom.roomType || 'Unknown Type'} 
            color="primary" 
            size="small"
            icon={<CategoryOutlined />}
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Room Details
                  </Typography>
                  
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center">
                      <SquareFoot sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Area: {selectedRoom.area.toFixed(1)} m²
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Capacity: {selectedRoom.capacity || 'Not specified'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center">
                      <Room sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Position: X: {selectedRoom.coords.x.toFixed(0)}, Y: {selectedRoom.coords.y.toFixed(0)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center">
                      <InfoOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Dimensions: {selectedRoom.coords.width.toFixed(0)} × {selectedRoom.coords.height.toFixed(0)} px
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Compliance: {selectedRoom.compliance || 0}%
                      </Typography>
                      <Box 
                        sx={{ 
                          height: 8, 
                          bgcolor: 'background.default',
                          borderRadius: 5,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          sx={{ 
                            height: '100%', 
                            width: `${selectedRoom.compliance || 0}%`,
                            bgcolor: (selectedRoom.compliance || 0) >= 90
                              ? 'success.main'
                              : (selectedRoom.compliance || 0) >= 70
                                ? 'warning.main'
                                : 'error.main',
                            borderRadius: 5
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {isEditMode && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<Edit />}
                onClick={() => onEditRoom(selectedRoom.id)}
                fullWidth
              >
                Edit Room
              </Button>
              
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Delete />}
                onClick={() => onDeleteRoom(selectedRoom.id)}
                fullWidth
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default FloorInformation; 