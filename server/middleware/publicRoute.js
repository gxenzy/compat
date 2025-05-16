/**
 * Middleware to mark routes as public
 * This middleware is a no-op, it just passes the request through
 * without authentication checks. It's used to explicitly indicate
 * that a route is public in the code.
 */
module.exports = function(req, res, next) {
  // Public route - no authentication needed
  // Just pass to the next middleware
  next();
}; 