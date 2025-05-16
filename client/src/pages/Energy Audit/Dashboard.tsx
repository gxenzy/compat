import React, { ReactElement } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  ElectricalServices as ElectricalServicesIcon,
  AcUnit as AcUnitIcon,
  ViewInAr as ViewInArIcon,
  Rule as RuleIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  CheckBox as CheckBoxIcon,
  OfflineBolt as OfflineBoltIcon,
  MonetizationOn as MonetizationOnIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import VoltageDropWidget from './components/Calculators/VoltageDropWidget';

const Dashboard = (): ReactElement => {
  const history = useHistory();
  const theme = useTheme();

  // Navigate to different sections of the energy audit system
  const navigateTo = (path: string) => {
    history.push(path);
  };

  // Main feature cards for the dashboard
  const featureCards = [
    // {
    //   title: 'Building Visualization',
    //   description: 'Interactive 3D building visualization with energy analysis overlays.',
    //   icon: <ViewInArIcon />,
    //   path: '/energy-audit/building-visualization'
    // },
    {
      title: 'Standards Reference',
      description: 'Access energy codes and standards for compliance verification.',
      icon: <RuleIcon />,
      path: '/energy-audit/standards-reference'
    },
    {
      title: 'Energy Analytics',
      description: 'Detailed energy consumption analysis and benchmarking.',
      icon: <BarChartIcon />,
      path: '/energy-audit/energy-analytics'
    },
    {
      title: 'Inspection Checklist',
      description: 'Comprehensive checklists for energy audit field inspections.',
      icon: <CheckBoxIcon />,
      path: '/energy-audit/inspection-checklist'
    },
    {
      title: 'Energy Calculators',
      description: 'Tools to calculate energy usage, savings, and efficiency metrics.',
      icon: <CalculateIcon />,
      path: '/energy-audit/energy-calculators'
    },
    {
      title: 'ROI Calculator',
      description: 'Calculate return on investment for energy efficiency improvements.',
      icon: <MonetizationOnIcon />,
      path: '/energy-audit/roi-calculator'
    },
    {
      title: 'Audit Workflow',
      description: 'Step-by-step workflow guide for conducting energy audits.',
      icon: <WorkIcon />,
      path: '/energy-audit/audit-workflow'
    },
    {
      title: 'Saved Calculations',
      description: 'View and manage your saved energy calculations and reports.',
      icon: <DescriptionIcon />,
      path: '/energy-audit/saved-calculations'
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

  // Create a new audit button
  const startNewAudit = () => {
    navigateTo('/energy-audit/audit-workflow');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Energy Audit System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          A comprehensive tool for educational energy auditing at University of School Lapu-Lapu and Mandaue City
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<AddIcon />}
          onClick={startNewAudit}
          sx={{ mr: 2 }}
        >
          Start New Audit
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
                      bgcolor: theme.palette.primary.main,
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

        {/* System Components Section */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Energy Audit System Components
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ElectricalServicesIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Electrical Systems
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Evaluate electrical systems based on PEC 2017 standards
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AcUnitIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    HVAC Systems
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Assess HVAC systems for efficiency using ASHRAE standards
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BarChartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Analytics
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Data-driven insights for energy consumption patterns
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Reporting
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Generate comprehensive energy audit reports
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckBoxIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Inspection Checklists
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Standardized checklists for system inspections based on PEC and ASHRAE
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Add Voltage Drop Widget Section */}
        <Grid item xs={12} md={6}>
          <VoltageDropWidget
            onNavigateToCalculator={() => navigateTo('/energy-audit/energy-calculators')}
          />
        </Grid>
        
        {/* Add another widget for balance if needed */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Energy Audit Progress
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                Your energy audit workflow progress will be shown here as you complete more assessments.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigateTo('/energy-audit/audit-workflow')}
                startIcon={<WorkIcon />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Continue Audit Workflow
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 