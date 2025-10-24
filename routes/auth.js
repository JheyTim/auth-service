const router = require('express').Router();
const ctrl = require('../controllers/auth');
const authenticate = require('../middleware/auth');
const requireAuth = require('../middleware/requireAuth');

// Register + login
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, requireAuth, ctrl.logout);

module.exports = router;
