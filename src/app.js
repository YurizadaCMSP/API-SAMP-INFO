// src/app.js - v2.0.1
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const queryRoute = require('./routes/query.route');
const rateLimit = require('./middlewares/rateLimit');
const cache = require('./services/cache.service');
const sampService = require('./services/samp.service');

const app = express();

const API_INFO = {
  name: 'SA-MP INFO API',
  url: 'https://api.sampinfo.qzz.io',
  version: '2.0.1',
  description: 'API profissional para consulta de servidores SA-MP - Versão melhorada com suporte a hostnames',
  documentation: 'https://api.sampinfo.qzz.io',
  github: 'https://github.com/seu-usuario/samp-info-api',
  features: [
    'Suporte a IPv4 e Hostnames',
    'Sistema de fallback com 4 bibliotecas',
    'Cache inteligente multi-layer',
    'Rate limiting avançado com fila',
    'Detecção de padrões de ataque',
    'Estatísticas em tempo real'
  ]
};

// Armazena métricas de CPU ao longo do tempo
let lastCpuUsage = process.cpuUsage();
let lastCpuCheck = Date.now();

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS', 'POST'],
  credentials: false,
  maxAge: 86400
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Header de identificação em todas as respostas
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'SA-MP INFO API v2.0.1');
  res.setHeader('X-API-Version', API_INFO.version);
  res.setHeader('X-API-URL', API_INFO.url);
  next();
});

/**
 * Calcula uso real de CPU
 */
function getCpuUsage() {
  const currentUsage = process.cpuUsage(lastCpuUsage);
  const currentTime = Date.now();
  const timeDiff = currentTime - lastCpuCheck;
  
  lastCpuUsage = process.cpuUsage();
  lastCpuCheck = currentTime;
  
  const totalUsage = (currentUsage.user + currentUsage.system) / 1000;
  const cpuPercent = (totalUsage / timeDiff) * 100;
  
  return {
    user_ms: Math.round(currentUsage.user / 1000),
    system_ms: Math.round(currentUsage.system / 1000),
    total_ms: Math.round(totalUsage),
    percentage: Math.min(100, Math.max(0, cpuPercent.toFixed(2)))
  };
}

function getMemoryInfo() {
  const memUsage = process.memoryUsage();
  const totalSystemMemory = os.totalmem();
  const freeSystemMemory = os.freemem();
  
  return {
    process: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024),
      heap_percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    system: {
      total_mb: Math.round(totalSystemMemory / 1024 / 1024),
      free_mb: Math.round(freeSystemMemory / 1024 / 1024),
      used_mb: Math.round((totalSystemMemory - freeSystemMemory) / 1024 / 1024),
      percentage: Math.round(((totalSystemMemory - freeSystemMemory) / totalSystemMemory) * 100)
    }
  };
}

function getCpuInfo() {
  const cpus = os.cpus();
  
  return {
    count: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    speed_mhz: cpus[0]?.speed || 0,
    architecture: os.arch(),
    cores: cpus.map((cpu, index) => ({
      core: index,
      model: cpu.model,
      speed_mhz: cpu.speed
    }))
  };
}

function getNetworkInfo() {
  const networkInterfaces = os.networkInterfaces();
  const interfaces = [];
  
  for (const [name, nets] of Object.entries(networkInterfaces)) {
    for (const net of nets) {
      interfaces.push({
        interface: name,
        address: net.address,
        family: net.family,
        internal: net.internal,
        mac: net.mac
      });
    }
  }
  
  return interfaces;
}

function getSystemInfo() {
  return {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    hostname: os.hostname(),
    endianness: os.endianness(),
    load_average: os.loadavg()
  };
}

function detectAwsRegion() {
  const awsRegion = process.env.AWS_REGION || 
                    process.env.AWS_DEFAULT_REGION || 
                    process.env.AWS_EXECUTION_ENV;
  
  if (awsRegion) return awsRegion;
  
  const hostname = os.hostname();
  if (hostname.includes('us-east')) return 'us-east-1';
  if (hostname.includes('us-west')) return 'us-west-2';
  if (hostname.includes('sa-east')) return 'sa-east-1';
  if (hostname.includes('eu-west')) return 'eu-west-1';
  
  return 'unknown';
}

