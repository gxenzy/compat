import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import  BrowserRouter, Switch, Route  from 'react-router-dom';
import { ReportEditor } from '../index';
import reportService from '../../../services/reportService';
import { Report, ReportContent } from '../../../types/reports';

// Mock the report service
jest.mock('../../../services/reportService', () => ({
  getReportById: jest.fn(),
  createReport: jest.fn(),
  updateReport: jest.fn(),
}));

// Mock Chart.js to avoid canvas rendering issues
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: class MockChart {
    constructor() {
      return {
        destroy: jest.fn(),
      };
    }
  },
}));

// Mock data for testing
const mockTextContent: ReportContent = {
  id: 1,
  report_id: 1,
  content_type: 'text',
  content: {
    text: 'This is a sample text content for testing',
    isHtml: false,
  },
  order_index: 0,
};

const mockChartContent: ReportContent = {
  id: 2,
  report_id: 1,
  content_type: 'chart',
  content: {
    chartType: 'bar',
    data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] },
    options: {},
    height: 300,
    caption: 'Test Chart',
  },
  order_index: 1,
};

// Mock report data
const mockReport: Report = {
  id: 1,
  title: 'Test Report',
  description: 'Test description',
  type: 'energy_audit',
  status: 'draft',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  created_by: 1,
  is_template: false,
  is_public: false,
  version: 1,
  contents: [mockTextContent, mockChartContent],
  metadata: {
    client_name: 'Test Client',
    facility_name: 'Test Facility',
    audit_date: '2023-01-01',
    auditor_name: 'Test Auditor',
    executive_summary: 'This is a test summary',
    include_appendices: true,
    include_toc: true,
  },
  public_link: null,
  shares: [],
};

// Set up mocked params
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}));

// Helper function to render with router
const renderWithRouter = (editMode: boolean = true) => {
  // Update mock params implementation based on mode
  if (editMode) {
    require('react-router-dom').useParams = () => ({ id: '1' });
  } else {
    require('react-router-dom').useParams = () => ({});
  }
  
  return render(
    <BrowserRouter>
      <Switch>
        <Route path="*" component={() => <ReportEditor />} />
      </Switch>
    </BrowserRouter>
  );
};

describe('ReportEditor Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Setup the mock implementation for edit mode
    (reportService.getReportById as jest.Mock).mockResolvedValue(mockReport);
    (reportService.updateReport as jest.Mock).mockResolvedValue(mockReport);
    (reportService.createReport as jest.Mock).mockResolvedValue(mockReport);
  });

  test('renders in create mode with empty form', async () => {
    // Set up for create mode
    require('react-router-dom').useParams = () => ({});
    
    renderWithRouter(false);
    
    // Check form is loaded
    expect(screen.getByText('Create New Report')).toBeInTheDocument();
    
    // Check form fields are empty (except defaults)
    expect(screen.getByLabelText('Title *')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  test('loads report data in edit mode', async () => {
    renderWithRouter(true);
    
    // Wait for report to load
    await waitFor(() => {
      expect(reportService.getReportById).toHaveBeenCalledWith(1);
    });
    
    // Check form is loaded with report data
    expect(screen.getByText('Edit Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toHaveValue('Test Report');
    expect(screen.getByLabelText('Description')).toHaveValue('Test description');
  });

  test('toggles between basic info and content tabs', async () => {
    renderWithRouter(true);
    
    // Wait for report to load
    await waitFor(() => {
      expect(reportService.getReportById).toHaveBeenCalledWith(1);
    });
    
    // Check we're on basic info tab by default
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    
    // Click content tab
    const contentTab = screen.getByText('Report Content');
    fireEvent.click(contentTab);
    
    // Check content tab is active
    expect(screen.getByText('Add Content')).toBeInTheDocument();
  });

  test('adds a new text content item', async () => {
    renderWithRouter(true);
    
    // Wait for report to load
    await waitFor(() => {
      expect(reportService.getReportById).toHaveBeenCalledWith(1);
    });
    
    // Go to content tab
    const contentTab = screen.getByText('Report Content');
    fireEvent.click(contentTab);
    
    // Click add content button
    const addButton = screen.getByText('Add Content');
    fireEvent.click(addButton);
    
    // Select text content type
    const textOption = screen.getByText('Text Content');
    fireEvent.click(textOption);
    
    // Enter text in the editor
    const textField = screen.getByLabelText('Content');
    fireEvent.change(textField, { target: { value: 'New text content' } });
    
    // Save the content
    const saveButton = screen.getByText('Add');
    fireEvent.click(saveButton);
    
    // Check the content was added to the list
    expect(screen.getByText('New text content')).toBeInTheDocument();
  });

  test('validates form before submission', async () => {
    // Set up for create mode
    require('react-router-dom').useParams = () => ({});
    
    renderWithRouter(false);
    
    // Try to submit without a title
    const saveButton = screen.getByText('Create Report');
    fireEvent.click(saveButton);
    
    // Check validation error is shown
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    
    // Fill in required field
    const titleField = screen.getByLabelText('Title *');
    fireEvent.change(titleField, { target: { value: 'New Report' } });
    
    // Try to submit again
    fireEvent.click(saveButton);
    
    // Check if create was called
    await waitFor(() => {
      expect(reportService.createReport).toHaveBeenCalled();
    });
  });

  test('saves report changes in edit mode', async () => {
    renderWithRouter(true);
    
    // Wait for report to load
    await waitFor(() => {
      expect(reportService.getReportById).toHaveBeenCalledWith(1);
    });
    
    // Edit title
    const titleField = screen.getByLabelText('Title *');
    fireEvent.change(titleField, { target: { value: 'Updated Report Title' } });
    
    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Check if update was called with new title
    await waitFor(() => {
      expect(reportService.updateReport).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Updated Report Title'
        })
      );
    });
    
    // Check success message is shown
    expect(screen.getByText('Report updated successfully')).toBeInTheDocument();
  });

  test('handles content reordering', async () => {
    renderWithRouter(true);
    
    // Wait for report to load
    await waitFor(() => {
      expect(reportService.getReportById).toHaveBeenCalledWith(1);
    });
    
    // Go to content tab
    const contentTab = screen.getByText('Report Content');
    fireEvent.click(contentTab);
    
    // Find move down button for first content item
    const moveDownButtons = screen.getAllByLabelText('Move Down');
    fireEvent.click(moveDownButtons[0]);
    
    // Check if order was changed
    const orderIndicators = screen.getAllByText(/^\d+$/);
    expect(orderIndicators[0].textContent).toBe('2');
    expect(orderIndicators[1].textContent).toBe('1');
  });

  test('handles API errors gracefully', async () => {
    // Set up error response
    (reportService.getReportById as jest.Mock).mockRejectedValue(new Error('Failed to load report'));
    
    renderWithRouter(true);
    
    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText('Failed to load report')).toBeInTheDocument();
    });
  });
}); 