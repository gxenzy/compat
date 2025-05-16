import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, List, ListItem, ListItemText, MenuItem, TextField } from '@mui/material';
import LoadingSpinner from '../../components/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as XLSX from 'xlsx';
import { glassCardSx } from '../../theme/glassCardSx';

interface User { username: string; email: string; firstName: string; lastName: string; role: string; createdAt?: string; }
interface Audit { name: string; status: string; assignedTo?: string; dueDate?: string; createdAt?: string; }

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success'|'error' }>({ open: false, message: '', severity: 'success' });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/users').then(res => res.json()),
      fetch('/api/energy-audit').then(res => res.json()),
    ])
      .then(([usersData, auditsData]) => {
        setUsers(usersData);
        setAudits(auditsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filter helpers
  const inDateRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };
  const filteredUsers = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!startDate || inDateRange(u.createdAt)) &&
    (!endDate || inDateRange(u.createdAt))
  );
  const filteredAudits = audits.filter(a =>
    (!statusFilter || a.status === statusFilter) &&
    (!startDate || inDateRange(a.createdAt)) &&
    (!endDate || inDateRange(a.createdAt))
  );

  // Analytics data (filtered)
  const roleCounts = filteredUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);
  const auditStatusCounts = filteredAudits.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const roleData = Object.entries(roleCounts).map(([role, count]) => ({ name: role, value: count }));
  const statusData = Object.entries(auditStatusCounts).map(([status, count]) => ({ name: status, value: count }));

  // Time-series: audits created per month
  const auditsByMonth: Record<string, number> = {};
  filteredAudits.forEach(a => {
    if (a.createdAt) {
      const month = new Date(a.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
      auditsByMonth[month] = (auditsByMonth[month] || 0) + 1;
    }
  });
  const auditsByMonthData = Object.entries(auditsByMonth).map(([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Time-series: user signups per month
  const usersByMonth: Record<string, number> = {};
  filteredUsers.forEach(u => {
    if (u.createdAt) {
      const month = new Date(u.createdAt).toLocaleString('default', { year: 'numeric', month: 'short' });
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    }
  });
  const usersByMonthData = Object.entries(usersByMonth).map(([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Most active users (by audits assigned)
  const userAuditCounts: Record<string, number> = {};
  filteredAudits.forEach(a => {
    if (a.assignedTo) userAuditCounts[a.assignedTo] = (userAuditCounts[a.assignedTo] || 0) + 1;
  });
  const mostActiveUsers = Object.entries(userAuditCounts).map(([username, count]) => ({ username, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Audit completion rate
  const completed = filteredAudits.filter(a => a.status === 'Completed').length;
  const completionRate = filteredAudits.length ? Math.round((completed / filteredAudits.length) * 100) : 0;

  // Recent activity (last 10 users and audits)
  const recentActivity = [
    ...filteredUsers.slice(0, 5).map(u => ({ type: 'User', name: u.username, detail: u.email, date: u.createdAt })),
    ...filteredAudits.slice(0, 5).map(a => ({ type: 'Audit', name: a.name, detail: a.status, date: a.createdAt })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      ...filteredUsers.map(u => ({ Type: 'User', Name: u.username, Email: u.email, Role: u.role, CreatedAt: u.createdAt })),
      ...filteredAudits.map(a => ({ Type: 'Audit', Name: a.name, Status: a.status, AssignedTo: a.assignedTo, DueDate: a.dueDate, CreatedAt: a.createdAt }))
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    XLSX.writeFile(wb, 'analytics_export.xlsx');
    setSnackbar({ open: true, message: 'Exported to Excel!', severity: 'success' });
  };

  const exportCSV = () => {
    let csv = 'Type,Name/Username,Email/Status,AssignedTo,DueDate,CreatedAt\n';
    filteredUsers.forEach(u => {
      csv += `User,${u.username},${u.email},,,${u.createdAt || ''}\n`;
    });
    filteredAudits.forEach(a => {
      csv += `Audit,${a.name},${a.status},${a.assignedTo || ''},${a.dueDate || ''},${a.createdAt || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_export.csv';
    a.click();
    setSnackbar({ open: true, message: 'Exported to CSV!', severity: 'success' });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 18);
    doc.setFontSize(12);
    doc.text('Users:', 14, 30);
    (doc as any).autoTable({
      startY: 34,
      head: [['Username', 'Email', 'Role', 'CreatedAt']],
      body: filteredUsers.map(u => [u.username, u.email, u.role, u.createdAt || ''])
    });
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Audits:', 14, y);
    (doc as any).autoTable({
      startY: y + 4,
      head: [['Name', 'Status', 'AssignedTo', 'DueDate', 'CreatedAt']],
      body: filteredAudits.map(a => [a.name, a.status, a.assignedTo || '', a.dueDate || '', a.createdAt || ''])
    });
    doc.save('analytics_report.pdf');
    setSnackbar({ open: true, message: 'Exported to PDF!', severity: 'success' });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>
        <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <DatePicker 
                label="Start Date" 
                value={startDate} 
                onChange={setStartDate} 
                slotProps={{ textField: params => ({ ...params, size: 'small' }) }} 
              />
            </Grid>
            <Grid item>
              <DatePicker 
                label="End Date" 
                value={endDate} 
                onChange={setEndDate} 
                slotProps={{ textField: params => ({ ...params, size: 'small' }) }} 
              />
            </Grid>
            <Grid item>
              <TextField select label="User Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                <MenuItem value="">All Roles</MenuItem>
                {Array.from(new Set(users.map(u => u.role))).map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item>
              <TextField select label="Audit Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                <MenuItem value="">All Statuses</MenuItem>
                {Array.from(new Set(audits.map(a => a.status))).map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => { setStartDate(null); setEndDate(null); setRoleFilter(''); setStatusFilter(''); }}>Clear Filters</Button>
            </Grid>
          </Grid>
        </Paper>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">User Roles Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {roleData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">Audit Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">Audit Completion Rate</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress variant="determinate" value={completionRate} sx={{ height: 16, borderRadius: 8 }} />
                </Box>
                <Typography variant="h5" sx={{ minWidth: 60 }}>{completionRate}%</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">Audits Created Per Month</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={auditsByMonthData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">User Signups Per Month</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={usersByMonthData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#00C49F" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">Most Active Users (by audits assigned)</Typography>
              <List>
                {mostActiveUsers.map(u => (
                  <ListItem key={u.username}>
                    <ListItemText primary={u.username} secondary={`Audits assigned: ${u.count}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={glassCardSx({ blur: 12, accent: '#1976d2' })}>
              <Typography variant="h6">Recent Activity</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Detail</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivity.slice(0, 10).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.detail}</TableCell>
                        <TableCell>{item.date ? new Date(item.date).toLocaleString() : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={exportCSV}>Export CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportPDF}>Export PDF</Button>
          <Button variant="contained" color="success" onClick={exportExcel}>Export Excel</Button>
        </Box>
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsDashboard; 