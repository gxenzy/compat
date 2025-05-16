import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { RoomDetail } from '../interfaces/buildingInterfaces';

// Available room types
const ROOM_TYPES = [
  'office',
  'classroom',
  'conference',
  'restroom',
  'kitchen',
  'storage',
  'electrical',
  'hallway',
  'server',
  'reception',
  'lobby',
  'laboratory',
  'utility'
];

interface RoomDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (room: RoomDetail) => void;
  room?: RoomDetail;
  floorId: string;
}

/**
 * RoomDialog Component
 * Dialog for creating or editing a room
 */
const RoomDialog: React.FC<RoomDialogProps> = ({ open, onClose, onSave, room, floorId }) => {
  // Initialize default empty room data
  const defaultRoomData: RoomDetail = {
    id: '',
    name: '',
    roomType: 'office',
    floor: floorId,
    length: 4,
    width: 3,
    height: 3,
    area: 12,
    capacity: 0,
    reflectanceCeiling: 0.7,
    reflectanceWalls: 0.5,
    reflectanceFloor: 0.2,
    maintenanceFactor: 0.8,
    requiredLux: 300,
    recommendedFixtures: 4,
    actualFixtures: 4,
    compliance: 100,
    coords: {
      x: 0,
      y: 0,
      width: 200,
      height: 150
    },
    shape: 'rect'
  };
  
  // Room data state
  const [roomData, setRoomData] = useState<RoomDetail>(defaultRoomData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Populate form with room data when editing
  useEffect(() => {
    if (room) {
      setRoomData({ ...room, floor: floorId });
    } else {
      // Generate a unique ID for new rooms
      setRoomData({
        ...defaultRoomData,
        id: `room-${Math.random().toString(36).substring(2, 9)}`,
        floor: floorId
      });
    }
  }, [room, floorId]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Calculate area when length or width changes
    if (name === 'length' || name === 'width') {
      const numValue = parseFloat(value) || 0;
      
      if (name === 'length') {
        const area = numValue * (roomData.width || 0);
        setRoomData(prev => ({ 
          ...prev, 
          [name]: numValue,
          area,
          // Update pixel dimensions as well
          coords: {
            ...prev.coords,
            width: numValue * 50 // 50px per meter
          }
        }));
      } else {
        const area = (roomData.length || 0) * numValue;
        setRoomData(prev => ({ 
          ...prev, 
          [name]: numValue,
          area,
          // Update pixel dimensions as well
          coords: {
            ...prev.coords,
            height: numValue * 50 // 50px per meter
          }
        }));
      }
    } else {
      // For other fields
      setRoomData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle dropdown changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setRoomData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle numeric inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setRoomData(prev => ({ ...prev, [name]: numValue }));
  };
  
  // Validate form before saving
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!roomData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    if (!roomData.length || roomData.length <= 0) {
      errors.length = 'Length must be greater than 0';
    }
    
    if (!roomData.width || roomData.width <= 0) {
      errors.width = 'Width must be greater than 0';
    }
    
    if (!roomData.height || roomData.height <= 0) {
      errors.height = 'Height must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      // Update area before saving
      const length = roomData.length || 0;
      const width = roomData.width || 0;
      const area = length * width;
      
      const updatedRoom = { 
        ...roomData, 
        area,
        // Ensure coords are set
        coords: roomData.coords || {
          x: 100,
          y: 100,
          width: length * 50,
          height: width * 50
        }
      };
      
      onSave(updatedRoom);
      onClose();
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {room ? 'Edit Room' : 'Add New Room'}
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight={500}>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Room Name"
              fullWidth
              value={roomData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="room-type-label">Room Type</InputLabel>
              <Select
                labelId="room-type-label"
                name="roomType"
                value={roomData.roomType}
                onChange={handleSelectChange}
                label="Room Type"
              >
                {ROOM_TYPES.map(type => (
                  <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Dimensions */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
              Room Dimensions
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="length"
              label="Length (m)"
              type="number"
              fullWidth
              value={roomData.length}
              onChange={handleNumberChange}
              error={!!formErrors.length}
              helperText={formErrors.length}
              InputProps={{ inputProps: { min: 0, step: 0.1 } }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="width"
              label="Width (m)"
              type="number"
              fullWidth
              value={roomData.width}
              onChange={handleNumberChange}
              error={!!formErrors.width}
              helperText={formErrors.width}
              InputProps={{ inputProps: { min: 0, step: 0.1 } }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="height"
              label="Height (m)"
              type="number"
              fullWidth
              value={roomData.height}
              onChange={handleNumberChange}
              error={!!formErrors.height}
              helperText={formErrors.height}
              InputProps={{ inputProps: { min: 0, step: 0.1 } }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Area (m²)"
              value={roomData.area.toFixed(2)}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="Calculated automatically"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="capacity"
              label="Capacity (persons)"
              type="number"
              fullWidth
              value={roomData.capacity || 0}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          {/* Lighting Properties */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
              Lighting Properties
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="requiredLux"
              label="Required Illuminance (lux)"
              type="number"
              fullWidth
              value={roomData.requiredLux}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="actualFixtures"
              label="Actual Light Fixtures"
              type="number"
              fullWidth
              value={roomData.actualFixtures}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="reflectanceCeiling"
              label="Ceiling Reflectance"
              type="number"
              fullWidth
              value={roomData.reflectanceCeiling}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="reflectanceWalls"
              label="Wall Reflectance"
              type="number"
              fullWidth
              value={roomData.reflectanceWalls}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              name="reflectanceFloor"
              label="Floor Reflectance"
              type="number"
              fullWidth
              value={roomData.reflectanceFloor}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
        >
          {room ? 'Update Room' : 'Create Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomDialog; 