// src/middlewares/rateLimit.js - v2.0.1

/**
 * 🛡️ Sistema Avançado de Rate Limiting com Fila
 * 
 * Features:
 * - Rate limiting por IP com janela deslizante
 * - Sistema de fila para requisições excedentes
 * - Bloqueio automático de IPs abusivos
 * - Whitelist e Blacklist
 * - Detecção de padrões de ataque
 * - Estatísticas em tempo real
 */

class AdvancedRateLimiter {
  constructor() {
    // Configurações
    this.WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minuto
    this.MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5;
    this.BLOCK_DURATION_MS = parseInt(process.env.RATE_LIMIT_BLOCK_MS) || 300000; // 5 minutos
    this.ABUSE_THRESHOLD = parseInt(process.env.RATE_LIMIT_ABUSE_THRESHOLD) || 20;
    this.QUEUE_ENABLED = process.env.RATE_LIMIT_QUEUE_ENABLED !== 'false';
    this.QUEUE_MAX_SIZE = parseInt(process.env.RATE_LIMIT_QUEUE_MAX_SIZE) || 100;
    this.QUEUE_TIMEOUT_MS = parseInt(process.env.RATE_LIMIT_QUEUE_TIMEOUT_MS) || 30000; // 30s
    
    // Armazenamento
    this.requests = new Map(); // IP -> [timestamps]
    this.blocked = new Map(); // IP -> { timestamp, reason, count }
    this.whitelist = new Set(); // IPs permitidos sem limite
    this.blacklist = new Set(); // IPs permanentemente bloqueados
    this.queue = new Map(); // IP -> { queue: [], processing: boolean }
    
    // Estatísticas
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      queuedRequests: 0,
      abusiveIps: 0,
      startTime: Date.now()
    };
    
    // Padrões de ataque detectados
    this.attackPatterns = new Map();
    
    // Inicia limpeza automática
    setInterval(() => this.cleanup(), 60000);
    
