// utils/status.util.js

/**
 * Infere o status do servidor baseado nos dados e ping
 * @param {Object} serverData - Dados retornados pelo servidor
 * @param {Number} ping - Tempo de resposta em ms
 * @returns {String} - 'online', 'instável' ou 'offline'
 */
exports.inferStatus = (serverData, ping) => {
  if (!serverData) {
    return 'offline';
  }

  // Se o ping está muito alto, considera instável
  if (ping > 300) {
    return 'instável';
  }

  // Se o ping está bom
  if (ping < 150) {
    return 'online';
  }

  // Ping médio (150-300ms)
  return 'online';
};

/**
 * Determina a cor do status para o frontend
 */
exports.getStatusColor = (status) => {
  const colors = {
    'online': '#00ff00',
    'instável': '#ffaa00',
    'offline': '#ff0000'
  };
  return colors[status] || '#999999';
};
