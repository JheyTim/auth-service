const router = require('express').Router();
const ctrl = require('../controllers/admin');
const adminAuth = require('../middleware/adminAuth');

// All routes below require: Authorization: Bearer <ADMIN_API_TOKEN>
router.use(adminAuth);

// Bump tokenVersion and delete all refresh tokens for the user (email or numeric ID)
router.post('/users/revoke-all', ctrl.adminGlobalRevoke);

// List a user's sessions
router.get('/users/sessions', ctrl.adminListSessions);

// Delete a user's sessions without bumping tokenVersion (less disruptive)
router.post('/users/sessions/delete', ctrl.adminDeleteSessions);

module.exports = router;