    console.log('🛡️ Rate Limiter avançado iniciado');
    console.log(`📊 Configuração: ${this.MAX_REQUESTS} req/${this.WINDOW_MS}ms`);
    console.log(`🚦 Fila: ${this.QUEUE_ENABLED ? 'Ativada' : 'Desativada'}`);
  }

  /**
   * 🔍 Extrai ID do cliente (IP)
   */
  getClientId(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.headers['cf-connecting-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * ✅ Verifica se IP está na whitelist
   */
  isWhitelisted(clientId) {
    return this.whitelist.has(clientId);
  }

  /**
   * 🚫 Verifica se IP está na blacklist
   */
  isBlacklisted(clientId) {
    return this.blacklist.has(clientId);
  }

  /**
   * 🔒 Verifica se IP está bloqueado
   */
  isBlocked(clientId) {
    const blockInfo = this.blocked.get(clientId);
    if (!blockInfo) return false;
    
    // Verifica se o bloqueio expirou
    if (Date.now() - blockInfo.timestamp < this.BLOCK_DURATION_MS) {
      return true;
    }
    
    // Remove bloqueio expirado
    this.blocked.delete(clientId);
    return false;
  }

  /**
   * 🚫 Adiciona IP ao bloqueio
   */
  addBlock(clientId, reason) {
    const existing = this.blocked.get(clientId);
    const count = existing ? existing.count + 1 : 1;
    
    this.blocked.set(clientId, {
      timestamp: Date.now(),
      reason: reason || 'Abuso detectado',
      count: count,
      attackPattern: this.detectAttackPattern(clientId)
    });
    
    this.stats.abusiveIps++;
    
    console.warn(`🚫 IP bloqueado: ${clientId} - ${reason} (bloqueio #${count})`);
    
    // Se bloqueado 3+ vezes, adiciona à blacklist
    if (count >= 3) {
      this.blacklist.add(clientId);
      console.error(`⚠️ IP adicionado à blacklist: ${clientId}`);
    }
  }

  /**
   * 🔍 Detecta padrão de ataque
   */
  detectAttackPattern(clientId) {
    const reqs = this.requests.get(clientId) || [];
    
    if (reqs.length < 5) return 'unknown';
    
    // Calcula intervalos entre requisições
    const intervals = [];
    for (let i = 1; i < reqs.length; i++) {
      intervals.push(reqs[i] - reqs[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Padrões
    if (avgInterval < 100) return 'ddos-flood'; // Requisições muito rápidas
    if (avgInterval < 1000 && intervals.every(i => Math.abs(i - avgInterval) < 100)) {
      return 'automated-bot'; // Intervalos muito regulares
    }
    if (reqs.length > this.ABUSE_THRESHOLD) return 'excessive-requests';
    
    return 'suspicious';
  }

  /**
   * 📊 Verifica limite
   */
  checkLimit(clientId) {
    this.stats.totalRequests++;
    
    // Whitelist bypass
    if (this.isWhitelisted(clientId)) {
      this.stats.allowedRequests++;
      return { allowed: true, bypassed: true };
    }
    
    // Blacklist
    if (this.isBlacklisted(clientId)) {
      this.stats.blockedRequests++;
      return { 
        allowed: false, 
        blacklisted: true,
        message: 'IP permanentemente bloqueado'
      };
    }
    
    const now = Date.now();
    
    // Inicializa array de requisições
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const userRequests = this.requests.get(clientId);
    
    // Remove requisições antigas (fora da janela)
    const recentRequests = userRequests.filter(time => now - time < this.WINDOW_MS);
    
    // Detecta abuso severo
    if (recentRequests.length >= this.ABUSE_THRESHOLD) {
      this.addBlock(clientId, 'Tentativa de ataque DDoS/Flood');
      this.stats.blockedRequests++;
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(this.BLOCK_DURATION_MS / 1000),
        isAbuse: true,
        blocked: true
      };
    }
    
    // Verifica limite normal
    if (recentRequests.length >= this.MAX_REQUESTS) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((this.WINDOW_MS - (now - oldestRequest)) / 1000);
      
      this.stats.blockedRequests++;
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter: retryAfter,
        isAbuse: false,
        queueAvailable: this.QUEUE_ENABLED
      };
    }
    
    // Adiciona requisição atual
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    
    this.stats.allowedRequests++;
    
    return {
      allowed: true,
      remaining: this.MAX_REQUESTS - recentRequests.length,
      retryAfter: 0
    };
  }

  /**
   * 🚦 Sistema de Fila
   */
  async enqueue(clientId, req, res, next) {
    if (!this.QUEUE_ENABLED) {
      return null;
    }
    
    // Inicializa fila do cliente
    if (!this.queue.has(clientId)) {
      this.queue.set(clientId, { queue: [], processing: false });
    }
    
    const clientQueue = this.queue.get(clientId);
    
    // Verifica limite da fila
    if (clientQueue.queue.length >= this.QUEUE_MAX_SIZE) {
      return null; // Fila cheia
    }
    
    // Adiciona à fila
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Queue timeout'));
      }, this.QUEUE_TIMEOUT_MS);
      
      clientQueue.queue.push({
        req,
        res,
        next,
        resolve,
        reject,
        timeout,
        enqueuedAt: Date.now()
      });
      
      this.stats.queuedRequests++;
      
      // Processa fila
      this.processQueue(clientId);
    });
  }

  /**
   * ⚙️ Processa fila de requisições
   */
  async processQueue(clientId) {
    const clientQueue = this.queue.get(clientId);
    
    if (!clientQueue || clientQueue.processing || clientQueue.queue.length === 0) {
      return;
    }
    
    clientQueue.processing = true;
    
    while (clientQueue.queue.length > 0) {
      const item = clientQueue.queue[0];
      
      // Verifica se ainda tem espaço
      const result = this.checkLimit(clientId);
      
      if (result.allowed) {
        // Remove da fila e processa
        clientQueue.queue.shift();
        clearTimeout(item.timeout);
        item.resolve();
        item.next();
      } else {
        // Aguarda janela de tempo
        await this.sleep(1000);
      }
    }
    
    clientQueue.processing = false;
  }

  /**
   * 🧹 Limpeza automática
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Limpa requisições antigas
    for (const [clientId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < this.WINDOW_MS);
      
      if (recentRequests.length === 0) {
        this.requests.delete(clientId);
        cleaned++;
      } else {
        this.requests.set(clientId, recentRequests);
      }
    }
    
    // Limpa bloqueios expirados
    for (const [clientId, blockInfo] of this.blocked.entries()) {
      if (now - blockInfo.timestamp >= this.BLOCK_DURATION_MS) {
        this.blocked.delete(clientId);
        cleaned++;
      }
    }
    
    // Limpa filas vazias
    for (const [clientId, clientQueue] of this.queue.entries()) {
      if (clientQueue.queue.length === 0 && !clientQueue.processing) {
        this.queue.delete(clientId);
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Rate Limiter cleanup: ${cleaned} entradas removidas`);
    }
  }

  /**
   * 📊 Estatísticas detalhadas
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const allowRate = this.stats.totalRequests > 0
      ? ((this.stats.allowedRequests / this.stats.totalRequests) * 100).toFixed(2)
      : 0;
    
    return {
      activeClients: this.requests.size,
      blockedClients: this.blocked.size,
      whitelistedIPs: this.whitelist.size,
      blacklistedIPs: this.blacklist.size,
      queuedClients: this.queue.size,
      configuration: {
        windowSeconds: this.WINDOW_MS / 1000,
        maxRequests: this.MAX_REQUESTS,
        blockDurationMinutes: this.BLOCK_DURATION_MS / 60000,
        abuseThreshold: this.ABUSE_THRESHOLD,
        queueEnabled: this.QUEUE_ENABLED,
        queueMaxSize: this.QUEUE_MAX_SIZE
      },
      performance: {
        totalRequests: this.stats.totalRequests,
        allowedRequests: this.stats.allowedRequests,
        blockedRequests: this.stats.blockedRequests,
        queuedRequests: this.stats.queuedRequests,
        abusiveIps: this.stats.abusiveIps,
        allowRate: `${allowRate}%`
      },
      uptime: {
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 1000 / 60)
      }
    };
  }

  /**
   * ⏱️ Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ➕ Adiciona IP à whitelist
   */
  addToWhitelist(ip) {
    this.whitelist.add(ip);
    console.log(`✅ IP adicionado à whitelist: ${ip}`);
  }

  /**
   * ➖ Remove IP da whitelist
   */
  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
    console.log(`❌ IP removido da whitelist: ${ip}`);
  }
}

