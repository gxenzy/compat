import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  KeyboardArrowRight,
  HearingDisabled,
  Keyboard,
  Visibility,
  ArrowForward
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Interface for testing steps
interface TestingStep {
  title: string;
  description: string;
  keyboardShortcuts?: { key: string; description: string }[];
}

// Screen reader testing steps
const nvdaSteps: TestingStep[] = [
  {
    title: 'Install NVDA',
    description: 'Download and install NVDA from https://www.nvaccess.org/download/'
  },
  {
    title: 'Configure NVDA',
    description: 'Set speech rate to a comfortable level. Press NVDA+Ctrl+Arrow Up/Down to adjust.'
  },
  {
    title: 'Navigate to Chart',
    description: 'Use Tab key to history.push to the chart component. NVDA should announce it.'
  },
  {
    title: 'Explore Data Points',
    description: 'Use arrow keys to history.push between data points. Listen for announcements.',
    keyboardShortcuts: [
      { key: '←/→', description: 'Move between data points horizontally' },
      { key: '↑/↓', description: 'Move between data series' },
      { key: 'Home/End', description: 'Move to first/last data point' }
    ]
  },
  {
    title: 'Use Chart Keyboard Shortcuts',
    description: 'Test the specific keyboard shortcuts for chart accessibility.',
    keyboardShortcuts: [
      { key: 'Alt+A', description: 'Announce chart summary' },
      { key: 'Alt+D', description: 'Toggle data table view' },
      { key: 'Alt+H', description: 'Open keyboard help dialog' }
    ]
  },
  {
    title: 'Check Data Table View',
    description: 'Press Alt+D to switch to data table view. Navigate through the table with arrow keys.'
  },
  {
    title: 'Document Your Findings',
    description: 'Use the Test Recorder to document your findings including issues and recommendations.'
  }
];

const jawsSteps: TestingStep[] = [
  {
    title: 'Install JAWS',
    description: 'Obtain JAWS from Freedom Scientific (https://www.freedomscientific.com/products/software/jaws/).'
  },
  {
    title: 'Configure JAWS',
    description: 'Set speech rate to a comfortable level using Insert+Ctrl+Page Up/Down.'
  },
  {
    title: 'Navigate to Chart',
    description: 'Use Tab key to history.push to the chart component. JAWS should announce it.'
  },
  {
    title: 'Virtual Cursor Mode',
    description: 'JAWS may use virtual cursor. Press Insert+Z to toggle virtual cursor if needed.'
  },
  {
    title: 'Explore Chart Data',
    description: 'Use arrow keys to history.push chart data points.',
    keyboardShortcuts: [
      { key: '←/→', description: 'Navigate between data points' },
      { key: '↑/↓', description: 'Navigate between datasets' },
      { key: 'Home/End', description: 'Navigate to first/last point' }
    ]
  },
  {
    title: 'Test Keyboard Shortcuts',
    description: 'Test chart-specific keyboard shortcuts.',
    keyboardShortcuts: [
      { key: 'Alt+A', description: 'Announce chart summary' },
      { key: 'Alt+D', description: 'Toggle data table view' },
      { key: 'Alt+H', description: 'Open keyboard help dialog' }
    ]
  },
  {
    title: 'Document Your Findings',
    description: 'Use the Test Recorder to document your findings.'
  }
];

const voiceOverSteps: TestingStep[] = [
  {
    title: 'Enable VoiceOver',
    description: 'Press Command+F5 to toggle VoiceOver on macOS.'
  },
  {
    title: 'Navigate to Chart',
    description: 'Use VO+Tab (VO is Control+Option) to history.push to the chart.'
  },
  {
    title: 'Interact with Chart',
    description: 'Press VO+Shift+Down Arrow to interact with the chart element.'
  },
  {
    title: 'Explore Chart Data',
    description: 'Use arrow keys to history.push chart data points.',
    keyboardShortcuts: [
      { key: '←/→', description: 'Navigate horizontally through data points' },
      { key: '↑/↓', description: 'Navigate between data series' }
    ]
  },
  {
    title: 'Test Keyboard Shortcuts',
    description: 'Test chart-specific keyboard shortcuts.',
    keyboardShortcuts: [
      { key: 'Alt+A', description: 'Announce chart summary' },
      { key: 'Alt+D', description: 'Toggle data table view' },
      { key: 'Alt+H', description: 'Open keyboard help dialog' }
    ]
  },
  {
    title: 'Document Your Findings',
    description: 'Use the Test Recorder to document your findings.'
  }
];