// 🏥 Health check COMPLETO
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memory = getMemoryInfo();
  const cpu = getCpuUsage();
  const cpuInfo = getCpuInfo();
  const system = getSystemInfo();
  const network = getNetworkInfo();
  
  const healthData = {
    status: 'healthy',
    api_info: API_INFO,
    process: {
      pid: process.pid,
      uptime_seconds: Math.floor(uptime),
      uptime_human: formatUptime(uptime),
      node_version: process.version
    },
    cpu: {
      usage: cpu,
      info: cpuInfo
    },
    memory: memory,
    system: system,
    network: {
      interfaces: network,
      hostname: os.hostname()
    },
    cloud: {
      provider: 'AWS App Runner',
      region: detectAwsRegion(),
      environment: process.env.NODE_ENV || 'development'
    },
    rate_limit: rateLimit.getStats(),
    cache: cache.getStats(),
    timestamp: new Date().toISOString()
  };
  
  res.json(healthData);
});

// 📊 Endpoint de estatísticas do cache
app.get('/cache/stats', (req, res) => {
  const stats = cache.getStats();
  
  res.json({
    success: true,
    cache: stats,
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

// 🔍 Endpoint para listar chaves no cache
app.get('/cache/keys', (req, res) => {
  const keys = cache.keys();
  
  res.json({
    success: true,
    total: keys.length,
    keys: keys,
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

// 🔎 Endpoint para buscar no cache
app.get('/cache/search', (req, res) => {
  const { pattern } = req.query;
  
  if (!pattern) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetro "pattern" é obrigatório',
      example: '/cache/search?pattern=127.0.0.1'
    });
  }
  
  try {
    const results = cache.search(pattern);
    
    res.json({
      success: true,
      pattern: pattern,
      total: results.length,
      results: results,
      api_info: API_INFO,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Padrão de busca inválido',
      message: error.message
    });
  }
});

// 🗑️ Endpoint para limpar cache (admin)
app.post('/cache/clear', (req, res) => {
  // TODO: Adicionar autenticação
  const cleared = cache.clear();
  
  res.json({
    success: true,
    message: 'Cache limpo com sucesso',
    entries_cleared: cleared,
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

// 📊 Endpoint de estatísticas do rate limiter
app.get('/ratelimit/stats', (req, res) => {
  const stats = rateLimit.getStats();
  
  res.json({
    success: true,
    rate_limit: stats,
    api_info: API_INFO,
    timestamp: new Date().toISOString()
  });
});

// ℹ️ Endpoint de informações da API
app.get('/info', (req, res) => {
  res.json({
    ...API_INFO,
    endpoints: {
      query: {
        path: '/query',
        method: 'GET',
        description: 'Consulta servidor SA-MP',
        parameters: {
          ip: 'string (required) - IPv4 ou hostname',
          port: 'number (required) - Porta 1-65535'
        },
        examples: {
          ipv4: '/query?ip=127.0.0.1&port=7777',
          hostname: '/query?ip=servidor.com.br&port=7777'
        }
      },
      health: {
        path: '/health',
        method: 'GET',
        description: 'Status e métricas da API'
      },
      cache_stats: {
        path: '/cache/stats',
        method: 'GET',
        description: 'Estatísticas do sistema de cache'
      },
      cache_keys: {
        path: '/cache/keys',
        method: 'GET',
        description: 'Lista chaves no cache'
      },
      cache_search: {
        path: '/cache/search',
        method: 'GET',
        description: 'Busca servidores no cache',
        parameters: {
          pattern: 'string (required) - Padrão de busca (regex)'
        }
      },
      ratelimit_stats: {
        path: '/ratelimit/stats',
        method: 'GET',
        description: 'Estatísticas do rate limiter'
      },
      info: {
        path: '/info',
        method: 'GET',
        description: 'Informações sobre a API'
      }
    },
    changes: {
      version: '2.0.1',
      date: '2025-01-02',
      improvements: [
        'Suporte a hostnames/domínios além de IPs',
        'Sistema de fallback com 4 bibliotecas (GameDig, samp-query-plus, samp-query, dgram)',
        'Cache inteligente com TTL dinâmico',
        'Rate limiting avançado com sistema de fila',
        'Detecção de padrões de ataque DDoS',
        'Whitelist e Blacklist de IPs',
        'Novos endpoints de estatísticas',
        'Melhorias de performance e estabilidade'
      ]
    },
    timestamp: new Date().toISOString()
  });
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
      'GET /query?ip=<HOST>&port=<PORT>',
      'GET /health',
      'GET /info',
      'GET /cache/stats',
      'GET /cache/keys',
      'GET /cache/search?pattern=<PATTERN>',
      'GET /ratelimit/stats',
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
