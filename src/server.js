// src/server.js
const app = require('./app');

// AWS Elastic Beanstalk define a porta automaticamente via process.env.PORT
const PORT = process.env.PORT || 8080;

// CRÍTICO: Use '0.0.0.0' para aceitar conexões externas na nuvem
// Nunca use '127.0.0.1' em ambientes cloud
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SA-MP API rodando na porta ${PORT}`);
  console.log(`🌐 Host: 0.0.0.0 (aceitando conexões externas)`);
  console.log(`📡 Endpoint: /query?ip=127.0.0.1&port=7777`);
  console.log(`🏥 Health: /health`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown para AWS
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recebido. Fechando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recebido. Fechando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

// Error handler global
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

module.exports = server;
