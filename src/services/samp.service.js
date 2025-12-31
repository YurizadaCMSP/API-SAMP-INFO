// src/services/samp.service.js - v2.0.1
const dgram = require('dgram');
const dns = require('dns').promises;
const Gamedig = require('gamedig');

// Lazy loading das bibliotecas de query
let sampQueryPlus, sampQuery;

const TIMEOUT_MS = parseInt(process.env.QUERY_TIMEOUT_MS) || 3000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 500;

// Importa o cache avançado
const cache = require('./cache.service');

/**
 * 🎯 QUERY PRINCIPAL - Sistema de Fallback em Cascata
 * Tenta 4 bibliotecas diferentes em ordem de prioridade
 */
exports.queryServer = async (host, port) => {
  const cacheKey = `${host}:${port}`;
  
  // Verifica cache primeiro
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Resolve hostname para IP se necessário
  let resolvedIp = host;
  let isHostname = false;
  
  if (!isValidIpv4(host)) {
    try {
      isHostname = true;
      const addresses = await dns.resolve4(host);
      resolvedIp = addresses[0];
      console.log(`🌐 DNS resolvido: ${host} → ${resolvedIp}`);
    } catch (error) {
      throw new Error(`Falha ao resolver hostname: ${host}`);
    }
  }

  let lastError = null;
  const methods = [
    { name: 'GameDig', fn: () => queryWithGameDig(host, port) },
    { name: 'samp-query-plus', fn: () => queryWithSampQueryPlus(resolvedIp, port) },
    { name: 'samp-query', fn: () => queryWithSampQuery(resolvedIp, port) },
    { name: 'dgram (manual)', fn: () => queryWithDgram(resolvedIp, port) }
  ];

  for (const method of methods) {
    try {
      console.log(`🔄 Tentando método: ${method.name} (${host}:${port})`);
      const data = await method.fn();
      
      if (data && (data.hostname || data.name)) {
        console.log(`✅ Sucesso com ${method.name}!`);
        
        // Normaliza os dados
        const normalized = normalizeServerData(data, method.name, isHostname ? host : null);
        
        // Armazena no cache
        cache.set(cacheKey, normalized);
        
        return { ...normalized, fromCache: false, queryMethod: method.name };
      }
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ ${method.name} falhou: ${error.message}`);
      
      // Pequeno delay antes da próxima tentativa
      if (method !== methods[methods.length - 1]) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  throw new Error(lastError?.message || 'Todas as tentativas de query falharam');
};

/**
 * 🥇 Método 1: GameDig (Principal)
 * Biblioteca mais robusta e completa
 */
async function queryWithGameDig(host, port) {
  try {
    const result = await Gamedig.query({
      type: 'samp',
      host: host,
      port: port,
      socketTimeout: TIMEOUT_MS,
      attemptTimeout: TIMEOUT_MS,
      maxAttempts: RETRY_ATTEMPTS
    });

    return {
      hostname: result.name || 'Unknown Server',
      gamemode: result.raw?.rules?.gamemode || result.map || 'Unknown',
      mapname: result.map || 'San Andreas',
      password: result.password || false,
      players: result.players?.length || result.numplayers || 0,
      maxplayers: result.maxplayers || 0,
      rules: result.raw?.rules || {},
      playerList: result.players?.map(p => ({
        id: p.id || 0,
        name: p.name || 'Unknown',
        score: p.score || 0,
        ping: p.ping || 0
      })) || [],
      ping: result.ping || 0
    };
  } catch (error) {
    throw new Error(`GameDig: ${error.message}`);
  }
}

/**
 * 🥈 Método 2: samp-query-plus (Fallback 1)
 * Biblioteca moderna e leve
 */
async function queryWithSampQueryPlus(ip, port) {
  if (!sampQueryPlus) {
    sampQueryPlus = require('samp-query-plus');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, TIMEOUT_MS);

    try {
      const query = new sampQueryPlus({
        host: ip,
        port: port
      });

      query.getInfo()
        .then(info => {
          return Promise.all([
            Promise.resolve(info),
            query.getRules().catch(() => ({})),
            query.getPlayers().catch(() => [])
          ]);
        })
        .then(([info, rules, players]) => {
          clearTimeout(timeout);
          
          resolve({
            hostname: info.hostname || 'Unknown',
            gamemode: info.gamemode || 'Unknown',
            mapname: info.mapname || 'San Andreas',
            password: info.password || false,
            players: info.online || 0,
            maxplayers: info.max || 0,
            rules: rules || {},
            playerList: Array.isArray(players) ? players.map((p, idx) => ({
              id: idx,
              name: p.name || p,
              score: p.score || 0
            })) : []
          });
        })
        .catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * 🥉 Método 3: samp-query (Fallback 2)
 * Biblioteca clássica, funcional
 */
async function queryWithSampQuery(ip, port) {
  if (!sampQuery) {
    sampQuery = require('samp-query');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, TIMEOUT_MS);

    const options = {
      host: ip,
      port: port
    };

    sampQuery(options, (error, response) => {
      clearTimeout(timeout);
      
      if (error) {
        reject(error);
        return;
      }

      resolve({
        hostname: response.hostname || 'Unknown',
        gamemode: response.gamemode || 'Unknown',
        mapname: response.mapname || 'San Andreas',
        password: response.password || false,
        players: response.online || 0,
        maxplayers: response.maxplayers || 0,
        rules: response.rules || {},
        playerList: response.players || []
      });
    });
  });
}

/**
 * 🧨 Método 4: dgram (Fallback Final Hardcore)
 * Implementação manual do protocolo SA-MP
 */
async function queryWithDgram(ip, port) {
  const [info, rules, players] = await Promise.allSettled([
    queryInfo(ip, port),
    queryRules(ip, port),
    queryPlayers(ip, port)
  ]);

  if (info.status !== 'fulfilled') {
    throw new Error('Query manual falhou');
  }

  return {
    hostname: info.value.hostname,
    gamemode: info.value.gamemode,
    mapname: info.value.mapname,
    password: info.value.password,
    players: info.value.players,
    maxplayers: info.value.maxplayers,
    rules: rules.status === 'fulfilled' ? rules.value : {},
    playerList: players.status === 'fulfilled' ? players.value : []
  };
}

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

/**
 * Normaliza dados de diferentes bibliotecas para formato padrão
 */
function normalizeServerData(data, method, hostname = null) {
  return {
    hostname: data.hostname || data.name || 'Unknown Server',
    gamemode: data.gamemode || 'Unknown',
    mapname: data.mapname || 'San Andreas',
    password: data.password || false,
    players: data.players || 0,
    maxplayers: data.maxplayers || 0,
    rules: data.rules || {},
    playerList: data.playerList || [],
    originalHost: hostname,
    queryMethod: method,
    ping: data.ping || 0
  };
}

/**
 * Valida se é IPv4
 */
function isValidIpv4(str) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(str);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Estatísticas do cache
 */
exports.getCacheStats = () => cache.getStats();

/**
 * Limpa o cache
 */
exports.clearCache = () => cache.clear();
