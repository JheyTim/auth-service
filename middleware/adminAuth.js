// Minimal admin guard using a static bearer token from env.
// In real life, use RBAC + proper admin auth (e.g., SSO, privileged role).
module.exports = function adminAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    return res.status(401).json({ error: 'Admin auth required' });
  }
  next();
};
