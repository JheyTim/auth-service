const router = require('express').Router();
const ctrl = require('../controllers/session');
const authenticate = require('../middleware/auth');
const requireAuth = require('../middleware/requireAuth');

// List my active sessions (refresh tokens)
router.get('/sessions', authenticate, requireAuth, ctrl.listMySessions);

// Self-service global revoke (bump tokenVersion + delete all RTs)
router.post(
  '/sessions/revoke-all',
  authenticate,
  requireAuth,
  ctrl.revokeAllMySessions
);

module.exports = router;
