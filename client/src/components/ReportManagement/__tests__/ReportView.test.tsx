import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import  BrowserRouter, Switch, Route  from 'react-router-dom';
import { ReportView } from '../index';
import reportService from '../../../services/reportService';
import { Report, ReportContent } from '../../../types/reports';

// Mock the report service
jest.mock('../../../services/reportService', () => ({
  getReportById: jest.fn(),
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

// Sample report content
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

const mockImageContent: ReportContent = {
  id: 3,
  report_id: 1,
  content_type: 'image',
  content: {
    url: 'https://example.com/image.jpg',
    caption: 'Test Image',
    altText: 'Test',
  },
  order_index: 2,
};

// Mock report data
const mockReport: Report = {
  id: 1,
  title: 'Test Report',
  description: 'Test description',
  type: 'energy_audit',
  status: 'published',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  created_by: 1,
  is_template: false,
  is_public: true,
  version: 1,
  contents: [mockTextContent, mockChartContent, mockImageContent],
  metadata: {
    client_name: 'Test Client',
    facility_name: 'Test Facility',
    audit_date: '2023-01-01',
    auditor_name: 'Test Auditor',
    company_logo: 'https://example.com/logo.png',
    executive_summary: 'This is a test summary',
    cover_image: 'https://example.com/cover.jpg',
    include_appendices: true,
    include_toc: true,
  },
  public_link: "https://example.com/reports/public/abc123",
  shares: [],
};

// Helper function to render with router and route params
const renderWithRouter = (id: string = '1') => {
  return render(
    <BrowserRouter>
      <Switch>
        <Route path="*" component={() => <ReportView />} />
      </Switch>
    </BrowserRouter>
  );
};

describe('ReportView Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Setup the mock implementation
    (reportService.getReportById as jest.Mock).mockResolvedValue(mockReport);
    
    // Mock window.location and URLSearchParams
    Object.defineProperty(window, 'location', {
      value: { search: '?id=1' },
      writable: true,
    });
    
    // Mock useParams to return the id
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ id: '1' }),
    }));
  });

  test('renders loading state initially', async () => {
    renderWithRouter();
    
    // Check loading state is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays report title and metadata after loading', async () => {
    renderWithRouter();
    
    // Wait for report to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if report title is displayed
    expect(screen.getByText('Test Report')).toBeInTheDocument();
    
    // Check if metadata is displayed
    expect(screen.getByText(/Test Client/)).toBeInTheDocument();
    expect(screen.getByText(/Test Facility/)).toBeInTheDocument();
    expect(screen.getByText(/Test Auditor/)).toBeInTheDocument();
    expect(screen.getByText(/This is a test summary/)).toBeInTheDocument();
  });

  test('displays text content correctly', async () => {
    renderWithRouter();
    
    // Wait for report to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if text content is displayed
    expect(screen.getByText('This is a sample text content for testing')).toBeInTheDocument();
  });

  test('renders image content with caption', async () => {
    renderWithRouter();
    
    // Wait for report to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if image is rendered
    const image = screen.getByAltText('Test');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    
    // Check if caption is displayed
    expect(screen.getByText('Test Image')).toBeInTheDocument();
  });

  test('renders chart content', async () => {
    renderWithRouter();
    
    // Wait for report to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if chart canvas is rendered
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
    
    // Check if chart caption is displayed
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    // Setup error response
    (reportService.getReportById as jest.Mock).mockRejectedValue(new Error('Failed to load report'));
    
    renderWithRouter();
    
    // Wait for error to display
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if error message is displayed
    expect(screen.getByText(/Failed to load report/)).toBeInTheDocument();
  });
}); 