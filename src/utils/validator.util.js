// src/utils/validator.util.js

const RESERVED_IPS = [
  '0.0.0.0',
  '255.255.255.255'
];

const PRIVATE_IP_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' }
];

/**
 * Valida formato de IP
 */
function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip.trim());
}

/**
 * Valida porta
 */
function isValidPort(port) {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Verifica se IP é reservado
 */
function isReservedIp(ip) {
  return RESERVED_IPS.includes(ip);
}

/**
 * Verifica se IP é privado
 */
function isPrivateIp(ip) {
  const ipNum = ipToNumber(ip);
  
  for (const range of PRIVATE_IP_RANGES) {
    const start = ipToNumber(range.start);
    const end = ipToNumber(range.end);
    
    if (ipNum >= start && ipNum <= end) {
      return true;
    }
  }
  
  return false;
}

/**
 * Converte IP para número
 */
function ipToNumber(ip) {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Validação completa de IP e porta
 */
function validateIpPort(ip, port) {
  const errors = [];
  const warnings = [];

  if (!ip || ip.trim() === '') {
    return {
      valid: false,
      message: 'O parâmetro "ip" é obrigatório',
      details: {
        ip: 'Campo obrigatório'
      }
    };
  }

  if (!port) {
    return {
      valid: false,
      message: 'O parâmetro "port" é obrigatório',
      details: {
        port: 'Campo obrigatório'
      }
    };
  }

  const trimmedIp = ip.trim();

  if (!isValidIp(trimmedIp)) {
    errors.push('IP inválido. Use o formato IPv4: 0.0.0.0 a 255.255.255.255');
  }

  if (!isValidPort(port)) {
    errors.push('Porta inválida. Use um valor entre 1 e 65535');
  }

  if (errors.length === 0) {
    if (isReservedIp(trimmedIp)) {
      warnings.push('IP reservado detectado (0.0.0.0 ou 255.255.255.255)');
    }

    if (isPrivateIp(trimmedIp)) {
      warnings.push('IP privado detectado. Certifique-se de que o servidor está acessível publicamente');
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.join('. '),
      details: {
        errors: errors,
        warnings: warnings
      }
    };
  }

  return {
    valid: true,
    message: 'Validação bem-sucedida',
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitiza entrada
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[^\x20-\x7E]/g, '');
}

module.exports = {
  isValidIp,
  isValidPort,
  isReservedIp,
  isPrivateIp,
  validateIpPort,
  sanitizeInput
};
