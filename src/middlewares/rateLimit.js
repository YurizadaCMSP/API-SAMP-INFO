const rateLimit = require('express-rate-limit');

// 1 requisição a cada 5 minutos (300000ms) por IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 300000, // 5 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1, // 1 requisição
  message: {
    error: 'Muitas requisições',
    message: 'Você pode fazer apenas 1 consulta a cada 5 minutos. Tente novamente mais tarde.',
    retry_after_seconds: 300
  },
  standardHeaders: true, // Retorna info de rate limit nos headers
  legacyHeaders: false,
  // Usa o IP real do cliente
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      error: 'Limite de requisições excedido',
      message: 'Você pode fazer apenas 1 consulta a cada 5 minutos.',
      retry_after_seconds: retryAfter,
      retry_after_human: `${Math.ceil(retryAfter / 60)} minutos`
    });
  }
});

module.exports = limiter;
