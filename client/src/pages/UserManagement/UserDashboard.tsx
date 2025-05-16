import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, List, ListItem, ListItemText, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem, Avatar } from '@mui/material';
import LoadingSpinner from '../../components/LoadingSpinner';
import { User, UserRole, UserWithId } from '../../types';
import socketService from '../../services/socketService';

const roleOptions = Object.values(UserRole);

const UserDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createUser, setCreateUser] = useState<Partial<UserWithId>>({ role: UserRole.VIEWER });
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<UserWithId | null>(null);
  const [editFields, setEditFields] = useState<Partial<UserWithId>>({});
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success'|'error' }>({ open: false, message: '', severity: 'success' });

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    fetch('/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
    
    // Real-time updates
    const socket = socketService.connect();
    
    // Only set up event listeners if socket connection is successful
    if (socket) {
      // Add event listeners
      socket.on('userUpdate', fetchUsers);
      socket.on('userDelete', fetchUsers);

      // Return cleanup function that removes listeners and disconnects
      return () => {
        // Ensure socket still exists when cleanup runs
        if (socket) {
          socket.off('userUpdate', fetchUsers);
          socket.off('userDelete', fetchUsers);
        }
        socketService.disconnect();
      };
    }
    
    // Return a cleanup function even if we didn't connect
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Create
  const handleCreate = () => {
    setCreating(true);
    fetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createUser, password: createPassword }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
      })
      .then(() => {
        setSnackbar({ open: true, message: 'User created!', severity: 'success' });
        setCreateUser({ role: UserRole.VIEWER });
        setCreatePassword('');
        fetchUsers();
      })
      .catch(err => setSnackbar({ open: true, message: err.message, severity: 'error' }))
      .finally(() => setCreating(false));
  };

  // Edit
  const openEdit = (user: UserWithId) => {
    setEditUser(user);
    setEditFields({ ...user });
    setEditPassword('');
  };
  const handleEdit = () => {
    if (!editUser) return;
    setEditLoading(true);
    fetch(`/users/${editUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editFields, ...(editPassword ? { password: editPassword } : {}) }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
      })
      .then(() => {
        setSnackbar({ open: true, message: 'User updated!', severity: 'success' });
        setEditUser(null);
        fetchUsers();
      })
      .catch(err => setSnackbar({ open: true, message: err.message, severity: 'error' }))
      .finally(() => setEditLoading(false));
  };

  // Delete
  const handleDelete = (user: UserWithId) => {
    setDeleteLoading(user._id || '');
    fetch(`/users/${user._id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete user');
        return res.json();
      })
      .then(() => {
        setSnackbar({ open: true, message: 'User deleted!', severity: 'success' });
        fetchUsers();
      })
      .catch(err => setSnackbar({ open: true, message: err.message, severity: 'error' }))
      .finally(() => setDeleteLoading(null));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isEdit = false) => {
    const newRole = e.target.value as UserRole;
    if (isEdit) {
      setEditFields((f: Partial<UserWithId>) => ({ ...f, role: newRole }));
    } else {
      setCreateUser((u: Partial<UserWithId>) => ({ ...u, role: newRole }));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      {/* Create User Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Create New User</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField label="Username" value={createUser.username || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUser((u: Partial<UserWithId>) => ({ ...u, username: e.target.value }))} size="small" />
          <TextField label="Email" value={createUser.email || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUser((u: Partial<UserWithId>) => ({ ...u, email: e.target.value }))} size="small" />
          <TextField label="First Name" value={createUser.firstName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUser((u: Partial<UserWithId>) => ({ ...u, firstName: e.target.value }))} size="small" />
          <TextField label="Last Name" value={createUser.lastName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUser((u: Partial<UserWithId>) => ({ ...u, lastName: e.target.value }))} size="small" />
          <TextField label="Password" type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} size="small" />
          <TextField select label="Role" value={createUser.role || UserRole.VIEWER} onChange={e => handleRoleChange(e)} size="small">
            {roleOptions.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
          </TextField>
          <Button variant="contained" color="primary" onClick={handleCreate} disabled={creating || !createUser.username || !createUser.email || !createUser.firstName || !createUser.lastName || !createPassword}>
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </Box>
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">All Users</Typography>
            <List>
              {users.map((user: UserWithId) => (
                <ListItem key={user._id} secondaryAction={
                  <>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => openEdit(user)}>Edit</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(user)} disabled={deleteLoading === user._id}>
                      {deleteLoading === user._id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                }>
                  <Avatar src={user.profileImage} sx={{ mr: 2 }}>{user.firstName?.[0]}</Avatar>
                  <ListItemText
                    primary={`${user.firstName} ${user.lastName} (${user.username})`}
                    secondary={
                      <>
                        <span>Email: {user.email}</span><br />
                        <span>Role: {user.role}</span><br />
                        <span>Status: {user.isActive ? 'Active' : 'Inactive'}</span><br />
                        {user.createdAt && <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      {/* Edit User Modal */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
          <TextField label="Username" value={editFields.username || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: Partial<UserWithId>) => ({ ...f, username: e.target.value }))} />
          <TextField label="Email" value={editFields.email || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: Partial<UserWithId>) => ({ ...f, email: e.target.value }))} />
          <TextField label="First Name" value={editFields.firstName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: Partial<UserWithId>) => ({ ...f, firstName: e.target.value }))} />
          <TextField label="Last Name" value={editFields.lastName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: Partial<UserWithId>) => ({ ...f, lastName: e.target.value }))} />
          <TextField label="Password (leave blank to keep)" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
          <TextField select label="Role" value={editFields.role || UserRole.VIEWER} onChange={e => handleRoleChange(e, true)}>
            {roleOptions.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" color="primary" disabled={editLoading || !editFields.username || !editFields.email || !editFields.firstName || !editFields.lastName}>
            {editLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDashboard; 