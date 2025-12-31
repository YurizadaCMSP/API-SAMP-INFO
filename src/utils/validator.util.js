// src/utils/validator.util.js - v2.0.1

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
 * ✅ Valida formato de IPv4
 */
function isValidIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip.trim());
}

/**
 * 🌐 Valida formato de hostname/domínio
 */
function isValidHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  
  // Remove espaços
  hostname = hostname.trim();
  
  // Hostname não pode começar ou terminar com traço
  if (hostname.startsWith('-') || hostname.endsWith('-')) return false;
  
  // Regex para hostname válido (RFC 1123)
  // Permite: letras, números, traços e pontos
  // Comprimento máximo de 253 caracteres
  // Cada label (parte entre pontos) pode ter até 63 caracteres
  const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
  
  if (hostname.length > 253) return false;
  
  // Valida formato básico
  if (!hostnameRegex.test(hostname)) return false;
  
  // Verifica se cada label tem no máximo 63 caracteres
  const labels = hostname.split('.');
  for (const label of labels) {
    if (label.length > 63) return false;
  }
  
  return true;
}

/**
 * 🔍 Identifica tipo de entrada (IP ou hostname)
 */
function identifyHostType(host) {
  if (isValidIpv4(host)) {
    return 'ipv4';
  }
  
  if (isValidHostname(host)) {
    return 'hostname';
  }
  
  return 'invalid';
}

/**
 * ✅ Valida porta
 */
function isValidPort(port) {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * 🚫 Verifica se IP é reservado
 */
function isReservedIp(ip) {
  return RESERVED_IPS.includes(ip);
}

/**
 * 🏠 Verifica se IP é privado
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
 * 🔢 Converte IP para número
 */
function ipToNumber(ip) {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * 🔍 Validação completa de host (IP ou hostname) e porta
 */
function validateHostPort(host, port) {
  const errors = [];
  const warnings = [];

  // Valida presença do host
  if (!host || host.trim() === '') {
    return {
      valid: false,
      message: 'O parâmetro "ip" (ou host) é obrigatório',
      details: {
        host: 'Campo obrigatório'
      }
    };
  }

  // Valida presença da porta
  if (!port) {
    return {
      valid: false,
      message: 'O parâmetro "port" é obrigatório',
      details: {
        port: 'Campo obrigatório'
      }
    };
  }

  const trimmedHost = host.trim();
  const hostType = identifyHostType(trimmedHost);

  // Valida tipo de host
  if (hostType === 'invalid') {
    errors.push('Host inválido. Use um IPv4 válido (ex: 127.0.0.1) ou hostname (ex: servidor.com.br)');
  }

  // Valida porta
  if (!isValidPort(port)) {
    errors.push('Porta inválida. Use um valor entre 1 e 65535');
  }

  // Se houver erros, retorna
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

  // Avisos específicos para IPs
  if (hostType === 'ipv4') {
    if (isReservedIp(trimmedHost)) {
      warnings.push('IP reservado detectado (0.0.0.0 ou 255.255.255.255)');
    }

    if (isPrivateIp(trimmedHost)) {
      warnings.push('IP privado detectado. Certifique-se de que o servidor está acessível publicamente');
    }
  }

  // Avisos específicos para hostnames
  if (hostType === 'hostname') {
    if (trimmedHost === 'localhost') {
      warnings.push('Hostname "localhost" detectado. Use o IP público do servidor para acesso externo');
    }
    
    if (trimmedHost.endsWith('.local')) {
      warnings.push('Domínio .local detectado (mDNS). Pode não ser acessível publicamente');
    }
  }

  return {
    valid: true,
    message: 'Validação bem-sucedida',
    hostType: hostType,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * 🧹 Sanitiza entrada
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove caracteres não-ASCII e caracteres de controle
  return input.trim().replace(/[^\x20-\x7E]/g, '');
}

/**
 * 🔍 Valida formato completo de endereço (host:porta)
 */
function parseAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, message: 'Endereço inválido' };
  }

  const parts = address.trim().split(':');
  
  if (parts.length !== 2) {
    return { 
      valid: false, 
      message: 'Formato inválido. Use: host:porta (ex: 127.0.0.1:7777 ou servidor.com:7777)' 
    };
  }

  const [host, port] = parts;
  const validation = validateHostPort(host, port);

  if (!validation.valid) {
    return validation;
  }

  return {
    valid: true,
    host: host.trim(),
    port: parseInt(port),
    hostType: validation.hostType,
    warnings: validation.warnings
  };
}

/**
 * 📊 Retorna informações sobre o host
 */
function getHostInfo(host) {
  const type = identifyHostType(host);
  
  const info = {
    host: host,
    type: type,
    valid: type !== 'invalid'
  };

  if (type === 'ipv4') {
    info.isPrivate = isPrivateIp(host);
    info.isReserved = isReservedIp(host);
    info.isPublic = !info.isPrivate && !info.isReserved;
  }

  if (type === 'hostname') {
    info.labels = host.split('.');
    info.labelCount = info.labels.length;
    info.topLevelDomain = info.labels[info.labels.length - 1];
    info.isSubdomain = info.labelCount > 2;
  }

  return info;
}

/**
 * ✅ Valida lista de servidores
 */
function validateServerList(servers) {
  if (!Array.isArray(servers)) {
    return { valid: false, message: 'Lista de servidores deve ser um array' };
  }

  const errors = [];
  const validServers = [];
  const invalidServers = [];

  servers.forEach((server, index) => {
    if (!server.host && !server.ip) {
      errors.push(`Servidor ${index}: host/ip ausente`);
      invalidServers.push({ index, server, error: 'host/ip ausente' });
      return;
    }

    if (!server.port) {
      errors.push(`Servidor ${index}: porta ausente`);
      invalidServers.push({ index, server, error: 'porta ausente' });
      return;
    }

    const host = server.host || server.ip;
    const validation = validateHostPort(host, server.port);

    if (validation.valid) {
      validServers.push({ index, host, port: parseInt(server.port) });
    } else {
      errors.push(`Servidor ${index}: ${validation.message}`);
      invalidServers.push({ index, server, error: validation.message });
    }
  });

  return {
    valid: errors.length === 0,
    validCount: validServers.length,
    invalidCount: invalidServers.length,
    validServers: validServers,
    invalidServers: invalidServers,
    errors: errors
  };
}

module.exports = {
  isValidIpv4,
  isValidHostname,
  identifyHostType,
  isValidPort,
  isReservedIp,
  isPrivateIp,
  validateHostPort,
  sanitizeInput,
  parseAddress,
  getHostInfo,
  validateServerList
};
