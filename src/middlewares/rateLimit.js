// src/middlewares/rateLimit.js

// Armazena IPs e timestamp da última requisição
const requestLog = new Map();

// 5 minutos em milissegundos
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 300000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1;

/**
 * Middleware de rate limiting
 * Permite 1 requisição a cada 5 minutos por IP
 */
module.exports = (req, res, next) => {
  // Pega o IP real do cliente (considera proxies/CDN)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress ||
                   req.ip ||
                   'unknown';

  const now = Date.now();
  const lastRequest = requestLog.get(clientIP);

  // Se já existe registro desse IP
  if (lastRequest) {
    const timeSinceLastRequest = now - lastRequest;

    // Se não passou o tempo necessário
    if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastRequest) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;

      return res.status(429).json({
        error: 'Rate limit excedido',
        message: `Você pode fazer apenas ${MAX_REQUESTS} requisição a cada ${RATE_LIMIT_WINDOW / 60000} minutos`,
        retry_after: `${minutes}m ${seconds}s`,
        retry_after_seconds: remainingTime
      });
    }
  }

  // Atualiza o timestamp da última requisição
  requestLog.set(clientIP, now);

  // Limpa entradas antigas a cada 100 requisições
  if (requestLog.size > 100) {
    cleanOldEntries();
  }

  next();
};

/**
 * Remove entradas antigas do Map para não acumular memória
 */
function cleanOldEntries() {
  const now = Date.now();
  for (const [ip, timestamp] of requestLog.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      requestLog.delete(ip);
    }
  }
}

/**
 * Exporta função para obter estatísticas (para página de status)
 */
module.exports.getStats = () => {
  return {
    activeIPs: requestLog.size,
    windowMinutes: RATE_LIMIT_WINDOW / 60000,
    maxRequests: MAX_REQUESTS
  };
};
