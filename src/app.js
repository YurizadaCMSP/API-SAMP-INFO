// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const queryRoute = require('./routes/query.route');
const rateLimit = require('./middlewares/rateLimit');

const app = express();

const API_INFO = {
  name: 'SA-MP INFO API',
  url: 'https://api.sampinfo.qzz.io',
  version: '2.0.0',
  description: 'API profissional para consulta de servidores SA-MP em tempo real',
  documentation: 'https://api.sampinfo.qzz.io',
  github: 'https://github.com/seu-usuario/samp-info-api'
};

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  credentials: false,
  maxAge: 86400
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Header de identificação em todas as respostas
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'SA-MP INFO API');
  res.setHeader('X-API-Version', API_INFO.version);
  res.setHeader('X-API-URL', API_INFO.url);
  next();
});

// Health check detalhado
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  const healthData = {
    status: 'healthy',
    api_info: API_INFO,
    system: {
      uptime_seconds: Math.floor(uptime),
      uptime_human: formatUptime(uptime),
      memory: {
        used_mb: Math.round(memory.heapUsed / 1024 / 1024),
        total_mb: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      },
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version
    },
    rate_limit: rateLimit.getStats(),
    endpoints: {
      query: {
        path: '/query',
        method: 'GET',
        parameters: {
          ip: 'string (required) - IPv4 address',
          port: 'number (required) - Port 1-65535'
        },
        example: 'https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777'
      },
      health: {
        path: '/health',
        method: 'GET',
        description: 'API health status and metrics'
      },
      status: {
        path: '/',
        method: 'GET',
        description: 'Web status page'
      }
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(healthData);
});

// Routes
app.use('/query', queryRoute);

// Root - Status page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    message: `O endpoint ${req.method} ${req.path} não existe`,
    available_endpoints: [
      'GET /query?ip=<IP>&port=<PORT>',
      'GET /health',
      'GET /'
    ],
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro ao processar sua requisição' 
      : err.message,
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

module.exports = app;
