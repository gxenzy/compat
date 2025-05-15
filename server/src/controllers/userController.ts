// import { Request, Response } from 'express';
// import { pool } from '../config/database';
// import * as bcrypt from 'bcrypt';
// import { RowDataPacket, ResultSetHeader } from 'mysql2';
// import { UserRole } from '../types';

// // Custom type for requests with authentication info, but not extending Express.Request
// interface AuthenticatedRequest extends Omit<Request, 'user'> {
//   user?: {
//     id: number;
//     username: string;
//     role: string; // Keep as string to accommodate all role values used in the codebase
//   };
// }

// /**
//  * Get all users
//  * @route GET /api/users
//  * @access Admin only
//  */
// export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     console.log('Getting all users. Requester:', req.user?.username);
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to view all users' });
//     }
    
//     // Get all users from the database
//     const [users] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive, 
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users ORDER BY username`
//     );
    
//     return res.json(users);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return res.status(500).json({ message: 'Error fetching users' });
//   }
// };

// /**
//  * Get user by ID
//  * @route GET /api/users/:id
//  * @access Admin or self only
//  */
// export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
    
//     // Check if user is admin or self
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin' && req.user?.id !== userId) {
//       return res.status(403).json({ message: 'Not authorized to view this user' });
//     }
    
//     // Get user from database
//     const [users] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive, 
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users WHERE id = ?`,
//       [userId]
//     );
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     return res.json(users[0]);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     return res.status(500).json({ message: 'Error fetching user' });
//   }
// };

// /**
//  * Create a new user
//  * @route POST /api/users
//  * @access Admin only
//  */
// export const createUser = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to create users' });
//     }
    
//     const { 
//       username, 
//       email, 
//       password, 
//       firstName, 
//       lastName, 
//       role,
//       student_id 
//     } = req.body;
    
//     // Validate required fields
//     if (!username || !email || !password || !firstName || !lastName || !role) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
    
//     // Validate role
//     const validRoles = ['admin', 'manager', 'auditor', 'reviewer', 'viewer', 'staff', 'moderator', 'user'];
//     if (!validRoles.includes(role.toLowerCase())) {
//       return res.status(400).json({ message: 'Invalid role' });
//     }
    
//     // Validate student_id if provided
//     if (student_id && (student_id.length !== 8 || !/^\d+$/.test(student_id))) {
//       return res.status(400).json({ message: 'Student ID must be an 8-digit number' });
//     }
    
//     // Check if username or email already exists
//     const [existingUsers] = await pool.query<RowDataPacket[]>(
//       'SELECT id FROM users WHERE username = ? OR email = ? OR (student_id = ? AND student_id IS NOT NULL)',
//       [username, email, student_id]
//     );
    
//     if (existingUsers.length > 0) {
//       return res.status(409).json({ message: 'Username, email, or student ID already exists' });
//     }
    
//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
    
//     // Insert user into database
//     const [result] = await pool.query<ResultSetHeader>(
//       `INSERT INTO users (username, email, password, first_name, last_name, role, student_id)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [username, email, hashedPassword, firstName, lastName, role, student_id || null]
//     );
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         'CREATE_USER', 
//         JSON.stringify({ username, email, role, created_by: req.user?.username }),
//         req.ip
//       ]
//     );
    
