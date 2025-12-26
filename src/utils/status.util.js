// src/utils/status.util.js

/**
 * Infere o status do servidor baseado em ping e dados
 */
exports.inferStatus = (serverData, ping) => {
  if (!serverData) {
    return 'offline';
  }

  if (ping > 500) {
    return 'critical';
  }

  if (ping > 300) {
    return 'unstable';
  }

  if (ping > 150) {
    return 'degraded';
  }

  return 'online';
};

/**
 * Retorna o nível de qualidade da conexão
 */
exports.getQualityLevel = (ping) => {
  if (ping < 50) return 'excellent';
  if (ping < 100) return 'good';
  if (ping < 150) return 'fair';
  if (ping < 300) return 'poor';
  if (ping < 500) return 'very_poor';
  return 'critical';
};

/**
 * Retorna descrição do status
 */
exports.getStatusDescription = (status) => {
  const descriptions = {
    'online': 'Servidor operando normalmente',
    'degraded': 'Servidor respondendo com latência moderada',
    'unstable': 'Servidor com alta latência',
    'critical': 'Servidor com latência crítica',
    'offline': 'Servidor não está respondendo'
  };
  return descriptions[status] || 'Status desconhecido';
};

/**
 * Retorna emoji do status
 */
exports.getStatusEmoji = (status) => {
  const emojis = {
    'online': '🟢',
    'degraded': '🟡',
    'unstable': '🟠',
    'critical': '🔴',
    'offline': '⚫'
  };
  return emojis[status] || '⚪';
};

/**
 * Avalia saúde geral do servidor
 */
exports.evaluateServerHealth = (serverData, ping) => {
  const health = {
    overall: 100,
    factors: {}
  };

  // Penaliza por alta latência
  if (ping > 500) health.overall -= 50;
  else if (ping > 300) health.overall -= 30;
  else if (ping > 150) health.overall -= 15;

  health.factors.latency = 100 - Math.min((ping / 10), 50);

  // Verifica capacidade
  const capacity = serverData.maxplayers > 0 
    ? (serverData.players / serverData.maxplayers) * 100 
    : 0;
  
  if (capacity > 95) health.overall -= 5;
  health.factors.capacity = 100 - capacity;

  // Normaliza
  health.overall = Math.max(0, Math.min(100, health.overall));

  return {
    score: Math.round(health.overall),
    grade: getHealthGrade(health.overall),
    factors: health.factors
  };
};

function getHealthGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
