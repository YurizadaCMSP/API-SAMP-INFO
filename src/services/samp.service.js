// src/services/samp.service.js
const dgram = require('dgram');

const TIMEOUT_MS = parseInt(process.env.QUERY_TIMEOUT_MS) || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 10;
const cache = new Map();

/**
 * Query completo ao servidor SA-MP com cache otimizado
 */
exports.queryServer = async (ip, port) => {
  const cacheKey = `${ip}:${port}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL * 1000) {
      return { ...cached.data, fromCache: true };
    }
    cache.delete(cacheKey);
  }

  try {
    const [info, rules, players] = await Promise.allSettled([
      queryInfo(ip, port),
      queryRules(ip, port),
      queryPlayers(ip, port)
    ]);

    const serverData = {
      hostname: info.status === 'fulfilled' ? info.value.hostname : 'Unknown',
      gamemode: info.status === 'fulfilled' ? info.value.gamemode : 'Unknown',
      mapname: info.status === 'fulfilled' ? info.value.mapname : 'San Andreas',
      password: info.status === 'fulfilled' ? info.value.password : false,
      players: info.status === 'fulfilled' ? info.value.players : 0,
      maxplayers: info.status === 'fulfilled' ? info.value.maxplayers : 0,
      rules: rules.status === 'fulfilled' ? rules.value : {},
      playerList: players.status === 'fulfilled' ? players.value : [],
      fromCache: false
    };

    cache.set(cacheKey, {
      data: serverData,
      timestamp: Date.now()
    });

    if (cache.size > 200) cleanOldCache();

    return serverData;
  } catch (error) {
    throw new Error(`Servidor não respondeu: ${error.message}`);
  }
};

/**
 * Query opcode 'i' - Informações básicas
 */
function queryInfo(ip, port) {
  return sendQuery(ip, port, 'i', (buffer) => {
    if (buffer.length < 11) throw new Error('Resposta inválida');
    
    let offset = 11;
    const password = buffer.readUInt8(offset) === 1;
    offset += 1;
    
    const players = buffer.readUInt16LE(offset);
    offset += 2;
    
    const maxplayers = buffer.readUInt16LE(offset);
    offset += 2;
    
    const hostnameLen = buffer.readUInt32LE(offset);
    offset += 4;
    const hostname = buffer.toString('utf8', offset, offset + hostnameLen);
    offset += hostnameLen;
    
    const gamemodeLen = buffer.readUInt32LE(offset);
    offset += 4;
    const gamemode = buffer.toString('utf8', offset, offset + gamemodeLen);
    offset += gamemodeLen;
    
    const mapnameLen = buffer.readUInt32LE(offset);
    offset += 4;
    const mapname = buffer.toString('utf8', offset, offset + mapnameLen);
    
    return { password, players, maxplayers, hostname, gamemode, mapname };
  });
}

/**
 * Query opcode 'r' - Regras do servidor
 */
function queryRules(ip, port) {
  return sendQuery(ip, port, 'r', (buffer) => {
    if (buffer.length < 13) return {};
    
    let offset = 11;
    const ruleCount = buffer.readUInt16LE(offset);
    offset += 2;
    
    const rules = {};
    
    for (let i = 0; i < ruleCount && offset < buffer.length; i++) {
      try {
        const nameLen = buffer.readUInt8(offset);
        offset += 1;
        const name = buffer.toString('utf8', offset, offset + nameLen);
        offset += nameLen;
        
        const valueLen = buffer.readUInt8(offset);
        offset += 1;
        const value = buffer.toString('utf8', offset, offset + valueLen);
        offset += valueLen;
        
        rules[name] = value;
      } catch (err) {
        break;
      }
    }
    
    return rules;
  });
}

/**
 * Query opcode 'd' - Lista de jogadores detalhada
 */
function queryPlayers(ip, port) {
  return sendQuery(ip, port, 'd', (buffer) => {
    if (buffer.length < 13) return [];
    
    let offset = 11;
    const playerCount = buffer.readUInt16LE(offset);
    offset += 2;
    
    const players = [];
    
    for (let i = 0; i < playerCount && offset < buffer.length; i++) {
      try {
        const playerId = buffer.readUInt8(offset);
        offset += 1;
        
        const nameLen = buffer.readUInt8(offset);
        offset += 1;
        const name = buffer.toString('utf8', offset, offset + nameLen);
        offset += nameLen;
        
        const score = buffer.readInt32LE(offset);
        offset += 4;
        
        players.push({ id: playerId, name, score });
      } catch (err) {
        break;
      }
    }
    
    return players;
  });
}

/**
 * Envia query UDP genérico
 */
function sendQuery(ip, port, opcode, parser) {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    const packet = buildPacket(ip, port, opcode);
    
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('Timeout'));
    }, TIMEOUT_MS);
    
    client.on('message', (msg) => {
      clearTimeout(timeout);
      client.close();
      try {
        resolve(parser(msg));
      } catch (err) {
        reject(err);
      }
    });
    
    client.on('error', (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });
    
    client.send(packet, port, ip, (err) => {
      if (err) {
        clearTimeout(timeout);
        client.close();
        reject(err);
      }
    });
  });
}

/**
 * Constrói pacote SA-MP
 */
function buildPacket(ip, port, opcode) {
  const ipParts = ip.split('.').map(Number);
  return Buffer.from([
    0x53, 0x41, 0x4D, 0x50,
    ipParts[0], ipParts[1], ipParts[2], ipParts[3],
    port & 0xFF, (port >> 8) & 0xFF,
    opcode.charCodeAt(0)
  ]);
}

function cleanOldCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 1000) {
      cache.delete(key);
    }
  }
}

exports.getCacheStats = () => ({
  entries: cache.size,
  ttl: CACHE_TTL
});