//     // Get the created user
//     const [newUsers] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive,
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users WHERE id = ?`,
//       [result.insertId]
//     );
    
//     return res.status(201).json(newUsers[0]);
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return res.status(500).json({ message: 'Error creating user' });
//   }
// };

// /**
//  * Update an existing user
//  * @route PUT /api/users/:id
//  * @access Admin or self only (with restrictions)
//  */
// export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
    
//     // Check if user is admin or self
//     const isSelf = req.user?.id === userId;
//     const isAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === 'admin';
    
//     if (!isAdmin && !isSelf) {
//       return res.status(403).json({ message: 'Not authorized to update this user' });
//     }
    
//     // Get current user data
//     const [currentUsers] = await pool.query<RowDataPacket[]>(
//       'SELECT * FROM users WHERE id = ?',
//       [userId]
//     );
    
//     if (currentUsers.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     const currentUser = currentUsers[0];
    
//     // Prepare update data
//     const { 
//       email, 
//       firstName, 
//       lastName, 
//       role, 
//       password, 
//       isActive,
//       student_id 
//     } = req.body;
    
//     // Only admins can change roles or status
//     if (!isAdmin && (role !== undefined || isActive !== undefined)) {
//       return res.status(403).json({ message: 'You cannot change roles or status' });
//     }
    
//     // Validate student_id if provided
//     if (student_id && (student_id.length !== 8 || !/^\d+$/.test(student_id))) {
//       return res.status(400).json({ message: 'Student ID must be an 8-digit number' });
//     }
    
//     // Check if student_id already exists for another user
//     if (student_id) {
//       const [existingStudentId] = await pool.query<RowDataPacket[]>(
//         'SELECT id FROM users WHERE student_id = ? AND id != ?',
//         [student_id, userId]
//       );
      
//       if (existingStudentId.length > 0) {
//         return res.status(409).json({ message: 'Student ID already exists' });
//       }
//     }
    
//     // Prepare query parts
//     const updates = [];
//     const queryParams = [];
    
//     if (email !== undefined && email !== currentUser.email) {
//       // Check if email is already taken
//       const [existingEmails] = await pool.query<RowDataPacket[]>(
//         'SELECT id FROM users WHERE email = ? AND id != ?',
//         [email, userId]
//       );
      
//       if (existingEmails.length > 0) {
//         return res.status(409).json({ message: 'Email already in use' });
//       }
      
//       updates.push('email = ?');
//       queryParams.push(email);
//     }
    
//     if (firstName !== undefined) {
//       updates.push('first_name = ?');
//       queryParams.push(firstName);
//     }
    
//     if (lastName !== undefined) {
//       updates.push('last_name = ?');
//       queryParams.push(lastName);
//     }
    
//     if (role !== undefined && isAdmin) {
//       // Validate role
//       const validRoles = ['admin', 'manager', 'auditor', 'reviewer', 'viewer', 'staff', 'moderator', 'user'];
//       if (!validRoles.includes(role.toLowerCase())) {
//         return res.status(400).json({ message: 'Invalid role' });
//       }
      
//       updates.push('role = ?');
//       queryParams.push(role);
//     }
    
//     if (isActive !== undefined && isAdmin) {
//       updates.push('is_active = ?');
//       queryParams.push(isActive ? 1 : 0);
//     }
    
//     if (password) {
//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);
      
//       updates.push('password = ?');
//       queryParams.push(hashedPassword);
//     }
    
//     if (student_id !== undefined && student_id !== currentUser.student_id) {
//       updates.push('student_id = ?');
//       queryParams.push(student_id || null);
//     }
    
//     // Only proceed if there are updates
//     if (updates.length === 0) {
//       return res.status(400).json({ message: 'No updates provided' });
//     }
    
//     // Add user ID to query params
//     queryParams.push(userId);
    
//     // Update user in database
//     await pool.query(
//       `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
//       queryParams
//     );
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         'UPDATE_USER', 
//         JSON.stringify({ 
//           user_id: userId,
//           updated_fields: Object.keys(req.body).filter(field => field !== 'password'),
//           updated_by: req.user?.username
//         }),
//         req.ip
//       ]
//     );
    
//     // Get the updated user
//     const [updatedUsers] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive,
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users WHERE id = ?`,
//       [userId]
//     );
    
//     return res.json(updatedUsers[0]);
//   } catch (error) {
//     console.error('Error updating user:', error);
//     return res.status(500).json({ message: 'Error updating user' });
//   }
// };

// /**
//  * Delete a user
//  * @route DELETE /api/users/:id
//  * @access Admin only
//  */
// export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to delete users' });
//     }
    
//     // Get user before deleting for audit log
//     const [users] = await pool.query<RowDataPacket[]>(
//       'SELECT username, email FROM users WHERE id = ?',
//       [userId]
//     );
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     const userToDelete = users[0];
    
//     // Prevent deleting oneself
//     if (req.user?.id === userId) {
//       return res.status(400).json({ message: 'You cannot delete your own account' });
//     }
    
//     // Delete user from database
//     await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         'DELETE_USER', 
//         JSON.stringify({ 
//           user_id: userId,
//           username: userToDelete.username,
//           email: userToDelete.email,
//           deleted_by: req.user?.username
//         }),
//         req.ip
//       ]
//     );
    
//     return res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     return res.status(500).json({ message: 'Error deleting user' });
//   }
// };

// /**
//  * Toggle user status (activate/deactivate)
//  * @route PUT /api/users/:id/toggle-status
//  * @access Admin only
//  */
// export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to change user status' });
//     }
    
//     // Get current user data
//     const [users] = await pool.query<RowDataPacket[]>(
//       'SELECT id, username, is_active FROM users WHERE id = ?',
//       [userId]
//     );
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     const user = users[0];
    
//     // Prevent changing own status
//     if (req.user?.id === userId) {
//       return res.status(400).json({ message: 'You cannot change your own status' });
//     }
    
//     // Toggle status
//     const newStatus = user.is_active ? 0 : 1;
    
//     // Update user status
//     await pool.query(
//       'UPDATE users SET is_active = ? WHERE id = ?',
//       [newStatus, userId]
//     );
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 
//         JSON.stringify({ 
//           user_id: userId,
//           username: user.username,
//           performed_by: req.user?.username
//         }),
//         req.ip
//       ]
//     );
    
//     // Get the updated user
//     const [updatedUsers] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive,
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users WHERE id = ?`,
//       [userId]
//     );
    
//     return res.json(updatedUsers[0]);
//   } catch (error) {
//     console.error('Error toggling user status:', error);
//     return res.status(500).json({ message: 'Error toggling user status' });
//   }
// };

// /**
//  * Reset a user's password
//  * @route POST /api/users/:id/reset-password
//  * @access Admin only
//  */
// export const resetPassword = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
//     const { newPassword } = req.body;
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to reset passwords' });
//     }
    
