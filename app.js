// Load .env into process.env
require('dotenv').config();

const express = require('express');
const helmet = require('helmet'); // Sets secure HTTP headers
const cors = require('cors'); // Controls which origins may call us
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const adminRoutes = require('./routes/admin');
const { authLimiter, globalLimiter } = require('./middleware/rateLimiters');
const authenticate = require('./middleware/auth');
const requireAuth = require('./middleware/requireAuth');

const app = express();

// --- Security & basics --- //

//Secure headers (XSS, clickjacking, etc.)
app.use(helmet());

// CORS — in dev we allow localhost frontends. Adjust when you wire a real UI.
//    credentials:true allows cookies (for refresh token) to be sent in later phases.
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// Body + cookie parsing
app.use(express.json());
app.use(cookieParser());

// Global rate limit (coarse). We’ll add stricter limits to /auth later.
app.use(globalLimiter);

app.use('/auth', authLimiter); // tighter limits on auth endpoints
app.use('/auth', authRoutes);
app.use('/auth', sessionRoutes); // authenticated user session management
app.use('/admin', adminRoutes); // admin maintenance endpoints

// --- Health check --- //

// Lightweight readiness/liveness probe for Docker/Load Balancers.
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'auth-service',
    env: process.env.NODE_ENV || 'development',
  });
});

app.get('/me', authenticate, requireAuth, (req, res) => {
  res.json({ id: req.user.id, msg: 'Access token valid.' });
});

// --- 404 + centralized error handler --- //

// If a route isn’t matched, return a safe 404 JSON
app.use((req, res, _next) => {
  res
    .status(404)
    .json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Never leak stack traces to clients; log internally instead.
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  const message = err.publicMessage || 'Internal Server Error';
  res.status(status).json({ error: message });
});

module.exports = app;
