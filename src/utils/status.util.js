/**
 * Infere o status do servidor baseado no ping e resposta
 * @param {Object} response - Resposta do servidor SA-MP
 * @param {Number} ping - Tempo de resposta em ms
 * @returns {String} - Status: 'online', 'instável' ou 'offline'
 */
function inferStatus(response, ping) {
  if (!response) {
    return 'offline';
  }

  // Ping excelente
  if (ping < 150) {
    return 'online';
  }

  // Ping alto mas aceitável
  if (ping < 300) {
    return 'online';
  }

  // Ping muito alto
  return 'instável';
}

/**
 * Retorna uma cor visual para o status
 * @param {String} status 
 * @returns {String} - Código de cor hexadecimal
 */
function getStatusColor(status) {
  const colors = {
    'online': '#00ff00',
    'instável': '#ffff00',
    'offline': '#ff0000'
  };

  return colors[status] || colors.offline;
}

/**
 * Retorna um emoji para o status
 * @param {String} status 
 * @returns {String} - Emoji
 */
function getStatusEmoji(status) {
  const emojis = {
    'online': '🟢',
    'instável': '🟡',
    'offline': '🔴'
  };

  return emojis[status] || emojis.offline;
}

module.exports = {
  inferStatus,
  getStatusColor,
  getStatusEmoji
};
