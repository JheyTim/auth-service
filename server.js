// Boot file. Keeps app.js framework-agnostic (handy for testing).

const http = require('http');
const app = require('./app');
const { sequelize } = require('./models'); // <— uses src/config/db.js

const PORT = process.env.PORT || 4000;

// Create an HTTP server explicitly (gives you future flexibility: websockets, TLS, etc.)
const server = http.createServer(app);

(async () => {
  try {
    // Ensure DB credentials are valid before accepting traffic
    await sequelize.authenticate();
    console.log('DB connected');

    server.listen(PORT, () => {
      console.log(`Auth service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect DB:', err);
    process.exit(1);
  }
})();

// Graceful shutdown for Docker/K8s (prevents hard kills during deploys)
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down...`);
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
