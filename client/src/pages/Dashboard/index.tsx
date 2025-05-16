import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuthContext } from '../../contexts/AuthContext';
import { useEnergyAudit } from '../../contexts/EnergyAuditContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  onClick?: () => void;
}

interface AuditStatusChipProps {
  status: string;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  status: string;
  date: string;
}

interface AuditStatus {
  status: string;
  count: number;
}

interface FindingCategory {
  category: string;
  count: number;
  savings: number;
}

interface EnergyTrend {
  month: string;
  consumption: number;
  baseline: number;
}

interface DashboardData {
  totalAudits: number;
  completedAudits: number;
  totalFindings: number;
  criticalFindings: number;
  potentialSavings: number;
  implementedSavings: number;
  recentActivity: RecentActivity[];
  auditsByStatus: AuditStatus[];
  findingsByCategory: FindingCategory[];
  energyTrends: EnergyTrend[];
}

// Custom components
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, onClick }) => (
  <motion.div
    whileHover={{ y: -4 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: color, p: 1, borderRadius: 1, bgcolor: alpha(color, 0.1) }}>
            {icon}
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
              <Typography variant="body2" color="success.main">
                {trend}
        </Typography>
          </Box>
        )}
        </Box>
        <Typography variant="h4" sx={{ mb: 1 }}>{value}</Typography>
        <Typography color="textSecondary">{title}</Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const AuditStatusChip: React.FC<AuditStatusChipProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getStatusColor(status)}
      size="small"
      sx={{ minWidth: 80 }}
    />
  );
};

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { currentUser } = useAuthContext();
  const { audits, findings, metrics } = useEnergyAudit();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  // Check if using a special theme with dark background but light mode
  const isSpecialTheme = ['#082f49', '#1f2937', '#042f2e', '#0f172a'].includes(theme.palette.background.default);
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalAudits: 0,
    completedAudits: 0,
    totalFindings: 0,
    criticalFindings: 0,
    potentialSavings: 0,
    implementedSavings: 0,
    recentActivity: [],
    auditsByStatus: [],
    findingsByCategory: [],
    energyTrends: [],
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        const mockData: DashboardData = {
          totalAudits: 45,
          completedAudits: 32,
          totalFindings: 128,
          criticalFindings: 15,
          potentialSavings: 250000,
          implementedSavings: 120000,
          recentActivity: [
            { id: 1, type: 'audit', title: 'Building A Audit', status: 'Completed', date: '2024-03-15' },
            { id: 2, type: 'finding', title: 'HVAC Optimization', status: 'In Progress', date: '2024-03-14' },
            { id: 3, type: 'approval', title: 'Lighting Retrofit', status: 'Pending', date: '2024-03-13' },
          ],
          auditsByStatus: [
            { status: 'Completed', count: 32 },
            { status: 'In Progress', count: 8 },
            { status: 'Pending', count: 5 },
          ],
          findingsByCategory: [
            { category: 'HVAC', count: 45, savings: 120000 },
            { category: 'Lighting', count: 38, savings: 80000 },
            { category: 'Envelope', count: 25, savings: 50000 },
            { category: 'Other', count: 20, savings: 30000 },
          ],
          energyTrends: Array.from({ length: 12 }, (_, i) => ({
            month: format(new Date(2024, i, 1), 'MMM'),
            consumption: Math.random() * 1000 + 500,
            baseline: 800,
          })),
        };

        setDashboardData(mockData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: 3,
        color: isSpecialTheme ? '#ffffff' : 'inherit'
      }}
    >
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
          Welcome back, {currentUser?.firstName || 'User'}
        </Typography>
        <Typography variant="body1" sx={{ color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
          Here's an overview of your energy audit progress and key metrics
        </Typography>
      </Box>

      {/* Key Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Audits"
            value={dashboardData.totalAudits}
            icon={<Assessment />}
            color={theme.palette.primary.main}
            trend="+5% this month"
            onClick={() => history.push('/energy-audit')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={`${Math.round((dashboardData.completedAudits / dashboardData.totalAudits) * 100)}%`}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Findings"
            value={dashboardData.criticalFindings}
            icon={<Warning />}
            color={theme.palette.error.main}
            onClick={() => history.push('/energy-audit?filter=critical')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Potential Savings"
            value={`$${(dashboardData.potentialSavings / 1000).toFixed(1)}k`}
            icon={<TrendingUp />}
            color={theme.palette.info.main}
            trend="+12% projected"
          />
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: isSpecialTheme ? 'rgba(255, 255, 255, 0.6)' : undefined,
              '&.Mui-selected': {
                color: isSpecialTheme ? '#ffffff' : undefined
              }
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Energy Trends" />
          <Tab label="Findings" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ minHeight: 400 }}>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
                      Monthly Energy Consumption
                    </Typography>
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData.energyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip />
                        <Area 
                          type="monotone" 
                          dataKey="consumption" 
                          stroke={theme.palette.primary.main} 
                          fill={alpha(theme.palette.primary.main, 0.2)}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="baseline" 
                          stroke={theme.palette.secondary.main} 
                          fill={alpha(theme.palette.secondary.main, 0.1)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
                    Audit Status
                  </Typography>
                  <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.auditsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          dataKey="count"
                          nameKey="status"
                        >
                          {dashboardData.auditsByStatus.map((entry, index) => {
                            const COLORS = [
                              theme.palette.success.main,
                              theme.palette.warning.main,
                              theme.palette.info.main
                            ];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                          })}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    {dashboardData.auditsByStatus.map((status) => (
                      <Box key={status.status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AuditStatusChip status={status.status} />
                        </Box>
                        <Typography variant="body2" sx={{ color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                          {status.count} audits
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Energy Trends Tab */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
                Annual Energy Consumption Trends
              </Typography>
              {/* Rest of energy trends tab content */}
            </CardContent>
          </Card>
        )}
        
        {/* Findings Tab */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
                Findings by Category
              </Typography>
              {/* Rest of findings tab content */}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: isSpecialTheme ? '#ffffff' : 'inherit' }}>Recent Activity</Typography>
          <Button startIcon={<RefreshIcon />} size="small">
            Refresh
          </Button>
        </Box>
        <Card>
          <CardContent>
            {dashboardData.recentActivity.map((activity) => (
              <Box 
                key={activity.id} 
                sx={{ 
                  py: 1.5, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  '&:last-child': { 
                    borderBottom: 'none' 
                  } 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: isSpecialTheme ? '#ffffff' : 'inherit' }}>
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AuditStatusChip status={activity.status} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        ml: 2, 
                        color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                      }}
                    >
                      {activity.date}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