// Cria instância singleton
const limiter = new AdvancedRateLimiter();

/**
 * 🔐 Middleware principal
 */
module.exports = async (req, res, next) => {
  const clientId = limiter.getClientId(req);
  
  // Blacklist permanente
  if (limiter.isBlacklisted(clientId)) {
    return res.status(403).json({
      error: 'IP permanentemente bloqueado',
      message: 'Seu IP foi banido por múltiplas violações',
      permanent: true,
      api_info: {
        name: 'SA-MP INFO API',
        url: 'https://api.sampinfo.qzz.io'
      }
    });
  }
  
  // Bloqueio temporário
  if (limiter.isBlocked(clientId)) {
    const blockInfo = limiter.blocked.get(clientId);
    const remainingTime = Math.ceil((limiter.BLOCK_DURATION_MS - (Date.now() - blockInfo.timestamp)) / 1000);
    
    return res.status(403).json({
      error: 'IP bloqueado por abuso',
      message: 'Seu IP foi temporariamente bloqueado',
      reason: blockInfo.reason,
      attackPattern: blockInfo.attackPattern,
      blockCount: blockInfo.count,
      retry_after_seconds: remainingTime,
      retry_after_human: formatTime(remainingTime),
      api_info: {
        name: 'SA-MP INFO API',
        url: 'https://api.sampinfo.qzz.io'
      }
    });
  }
  
  // Verifica limite
  const result = limiter.checkLimit(clientId);
  
  // Headers de rate limit
  res.setHeader('X-RateLimit-Limit', limiter.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
  res.setHeader('X-RateLimit-Reset', Date.now() + limiter.WINDOW_MS);
  
  // Permitido
  if (result.allowed) {
    return next();
  }
  
  // Rate limit excedido - tenta enfileirar
  if (result.queueAvailable && limiter.QUEUE_ENABLED) {
    try {
      res.setHeader('X-RateLimit-Queued', 'true');
      await limiter.enqueue(clientId, req, res, next);
      return;
    } catch (error) {
      // Fila cheia ou timeout
    }
  }
  
  // Bloqueado
  return res.status(429).json({
    error: result.isAbuse ? 'Abuso detectado' : 'Rate limit excedido',
    message: result.isAbuse 
      ? 'Comportamento abusivo detectado. IP bloqueado temporariamente.'
      : `Você excedeu o limite de ${limiter.MAX_REQUESTS} requisições`,
    retry_after_seconds: result.retryAfter,
    retry_after_human: formatTime(result.retryAfter),
    queue: {
      available: limiter.QUEUE_ENABLED,
      message: limiter.QUEUE_ENABLED 
        ? 'Fila está cheia. Tente novamente mais tarde.'
        : 'Sistema de fila desabilitado'
    },
    limit: {
      max_requests: limiter.MAX_REQUESTS,
      window_seconds: limiter.WINDOW_MS / 1000,
      remaining: result.remaining
    },
    api_info: {
      name: 'SA-MP INFO API',
      url: 'https://api.sampinfo.qzz.io'
    }
  });
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}${secs > 0 ? ` e ${secs} segundo${secs > 1 ? 's' : ''}` : ''}`;
  }
  
  return `${secs} segundo${secs !== 1 ? 's' : ''}`;
}

// Exporta instância e funções auxiliares
module.exports.getStats = () => limiter.getStats();
module.exports.addToWhitelist = (ip) => limiter.addToWhitelist(ip);
module.exports.removeFromWhitelist = (ip) => limiter.removeFromWhitelist(ip);