const keyboardOnlySteps: TestingStep[] = [
  {
    title: 'Navigate to Chart',
    description: 'Use Tab key to history.push to the chart component.'
  },
  {
    title: 'Check Focus Indicator',
    description: 'Verify that there is a visible focus indicator around the chart.'
  },
  {
    title: 'Access Chart Data',
    description: 'Use arrow keys to history.push between data points.',
    keyboardShortcuts: [
      { key: '←/→', description: 'Navigate horizontally through data points' },
      { key: '↑/↓', description: 'Navigate between data series' },
      { key: 'Home/End', description: 'Navigate to first/last data point' }
    ]
  },
  {
    title: 'Test Data Table View',
    description: 'Press Alt+D to open the data table view. Navigate the table with arrow keys.'
  },
  {
    title: 'Test Help Dialog',
    description: 'Press Alt+H to open the keyboard shortcuts help dialog.'
  },
  {
    title: 'Check Dialog Behavior',
    description: 'Verify that focus is trapped in dialogs when they open, and that Escape key closes them.'
  },
  {
    title: 'Test Return Focus',
    description: 'When closing dialogs, verify that focus returns to the element that opened the dialog.'
  },
  {
    title: 'Document Your Findings',
    description: 'Use the Test Recorder to document your findings.'
  }
];

/**
 * Step-by-step guide for testing charts with screen readers and keyboard
 */
const ScreenReaderTestingGuide: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Get the current steps based on selected tab
  const getCurrentSteps = () => {
    switch (selectedTab) {
      case 0: return nvdaSteps;
      case 1: return jawsSteps;
      case 2: return voiceOverSteps;
      case 3: return keyboardOnlySteps;
      default: return nvdaSteps;
    }
  };

  const currentSteps = getCurrentSteps();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Screen Reader Testing Guide
      </Typography>
      
      <Typography variant="body1" paragraph>
        Follow these steps to test chart accessibility with different screen readers and assistive technologies.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<HearingDisabled />} label="NVDA" />
          <Tab icon={<HearingDisabled />} label="JAWS" />
          <Tab icon={<HearingDisabled />} label="VoiceOver" />
          <Tab icon={<Keyboard />} label="Keyboard-Only" />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        <List>
          {currentSteps.map((step, index) => (
            <Box key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <Chip label={index + 1} color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={step.title}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                      
                      {step.keyboardShortcuts && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {step.keyboardShortcuts.map((shortcut, idx) => (
                            <Chip
                              key={idx}
                              size="small"
                              variant="outlined"
                              label={`${shortcut.key}: ${shortcut.description}`}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < currentSteps.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Common Testing Scenarios
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Accordion>
          <AccordionSummary expandIcon={<KeyboardArrowRight />}>
            <Typography>Data Point Navigation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Verify that users can history.push between data points using arrow keys and that each data point is announced correctly with its value.
            </Typography>
            <Typography variant="body2">
              <strong>Expected Behavior:</strong> Screen reader should announce data point values as you history.push. For example: "March: 65 units" or "Q1 Revenue: $10,500".
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<KeyboardArrowRight />}>
            <Typography>Data Table Alternative</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Test the Alt+D shortcut to switch to data table view. Verify that the table is properly structured with headers and that data cells are associated with their headers.
            </Typography>
            <Typography variant="body2">
              <strong>Expected Behavior:</strong> Screen reader should announce the table and allow navigation through cells, announcing both the header and data value for each cell.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<KeyboardArrowRight />}>
            <Typography>Chart Summary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Test the Alt+A shortcut to hear a summary of the chart. The summary should provide an overview of the chart data, trends, and key insights.
            </Typography>
            <Typography variant="body2">
              <strong>Expected Behavior:</strong> Screen reader should announce a concise but informative summary of the chart data, including chart type, axis information, and key trends.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<KeyboardArrowRight />}>
            <Typography>Keyboard Help Dialog</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Test the Alt+H shortcut to open the keyboard shortcuts help dialog. Verify that the dialog is accessible and that focus is managed correctly.
            </Typography>
            <Typography variant="body2">
              <strong>Expected Behavior:</strong> Help dialog should open, focus should move to the dialog, dialog should be navigable, and focus should return to the chart after closing.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          component={Link}
          to="/settings/accessibility/test-suite"
          variant="outlined"
          startIcon={<Visibility />}
        >
          Automated Test Suite
        </Button>
        
        <Button
          component={Link}
          to="/settings/accessibility/test-recorder"
          variant="contained"
          color="primary"
          endIcon={<ArrowForward />}
        >
          Go to Test Recorder
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenReaderTestingGuide; 