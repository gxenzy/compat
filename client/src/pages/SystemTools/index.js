import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  BuildCircle,
  Memory,
  Storage,
  Speed,
  Check,
  CloudUpload,
  CloudDownload,
  Refresh
} from '@mui/icons-material';

const SystemTools = () => {
  const [toolStatus, setToolStatus] = useState({
    optimize: {
      id: 'optimize',
      running: false,
      progress: 0,
    },
    analyze: {
      id: 'analyze',
      running: false,
      progress: 0,
    },
    backup: {
      id: 'backup',
      running: false,
      progress: 0,
    },
  });

  const runTool = async (toolId, duration = 2000) => {
    if (toolStatus[toolId].running) return;
    
    setToolStatus(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        running: true,
        progress: 0,
        result: undefined,
        message: undefined
      }
    }));
    
    const interval = setInterval(() => {
      setToolStatus(prev => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          progress: Math.min(prev[toolId].progress + 5, 100)
        }
      }));
    }, duration / 20);
    
    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);
    
    const success = Math.random() > 0.2;
    setToolStatus(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        running: false,
        progress: 100,
        result: success ? 'success' : 'error',
        message: success
          ? 'Operation completed successfully'
          : 'An error occurred during operation'
      }
    }));
  };

  const renderToolCard = (title, description, icon, toolId, actions) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>{icon}</Box>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
          </Box>
        </Box>

        {toolStatus[toolId].running && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={toolStatus[toolId].progress} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Progress: {Math.round(toolStatus[toolId].progress)}%
            </Typography>
          </Box>
        )}

        {toolStatus[toolId].result && (
          <Alert severity={toolStatus[toolId].result} sx={{ mb: 2 }}>
            {toolStatus[toolId].message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              color={action.color || 'primary'}
              startIcon={action.icon}
              onClick={action.onClick}
              disabled={toolStatus[toolId].running}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Tools
      </Typography>

      <Grid container spacing={3}>
        {/* System Optimization */}
        <Grid item xs={12} md={6}>
          {renderToolCard(
            'System Optimization',
            'Optimize system performance and clean up temporary files',
            <BuildCircle color="primary" sx={{ fontSize: 40 }} />,
            'optimize',
            [
              {
                label: 'Run Optimization',
                icon: <Speed />,
                onClick: () => runTool('optimize'),
              },
            ]
          )}
        </Grid>

        {/* System Analysis */}
        <Grid item xs={12} md={6}>
          {renderToolCard(
            'System Analysis',
            'Analyze system health and generate reports',
            <Memory color="secondary" sx={{ fontSize: 40 }} />,
            'analyze',
            [
              {
                label: 'Run Analysis',
                icon: <Check />,
                onClick: () => runTool('analyze', 3000),
              },
              {
                label: 'Export Report',
                icon: <CloudUpload />,
                onClick: () => console.log('Export report'),
                color: 'secondary',
              },
            ]
          )}
        </Grid>

        {/* Database Tools */}
        <Grid item xs={12}>
          {renderToolCard(
            'Database Management',
            'Manage database operations and maintenance',
            <Storage color="info" sx={{ fontSize: 40 }} />,
            'backup',
            [
              {
                label: 'Backup Database',
                icon: <CloudUpload />,
                onClick: () => runTool('backup'),
              },
              {
                label: 'Import Data',
                icon: <CloudDownload />,
                onClick: () => console.log('Import data'),
                color: 'secondary',
              },
              {
                label: 'Sync Data',
                icon: <Refresh />,
                onClick: () => console.log('Sync data'),
                color: 'secondary',
              },
            ]
          )}
        </Grid>
      </Grid>

      {/* System Status */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Speed color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="System Performance"
                secondary="CPU Usage: 45% | Memory Usage: 60%"
              />
              <Chip label="Good" color="success" size="small" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Storage color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Database Status"
                secondary="Last Backup: 2 hours ago"
              />
              <Chip label="Healthy" color="success" size="small" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Memory color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Storage Status"
                secondary="Used: 75% | Available: 25%"
              />
              <Chip label="Warning" color="warning" size="small" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemTools;
