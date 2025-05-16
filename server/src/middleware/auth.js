const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware to authenticate JWT token but allow requests without tokens
 */
const optionalAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // No token provided, continue without authentication
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    console.error('Optional auth error:', error.message);
    next();
  }
};

/**
 * Middleware to authorize based on role
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Authentication required.' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth
}; 