// src/services/samp.service.js
const dgram = require('dgram');

const TIMEOUT_MS = parseInt(process.env.QUERY_TIMEOUT_MS) || 2000;

// Cache simples em memória
const cache = new Map();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 10;

/**
 * Query SA-MP server via UDP com cache
 */
exports.queryServer = async (ip, port) => {
  const cacheKey = `${ip}:${port}`;
  
  // Verifica cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL * 1000) {
      return { ...cached.data, fromCache: true };
    }
    cache.delete(cacheKey);
  }

  // Faz a query
  const data = await queryServerInfo(ip, port);
  
  // Salva no cache
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  // Limpa cache antigo periodicamente
  if (cache.size > 100) {
    cleanOldCache();
  }

  return { ...data, fromCache: false };
};

/**
 * Query real ao servidor SA-MP
 */
function queryServerInfo(ip, port) {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('Timeout: servidor não respondeu'));
    }, TIMEOUT_MS);

    // Construir pacote de query SA-MP (opcode 'i')
    const packet = buildPacket(ip, port, 'i');

    client.on('message', (msg) => {
      clearTimeout(timeout);
      client.close();

      try {
        const data = parseInfoResponse(msg);
        resolve(data);
      } catch (err) {
        reject(new Error('Erro ao interpretar resposta: ' + err.message));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.close();
      reject(new Error('Erro de conexão: ' + err.message));
    });

    client.send(packet, port, ip, (err) => {
      if (err) {
        clearTimeout(timeout);
        client.close();
        reject(new Error('Falha ao enviar pacote: ' + err.message));
      }
    });
  });
}

/**
 * Constrói pacote UDP para SA-MP query
 */
function buildPacket(ip, port, opcode) {
  const ipParts = ip.split('.').map(Number);
  const portLow = port & 0xFF;
  const portHigh = (port >> 8) & 0xFF;

  return Buffer.from([
    'S'.charCodeAt(0), 'A'.charCodeAt(0), 'M'.charCodeAt(0), 'P'.charCodeAt(0),
    ipParts[0], ipParts[1], ipParts[2], ipParts[3],
    portLow, portHigh,
    opcode.charCodeAt(0)
  ]);
}

/**
 * Parse resposta do opcode 'i' (info básica)
 */
function parseInfoResponse(buffer) {
  if (buffer.length < 11) {
    throw new Error('Resposta muito curta');
  }

  let offset = 11; // Pula header SAMP + IP + Port + opcode

  // Password (1 byte)
  const password = buffer.readUInt8(offset);
  offset += 1;

  // Players (2 bytes)
  const players = buffer.readUInt16LE(offset);
  offset += 2;

  // Max players (2 bytes)
  const maxplayers = buffer.readUInt16LE(offset);
  offset += 2;

  // Hostname
  const hostnameLen = buffer.readUInt32LE(offset);
  offset += 4;
  const hostname = buffer.toString('utf8', offset, offset + hostnameLen);
  offset += hostnameLen;

  // Gamemode
  let gamemode = 'Unknown';
  let mapname = 'San Andreas';

  if (offset + 4 <= buffer.length) {
    const gamemodeLen = buffer.readUInt32LE(offset);
    offset += 4;
    
    if (offset + gamemodeLen <= buffer.length) {
      gamemode = buffer.toString('utf8', offset, offset + gamemodeLen);
      offset += gamemodeLen;

      // Mapname
      if (offset + 4 <= buffer.length) {
        const mapnameLen = buffer.readUInt32LE(offset);
        offset += 4;
        
        if (offset + mapnameLen <= buffer.length) {
          mapname = buffer.toString('utf8', offset, offset + mapnameLen);
        }
      }
    }
  }

  return {
    password: password === 1,
    players,
    maxplayers,
    hostname: hostname || 'Unknown Server',
    gamemode,
    mapname,
    rules: {},
    playerList: []
  };
}

/**
 * Limpa entradas antigas do cache
 */
function cleanOldCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 1000) {
      cache.delete(key);
    }
  }
}

/**
 * Estatísticas do cache
 */
exports.getCacheStats = () => {
  return {
    entries: cache.size,
    ttl: CACHE_TTL
  };
};
