// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
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

// Armazena métricas de CPU ao longo do tempo
let lastCpuUsage = process.cpuUsage();
let lastCpuCheck = Date.now();

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

/**
 * Calcula uso real de CPU com base no tempo decorrido
 */
function getCpuUsage() {
  const currentUsage = process.cpuUsage(lastCpuUsage);
  const currentTime = Date.now();
  const timeDiff = currentTime - lastCpuCheck;
  
  // Atualiza para próxima medição
  lastCpuUsage = process.cpuUsage();
  lastCpuCheck = currentTime;
  
  // Calcula percentual de uso
  const totalUsage = (currentUsage.user + currentUsage.system) / 1000; // converte para ms
  const cpuPercent = (totalUsage / timeDiff) * 100;
  
  return {
    user_ms: Math.round(currentUsage.user / 1000),
    system_ms: Math.round(currentUsage.system / 1000),
    total_ms: Math.round(totalUsage),
    percentage: Math.min(100, Math.max(0, cpuPercent.toFixed(2)))
  };
}

/**
 * Obtém informações detalhadas de memória
 */
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
      array_buffers_mb: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024),
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

/**
 * Obtém informações de CPU do sistema
 */
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

/**
 * Obtém informações de rede e localização
 */
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

/**
 * Obtém informações do sistema operacional
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    hostname: os.hostname(),
    home_dir: os.homedir(),
    temp_dir: os.tmpdir(),
    endianness: os.endianness(),
    load_average: os.loadavg()
  };
}

/**
 * Detecta região AWS baseada em variáveis de ambiente e hostname
 */
function detectAwsRegion() {
  // Tenta obter região das variáveis de ambiente
  const awsRegion = process.env.AWS_REGION || 
                    process.env.AWS_DEFAULT_REGION || 
                    process.env.AWS_EXECUTION_ENV;
  
  if (awsRegion) return awsRegion;
  
  // Tenta inferir da hostname
  const hostname = os.hostname();
  if (hostname.includes('us-east')) return 'us-east-1';
  if (hostname.includes('us-west')) return 'us-west-2';
  if (hostname.includes('sa-east')) return 'sa-east-1';
  if (hostname.includes('eu-west')) return 'eu-west-1';
  
  return 'unknown';
}

// Health check COMPLETO e DETALHADO
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
    
    // Métricas do Processo Node.js
    process: {
      pid: process.pid,
      uptime_seconds: Math.floor(uptime),
      uptime_human: formatUptime(uptime),
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      title: process.title,
      argv: process.argv,
      execPath: process.execPath
    },
    
    // Informações de CPU REAIS
    cpu: {
      usage: cpu,
      info: cpuInfo,
      cores_available: cpuInfo.count
    },
    
    // Informações de Memória REAIS
    memory: memory,
    
    // Sistema Operacional
    system: system,
    
    // Informações de Rede
    network: {
      interfaces: network,
      hostname: os.hostname()
    },
    
    // Localização AWS (estimada)
    cloud: {
      provider: 'AWS App Runner',
      region: detectAwsRegion(),
      environment: process.env.NODE_ENV || 'development',
      aws_execution_env: process.env.AWS_EXECUTION_ENV || null,
      aws_region: process.env.AWS_REGION || null
    },
    
    // Variáveis de Ambiente (apenas as seguras)
    environment: {
      node_env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 8080,
      cache_ttl: process.env.CACHE_TTL_SECONDS || 10,
      query_timeout: process.env.QUERY_TIMEOUT_MS || 3000,
      rate_limit_window: process.env.RATE_LIMIT_WINDOW_MS || 60000,
      rate_limit_max: process.env.RATE_LIMIT_MAX_REQUESTS || 5
    },
    
    // Rate Limiting
    rate_limit: rateLimit.getStats(),
    
    // Endpoints
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
