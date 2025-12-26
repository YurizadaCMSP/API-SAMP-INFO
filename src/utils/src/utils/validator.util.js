/**
 * Valida se o IP está em formato válido
 * @param {String} ip 
 * @returns {Boolean}
 */
function isValidIp(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Valida se a porta está em formato válido
 * @param {Number|String} port 
 * @returns {Boolean}
 */
function isValidPort(port) {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Valida IP e Porta juntos
 * @param {String} ip 
 * @param {String|Number} port 
 * @returns {Object} - {valid: Boolean, message: String}
 */
function validateIpPort(ip, port) {
  if (!ip || ip.trim() === '') {
    return {
      valid: false,
      message: 'O IP é obrigatório'
    };
  }

  if (!port) {
    return {
      valid: false,
      message: 'A porta é obrigatória'
    };
  }

  if (!isValidIp(ip)) {
    return {
      valid: false,
      message: 'IP inválido. Use o formato: 127.0.0.1'
    };
  }

  if (!isValidPort(port)) {
    return {
      valid: false,
      message: 'Porta inválida. Use um valor entre 1 e 65535'
    };
  }

  return {
    valid: true,
    message: 'Validação OK'
  };
}

module.exports = {
  isValidIp,
  isValidPort,
  validateIpPort
};
