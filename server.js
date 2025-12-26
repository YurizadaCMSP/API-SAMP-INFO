// server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SA-MP API rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: /query?ip=127.0.0.1&port=7777`);
});
