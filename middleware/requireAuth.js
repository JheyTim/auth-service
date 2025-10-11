// Simple guard to ensure authenticate() ran and set req.user.
module.exports = function requireAuth(req, _res, next) {
  if (!req.user) return next({ status: 401, publicMessage: 'Unauthorized' });
  next();
};
