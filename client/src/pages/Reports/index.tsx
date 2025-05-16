import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Container,
  Grid,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { Add as AddIcon, FileCopy as TemplateIcon, Share as ShareIcon } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { ReportList } from '../../components/ReportManagement';
import PageHeader from '../../components/PageHeader';

/**
 * Reports page component
 */
const Reports: React.FC = () => {
  const history = useHistory();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCreateReport = () => {
    history.push('/reports/create');
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Report Management"
          description="Create, view, and manage your reports"
          icon="reports"
          actions={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateReport}
              sx={{ ml: 2 }}
            >
              Create Report
            </Button>
          }
        />
      </Box>
      
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[2] }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="report tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="My Reports" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Shared With Me" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Templates" id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Box>
        
        <Box sx={{ py: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <ReportList 
              reportsType="owned" 
              showActions={true} 
              showFilters={true}
              onEditReport={(report) => history.push(`/reports/edit/${report.id}`)}
              onViewReport={(report) => history.push(`/reports/view/${report.id}`)}
              onCreateReport={handleCreateReport}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ReportList 
              reportsType="shared" 
              showActions={true} 
              showFilters={true}
              onEditReport={(report) => history.push(`/reports/edit/${report.id}`)}
              onViewReport={(report) => history.push(`/reports/view/${report.id}`)}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ReportList 
              reportsType="templates" 
              showActions={true} 
              showFilters={true}
              onEditReport={(report) => history.push(`/reports/edit/${report.id}`)}
              onViewReport={(report) => history.push(`/reports/view/${report.id}`)}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default Reports; 