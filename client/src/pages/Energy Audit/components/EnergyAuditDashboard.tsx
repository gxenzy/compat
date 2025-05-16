import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Container,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  MonetizationOn as MonetizationOnIcon,
  Add as AddIcon,
  ElectricalServices as ElectricalServicesIcon,
  AcUnit as AcUnitIcon,
  ViewInAr as ViewInArIcon,
  Rule as RuleIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const EnergyAuditDashboard: React.FC = () => {
  const history = useHistory();

  // Navigate to different sections of the energy audit system
  const navigateTo = (path: string) => {
    history.push(path);
  };

  // Main feature cards for the dashboard
  const featureCards = [
    {
      title: 'New Audit',
      description: 'Start a new energy audit process with our step-by-step wizard',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      path: '/energy-audit/wizard'
    },
    {
      title: 'Inspection Checklists',
      description: 'Standardized checklists for electrical and HVAC system inspections',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      path: '/energy-audit/checklists'
    },
    {
      title: 'Calculators',
      description: 'Tools to calculate energy consumption, savings, and ROI',
      icon: <CalculateIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      path: '/energy-audit/calculators'
    },
    {
      title: 'Findings Management',
      description: 'Track and manage issues identified during audits',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#f44336',
      path: '/energy-audit/findings'
    },
    {
      title: 'Standards Reference',
      description: 'Access PEC 2017 and other relevant standards',
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/energy-audit/standards'
    },
    {
      title: 'Learning Center',
      description: 'Educational resources about energy auditing',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#607d8b',
      path: '/energy-audit/learning'
    }
  ];

  // Recent activity mock data
  const recentActivities = [
    {
      id: 1,
      type: 'audit',
      title: 'Computer Laboratory Audit',
      date: '2023-11-20',
      status: 'In Progress',
      user: 'Juan Cruz'
    },
    {
      id: 2,
      type: 'finding',
      title: 'Excessive Ground Resistance at Main Panel',
      date: '2023-11-18',
      status: 'Open',
      user: 'Maria Santos'
    },
    {
      id: 3,
      type: 'checklist',
      title: 'Electrical Inspection - Admin Building',
      date: '2023-11-15',
      status: 'Completed',
      user: 'Carlos Reyes'
    }
  ];

  // Quick tips for energy auditing
  const quickTips = [
    'Always verify electrical measurements with calibrated instruments',
    'Compare energy consumption data to established benchmarks',
    'Document all findings with photos and measurements',
    'Prioritize recommendations based on ROI and implementation ease',
    'Ensure compliance with PEC 2017 and other relevant standards'
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Energy Audit System
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            A comprehensive tool for educational energy auditing at University of School Lapu-Lapu and Mandaue City
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<AddIcon />}
            onClick={() => navigateTo('/energy-audit/wizard')}
            sx={{ mr: 2 }}
          >
            Start New Audit
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => navigateTo('/energy-audit/learning')}
          >
            Learning Resources
          </Button>
        </Box>

        {/* Main Feature Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {featureCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardActionArea 
                  sx={{ height: '100%' }}
                  onClick={() => navigateTo(card.path)}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      pt: 2,
                      pb: 1
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: card.color,
                        width: 60,
                        height: 60
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" component="h2" align="center" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Activity */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {recentActivities.map((activity) => (
                  <ListItem 
                    key={activity.id}
                    button
                    sx={{ 
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <ListItemIcon>
                      {activity.type === 'audit' ? <BarChartIcon color="primary" /> :
                       activity.type === 'finding' ? <WarningIcon color="error" /> :
                       <CheckCircleIcon color="success" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={activity.title}
                      secondary={`${activity.date} • ${activity.status} • ${activity.user}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button variant="text">
                  View All Activity
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Tips */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Energy Audit Quick Tips
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {quickTips.map((tip, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* System Components Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Energy Audit System Components
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ElectricalServicesIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Electrical Systems
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Evaluate electrical distribution systems, lighting, power quality, and energy consumption
                    based on Philippine Electrical Code (PEC) 2017 standards.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AcUnitIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      HVAC Systems
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Assess heating, ventilation, and air conditioning systems for efficiency, maintenance,
                    and compliance with ASHRAE standards.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MonetizationOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Financial Analysis
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Calculate return on investment, payback periods, and life-cycle costs for
                    energy efficiency improvements and recommendations.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ViewInArIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Building Visualization
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Visualize energy usage patterns and identify hotspots within building layouts
                    to target improvement opportunities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RuleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Compliance Checking
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Verify systems against Philippine Electrical Code 2017, ASHRAE standards,
                    and Department of Energy guidelines.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Reporting
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Generate comprehensive energy audit reports with findings, recommendations,
                    and implementation plans for stakeholders.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default EnergyAuditDashboard; 