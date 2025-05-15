import React, { createContext, useContext, useState, useCallback } from 'react';

// Types for context data
interface ActivityLogEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  resourceId?: string;
  resourceType?: string;
  details?: any;
}

// Adding needed interfaces for audit data
interface Audit {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // Add other audit properties as needed
}

interface Finding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  // Add other finding properties as needed
}

interface Metrics {
  completedAudits: number;
  pendingAudits: number;
  highPriorityFindings: number;
  energySavingsTotal: number;
  // Add other metrics as needed
}

interface EnergyAuditContextType {
  auditId?: string;
  auditData?: any;
  activityLog: ActivityLogEntry[];
  isLoading: boolean;
  error?: string;
  loadAudit: (id: string) => Promise<boolean>;
  updateAudit: (data: any) => Promise<boolean>;
  logActivity: (type: string, message: string, details?: any) => void;
  refreshData: () => Promise<boolean>;
  // Add missing properties
  hasRealTimeConnections: boolean;
  lastRealTimeUpdate?: Date;
  audits: Audit[];
  findings: Finding[];
  metrics: Metrics;
  getAuditById: (id: string) => Audit | undefined;
}

// Create the context with default values
const EnergyAuditContext = createContext<EnergyAuditContextType>({
  activityLog: [],
  isLoading: false,
  loadAudit: async () => false,
  updateAudit: async () => false,
  logActivity: () => {},
  refreshData: async () => false,
  // Add default values for new properties
  hasRealTimeConnections: false,
  audits: [],
  findings: [],
  metrics: {
    completedAudits: 0,
    pendingAudits: 0,
    highPriorityFindings: 0,
    energySavingsTotal: 0
  },
  getAuditById: () => undefined
});

// Provider component
export const EnergyAuditProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [auditId, setAuditId] = useState<string>();
  const [auditData, setAuditData] = useState<any>();
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  // Add states for new properties
  const [hasRealTimeConnections, setHasRealTimeConnections] = useState<boolean>(false);
  const [lastRealTimeUpdate, setLastRealTimeUpdate] = useState<Date>();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    completedAudits: 0,
    pendingAudits: 0,
    highPriorityFindings: 0,
    energySavingsTotal: 0
  });
  
  // Load audit data
  const loadAudit = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      // In a real implementation, would fetch audit data from API
      setAuditId(id);
      setAuditData({
        id,
        name: `Audit ${id}`,
        status: 'in_progress',
        created_at: new Date().toISOString()
      });
      
      // Mock activity log
      setActivityLog([
        {
          id: '1',
          type: 'audit_created',
          message: `Audit ${id} was created`,
          timestamp: new Date().toISOString(),
          userId: 'user-1',
          userName: 'Admin User',
          resourceId: id,
          resourceType: 'audit'
        }
      ]);
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      setError('Failed to load audit data');
      return false;
    }
  }, []);
  
  // Update audit data
  const updateAudit = useCallback(async (data: any): Promise<boolean> => {
    if (!auditId) {
      setError('No audit loaded');
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, would update audit data via API
      setAuditData({
        ...auditData,
        ...data,
        updated_at: new Date().toISOString()
      });
      
      // Log the update
      const updateMessage = `Audit ${auditId} was updated`;
      logActivity('audit_updated', updateMessage, { updatedFields: Object.keys(data) });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      setError('Failed to update audit data');
      return false;
    }
  }, [auditId, auditData]);
  
  // Log activity
  const logActivity = useCallback((type: string, message: string, details?: any) => {
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      userId: 'current-user', // Would come from auth context in a real app
      userName: 'Current User',
      resourceId: auditId,
      resourceType: 'audit',
      details
    };
    
    setActivityLog(prevLog => [newEntry, ...prevLog]);
  }, [auditId]);
  
  // Refresh data
  const refreshData = useCallback(async (): Promise<boolean> => {
    if (!auditId) {
      return false;
    }
    
    return loadAudit(auditId);
  }, [auditId, loadAudit]);

  // Get audit by ID
  const getAuditById = useCallback((id: string): Audit | undefined => {
    return audits.find(audit => audit.id === id);
  }, [audits]);
  
  // Context value
  const contextValue: EnergyAuditContextType = {
    auditId,
    auditData,
    activityLog,
    isLoading,
    error,
    loadAudit,
    updateAudit,
    logActivity,
    refreshData,
    // Add new properties to context value
    hasRealTimeConnections,
    lastRealTimeUpdate,
    audits,
    findings,
    metrics,
    getAuditById
  };
  
  return (
    <EnergyAuditContext.Provider value={contextValue}>
      {children}
    </EnergyAuditContext.Provider>
  );
};

// Hook for consuming the context
export const useEnergyAudit = () => useContext(EnergyAuditContext);

export default EnergyAuditContext; 