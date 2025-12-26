// src/server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 SA-MP API rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: /query?ip=127.0.0.1&port=7777`);
  console.log(`🏥 Health: /health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});

module.exports = server;