//     if (!newPassword || newPassword.length < 6) {
//       return res.status(400).json({ message: 'Password must be at least 6 characters' });
//     }
    
//     // Get user to reset
//     const [users] = await pool.query<RowDataPacket[]>(
//       'SELECT username FROM users WHERE id = ?',
//       [userId]
//     );
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Hash new password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
    
//     // Update password
//     await pool.query(
//       'UPDATE users SET password = ? WHERE id = ?',
//       [hashedPassword, userId]
//     );
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         'RESET_PASSWORD', 
//         JSON.stringify({ 
//           user_id: userId,
//           username: users[0].username,
//           reset_by: req.user?.username
//         }),
//         req.ip
//       ]
//     );
    
//     return res.json({ message: 'Password reset successfully' });
//   } catch (error) {
//     console.error('Error resetting password:', error);
//     return res.status(500).json({ message: 'Error resetting password' });
//   }
// };

// /**
//  * Bulk update users
//  * @route PATCH /api/users/bulk
//  * @access Admin only
//  */
// export const bulkUpdateUsers = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { userIds, updates } = req.body;
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized for bulk operations' });
//     }
    
//     // Validate inputs
//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       return res.status(400).json({ message: 'User IDs are required' });
//     }
    
//     if (!updates || Object.keys(updates).length === 0) {
//       return res.status(400).json({ message: 'No updates provided' });
//     }
    
//     // Only allow certain fields to be updated in bulk
//     const allowedFields = ['role', 'is_active'];
//     const updateFields = Object.keys(updates);
    
//     const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
//     if (invalidFields.length > 0) {
//       return res.status(400).json({ 
//         message: `Invalid fields for bulk update: ${invalidFields.join(', ')}` 
//       });
//     }
    
//     // Prevent updating yourself in bulk operations
//     if (userIds.includes(req.user?.id)) {
//       return res.status(400).json({ message: 'You cannot include yourself in bulk operations' });
//     }
    
//     // Prepare update query
//     const updateClauses = [];
//     const queryParams = [];
    
//     if (updates.role !== undefined) {
//       // Validate role
//       const validRoles = ['admin', 'manager', 'auditor', 'reviewer', 'viewer', 'staff', 'moderator', 'user'];
//       if (!validRoles.includes(String(updates.role).toLowerCase())) {
//         return res.status(400).json({ message: 'Invalid role' });
//       }
      
//       updateClauses.push('role = ?');
//       queryParams.push(updates.role);
//     }
    
//     if (updates.is_active !== undefined) {
//       updateClauses.push('is_active = ?');
//       queryParams.push(updates.is_active ? 1 : 0);
//     }
    
//     // Convert userIds to a string for the SQL IN clause
//     const userIdPlaceholders = userIds.map(() => '?').join(',');
//     queryParams.push(...userIds);
    
//     // Execute bulk update
//     await pool.query(
//       `UPDATE users SET ${updateClauses.join(', ')} WHERE id IN (${userIdPlaceholders})`,
//       queryParams
//     );
    
//     // Log the action for audit trail
//     await pool.query(
//       `INSERT INTO audit_logs (user_id, action, details, ip_address, timestamp)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [
//         req.user?.id, 
//         'BULK_UPDATE_USERS', 
//         JSON.stringify({ 
//           user_ids: userIds,
//           updates: updates,
//           performed_by: req.user?.username
//         }),
//         req.ip
//       ]
//     );
    
//     // Get updated users
//     const [updatedUsers] = await pool.query<RowDataPacket[]>(
//       `SELECT id, username, email, student_id, first_name AS firstName, 
//        last_name AS lastName, role, is_active AS isActive,
//        created_at AS createdAt, updated_at AS updatedAt 
//        FROM users WHERE id IN (${userIdPlaceholders})`,
//       userIds
//     );
    
//     return res.json(updatedUsers);
//   } catch (error) {
//     console.error('Error in bulk update:', error);
//     return res.status(500).json({ message: 'Error updating users' });
//   }
// };

// /**
//  * Get audit logs for a user
//  * @route GET /api/users/:id/audit-logs
//  * @access Admin only
//  */
// export const getUserAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = parseInt(req.params.id, 10);
    
//     // Check if user is admin
//     if (req.user?.role !== UserRole.ADMIN && req.user?.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to view audit logs' });
//     }
    
//     // Check if user exists
//     const [users] = await pool.query<RowDataPacket[]>(
//       'SELECT id FROM users WHERE id = ?',
//       [userId]
//     );
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Get audit logs for the user
//     const [logs] = await pool.query<RowDataPacket[]>(
//       `SELECT * FROM audit_logs WHERE 
//        user_id = ? OR 
//        details LIKE ? 
//        ORDER BY timestamp DESC LIMIT 100`,
//       [userId, `%"user_id":${userId}%`]
//     );
    
//     return res.json(logs);
//   } catch (error) {
//     console.error('Error fetching audit logs:', error);
//     return res.status(500).json({ message: 'Error fetching audit logs' });
//   }
// }; 