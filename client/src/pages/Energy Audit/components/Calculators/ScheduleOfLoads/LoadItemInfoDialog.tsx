import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  Divider,
  Alert,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ElectricalServices as ElectricalServicesIcon,
  Speed as SpeedIcon,
  Close as CloseIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { LoadItem } from './types';
import { checkLoadItemCompliance, recommendCircuitComponents } from '../utils/pecComplianceUtils';

interface LoadItemInfoDialogProps {
  open: boolean;
  onClose: () => void;
  loadItem: LoadItem | null;
}

const LoadItemInfoDialog: React.FC<LoadItemInfoDialogProps> = ({ open, onClose, loadItem }) => {
  const [showCompliance, setShowCompliance] = useState(false);
  
  // Return early if no load item
  if (!loadItem) {
    return null;
  }
  
  // Calculate PEC compliance if not already set
  const compliance = loadItem.pecCompliance || 
    checkLoadItemCompliance(loadItem, 230); // Default to 230V if not known
    
  // Get recommended circuit components
  const isLighting = loadItem.circuitDetails?.type === 'lighting';
  const recommendations = recommendCircuitComponents(
    loadItem.current || 0,
    isLighting,
    loadItem.circuitDetails?.wireType?.includes('COPPER') ? 'copper' : 'aluminum'
  );
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Load Item Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5">
              {loadItem.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1">
                    {loadItem.quantity}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                  <Typography variant="body1">
                    {loadItem.rating} W
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Demand Factor
                  </Typography>
                  <Typography variant="body1">
                    {typeof loadItem.demandFactor === 'number' ? loadItem.demandFactor.toFixed(2) : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Connected Load
                  </Typography>
                  <Typography variant="body1">
                    {typeof loadItem.connectedLoad === 'number' ? loadItem.connectedLoad.toFixed(1) : 'N/A'} W
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Demand Load
                  </Typography>
                  <Typography variant="body1">
                    {typeof loadItem.demandLoad === 'number' ? loadItem.demandLoad.toFixed(1) : 'N/A'} W
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current
                  </Typography>
                  <Typography variant="body1">
                    {loadItem.current?.toFixed(2) || 'N/A'} A
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Circuit Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Circuit Breaker
                  </Typography>
                  <Typography variant="body1">
                    {loadItem.circuitBreaker || 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Conductor Size
                  </Typography>
                  <Typography variant="body1">
                    {loadItem.conductorSize || 'Not specified'}
                  </Typography>
                </Grid>
                
                {loadItem.circuitDetails?.type && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Circuit Type
                    </Typography>
                    <Typography variant="body1">
                      {loadItem.circuitDetails.type.charAt(0).toUpperCase() + loadItem.circuitDetails.type.slice(1)}
                    </Typography>
                  </Grid>
                )}
                
                {loadItem.circuitDetails?.poles && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Poles
                    </Typography>
                    <Typography variant="body1">
                      {loadItem.circuitDetails.poles}
                    </Typography>
                  </Grid>
                )}
                
                {loadItem.circuitDetails?.phase && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phase
                    </Typography>
                    <Typography variant="body1">
                      {loadItem.circuitDetails.phase}
                    </Typography>
                  </Grid>
                )}
                
                {loadItem.voltageDropPercent !== undefined && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Voltage Drop
                    </Typography>
                    <Typography variant="body1">
                      {typeof loadItem.voltageDropPercent === 'number' ? loadItem.voltageDropPercent.toFixed(2) : 'N/A'}%
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          {/* PEC Compliance Section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                PEC 2017 Compliance
              </Typography>
              <Chip
                icon={compliance.isCompliant ? <CheckCircleIcon /> : <WarningIcon />}
                label={compliance.isCompliant ? 'Compliant' : 'Non-Compliant'}
                color={compliance.isCompliant ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
            
            {!compliance.isCompliant && compliance.issues.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Compliance Issues:
                </Typography>
                <List dense>
                  {compliance.issues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WarningIcon color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
            
            {compliance.recommendations.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Recommendations:
                </Typography>
                <List dense>
                  {compliance.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BuildIcon color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recommended Circuit Components
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Recommended Breaker
                  </Typography>
                  <Typography variant="body1">
                    {recommendations.breakerSize}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Recommended Conductor
                  </Typography>
                  <Typography variant="body1">
                    {recommendations.conductorSize || 'N/A'}
                  </Typography>
                </Grid>
                
                {loadItem.current && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Required Current Capacity (with safety factors)
                    </Typography>
                    <Typography variant="body1">
                      {(loadItem.current * (isLighting ? 1.25 : 1)).toFixed(2)} A
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoadItemInfoDialog; 