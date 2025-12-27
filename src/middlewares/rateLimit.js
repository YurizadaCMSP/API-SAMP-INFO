// src/middlewares/rateLimit.js

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.blocked = new Map();  // ✅ CORRIGIDO: Map em vez de Set
    
    this.WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    this.MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5;
    this.BLOCK_DURATION_MS = parseInt(process.env.RATE_LIMIT_BLOCK_MS) || 300000;
    this.ABUSE_THRESHOLD = parseInt(process.env.RATE_LIMIT_ABUSE_THRESHOLD) || 20;
    
    setInterval(() => this.cleanup(), 60000);
  }

  getClientId(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.headers['cf-connecting-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  isBlocked(clientId) {
    const blockInfo = this.blocked.get(clientId);
    if (!blockInfo) return false;
    
    if (Date.now() - blockInfo.timestamp < this.BLOCK_DURATION_MS) {
      return true;
    }
    
    this.blocked.delete(clientId);
    return false;
  }

  addBlock(clientId, reason) {
    this.blocked.set(clientId, {
      timestamp: Date.now(),
      reason: reason || 'Abuso detectado'
    });
    console.warn(`🚫 IP bloqueado: ${clientId} - ${reason}`);
  }

  checkLimit(clientId) {
    const now = Date.now();
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const userRequests = this.requests.get(clientId);
    const recentRequests = userRequests.filter(time => now - time < this.WINDOW_MS);
    
    if (recentRequests.length >= this.ABUSE_THRESHOLD) {
      this.addBlock(clientId, 'Tentativa de ataque DDoS/Flood');
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(this.BLOCK_DURATION_MS / 1000),
        isAbuse: true
      };
    }
    
    if (recentRequests.length >= this.MAX_REQUESTS) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((this.WINDOW_MS - (now - oldestRequest)) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        isAbuse: false
      };
    }
    
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    
    return {
      allowed: true,
      remaining: this.MAX_REQUESTS - recentRequests.length,
      retryAfter: 0,
      isAbuse: false
    };
  }

  cleanup() {
    const now = Date.now();
    
    for (const [clientId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < this.WINDOW_MS);
      
      if (recentRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, recentRequests);
      }
    }
    
    for (const [clientId, blockInfo] of this.blocked.entries()) {
      if (now - blockInfo.timestamp >= this.BLOCK_DURATION_MS) {
        this.blocked.delete(clientId);
      }
    }
  }

  getStats() {
    return {
      activeClients: this.requests.size,
      blockedClients: this.blocked.size,
      windowSeconds: this.WINDOW_MS / 1000,
      maxRequests: this.MAX_REQUESTS,
      blockDurationMinutes: this.BLOCK_DURATION_MS / 60000
    };
  }
}

const limiter = new RateLimiter();

module.exports = (req, res, next) => {
  const clientId = limiter.getClientId(req);
  
  if (limiter.isBlocked(clientId)) {
    const blockInfo = limiter.blocked.get(clientId);
    const remainingTime = Math.ceil((limiter.BLOCK_DURATION_MS - (Date.now() - blockInfo.timestamp)) / 1000);
    
    return res.status(403).json({
      error: 'IP bloqueado por abuso',
      message: 'Seu IP foi temporariamente bloqueado por comportamento abusivo',
      reason: blockInfo.reason,
      retry_after_seconds: remainingTime,
      retry_after_human: formatTime(remainingTime),
      api_info: {
        name: 'SA-MP INFO API',
        url: 'https://api.sampinfo.qzz.io',
        documentation: 'https://api.sampinfo.qzz.io'
      }
    });
  }
  
  const result = limiter.checkLimit(clientId);
  
  res.setHeader('X-RateLimit-Limit', limiter.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Date.now() + limiter.WINDOW_MS);
  
  if (!result.allowed) {
    return res.status(429).json({
      error: result.isAbuse ? 'Abuso detectado' : 'Rate limit excedido',
      message: result.isAbuse 
        ? 'Detectamos comportamento abusivo. Seu IP foi bloqueado temporariamente.'
        : `Você excedeu o limite de ${limiter.MAX_REQUESTS} requisições por ${limiter.WINDOW_MS / 1000} segundos`,
      retry_after_seconds: result.retryAfter,
      retry_after_human: formatTime(result.retryAfter),
      limit: {
        max_requests: limiter.MAX_REQUESTS,
        window_seconds: limiter.WINDOW_MS / 1000,
        remaining: result.remaining
      },
      api_info: {
        name: 'SA-MP INFO API',
        url: 'https://api.sampinfo.qzz.io',
        documentation: 'https://api.sampinfo.qzz.io'
      }
    });
  }
  
  next();
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}${secs > 0 ? ` e ${secs} segundo${secs > 1 ? 's' : ''}` : ''}`;
  }
  
  return `${secs} segundo${secs !== 1 ? 's' : ''}`;
}

module.exports.getStats = () => limiter.getStats();
