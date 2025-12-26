const express = require('express');
const cors = require('cors');
const queryRoute = require('./routes/query.route');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'SA-MP Info API',
    version: '1.0.0',
    endpoints: {
      query: '/query?ip=127.0.0.1&port=7777'
    },
    docs: 'https://github.com/seu-usuario/samp-info-api'
  });
});

// Rotas
app.use('/query', queryRoute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: 'Utilize /query?ip=<IP>&port=<PORTA>'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

module.exports = app;
