// Boot file. Keeps app.js framework-agnostic (handy for testing).

const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 4000;

// Create an HTTP server explicitly (gives you future flexibility: websockets, TLS, etc.)
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`);
});

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
