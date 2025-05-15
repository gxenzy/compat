import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationCenter from '../index';
import { useEnergyAudit } from '../../../../contexts/EnergyAuditContext';
import useEnergyAuditRealTime from '../../../../hooks/useEnergyAuditRealTime';

// Mock the hooks
jest.mock('../../../../contexts/EnergyAuditContext');
jest.mock('../../../../hooks/useEnergyAuditRealTime');

// Define NotificationCenterProps interface to match component implementation
interface NotificationCenterProps {
  onNavigate?: (route: string) => void;
  compact?: boolean;
  maxItems?: number;
}

describe('NotificationCenter Component', () => {
  const mockLogActivity = jest.fn();
  const mockSubscribeToEvent = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Default mock implementations
    (useEnergyAudit as jest.Mock).mockReturnValue({
      activityLog: [],
      logActivity: mockLogActivity
    });

    (useEnergyAuditRealTime as jest.Mock).mockReturnValue({
      subscribeToEvent: mockSubscribeToEvent
    });

    // Reset mocks
    mockLogActivity.mockClear();
    mockSubscribeToEvent.mockClear();
    mockNavigate.mockClear();

    // Mock return value for subscribeToEvent
    mockSubscribeToEvent.mockImplementation(() => jest.fn());
  });

  it('renders the notification icon with badge', () => {
    render(<NotificationCenter />);
    
    // Find the notification button/icon
    const notificationIcon = screen.getByRole('button');
    expect(notificationIcon).toBeInTheDocument();
    
    // Check if badge is present (should show initial notifications)
    const badge = screen.getByText('3'); // 3 initial mock notifications
    expect(badge).toBeInTheDocument();
  });

  it('opens notification panel when clicked', () => {
    render(<NotificationCenter />);
    
    // Click on the notification icon
    fireEvent.click(screen.getByRole('button'));
    
    // Check if notification panel is open
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText(/Unread/)).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<NotificationCenter />);
    
    // Open notification panel
    fireEvent.click(screen.getByRole('button'));
    
    // Should start on "All" tab and show all notifications
    expect(screen.getByText('Energy Usage Anomaly')).toBeInTheDocument();
    expect(screen.getByText('Audit Completed')).toBeInTheDocument();
    
    // Switch to "Unread" tab
    fireEvent.click(screen.getByText(/Unread/));
    
    // Should only show unread notifications
    expect(screen.getByText('Energy Usage Anomaly')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Audit')).toBeInTheDocument();
    expect(screen.queryByText('Audit Completed')).not.toBeInTheDocument(); // This one is read
  });

  it('marks notifications as read when clicked', () => {
    render(<NotificationCenter />);
    
    // Open notification panel
    fireEvent.click(screen.getByRole('button'));
    
    // Click on a notification
    fireEvent.click(screen.getByText('Energy Usage Anomaly'));
    
    // Badge count should decrease
    const badge = screen.getByText('2'); // From 3 to 2
    expect(badge).toBeInTheDocument();
  });

  it('navigates when clicking notification with action', () => {
    // Now we specify the onNavigate prop, which is properly typed
    render(<NotificationCenter onNavigate={mockNavigate} />);
    
    // Open notification panel
    fireEvent.click(screen.getByRole('button'));
    
    // Find and click the notification with action
    fireEvent.click(screen.getByText('Audit Completed'));
    
    // Check if navigation was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('/energy-audit/report/123');
  });

  it('marks all as read when clicking the mark all read button', () => {
    render(<NotificationCenter />);
    
    // Open notification panel
    fireEvent.click(screen.getByRole('button'));
    
    // Find and click the mark all read button
    const markAllReadButton = screen.getByRole('button', { name: /Mark All as Read/i });
    fireEvent.click(markAllReadButton);
    
    // Badge should disappear or show 0
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('subscribes to real-time events', () => {
    render(<NotificationCenter />);
    
    // Check if subscribeToEvent was called for important events
    expect(mockSubscribeToEvent).toHaveBeenCalledWith('auditCreated', expect.any(Function));
    expect(mockSubscribeToEvent).toHaveBeenCalledWith('auditUpdated', expect.any(Function));
    expect(mockSubscribeToEvent).toHaveBeenCalledWith('findingCreated', expect.any(Function));
    expect(mockSubscribeToEvent).toHaveBeenCalledWith('auditCommentAdded', expect.any(Function));
    expect(mockSubscribeToEvent).toHaveBeenCalledWith('syncCompleted', expect.any(Function));
  });

  it('toggles mute state when mute button is clicked', () => {
    render(<NotificationCenter />);
    
    // Open notification panel
    fireEvent.click(screen.getByRole('button'));
    
    // Find and click the mute button
    const muteButton = screen.getByRole('button', { name: /Mute Notifications/i });
    fireEvent.click(muteButton);
    
    // Now the button should show "Unmute Notifications"
    expect(screen.getByRole('button', { name: /Unmute Notifications/i })).toBeInTheDocument();
  });
}); 