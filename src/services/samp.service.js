// src/services/samp.service.js
const dgram = require('dgram');

const TIMEOUT_MS = parseInt(process.env.QUERY_TIMEOUT_MS) || 3000;

/**
 * Query SA-MP server via UDP
 * Implementação manual do protocolo SA-MP Query
 */
exports.queryServer = (ip, port) => {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('Timeout: servidor não respondeu'));
    }, TIMEOUT_MS);

    // Construir pacote de query SA-MP
    const packet = buildSAMPPacket(ip, port);

    client.on('message', (msg) => {
      clearTimeout(timeout);
      client.close();

      try {
        const data = parseSAMPResponse(msg);
        resolve(data);
      } catch (err) {
        console.error('Erro ao parsear resposta:', err);
        reject(new Error('Erro ao interpretar resposta do servidor'));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.close();
      console.error('Erro no socket UDP:', err);
      reject(new Error('Erro de conexão: ' + err.message));
    });

    try {
      client.send(packet, port, ip, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          reject(new Error('Falha ao enviar pacote: ' + err.message));
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      client.close();
      reject(new Error('Erro ao criar pacote: ' + err.message));
    }
  });
};

/**
 * Constrói o pacote UDP para query SA-MP (opcode 'i' - info)
 */
function buildSAMPPacket(ip, port) {
  try {
    const ipParts = ip.split('.').map(Number);
    const portLow = port & 0xFF;
    const portHigh = (port >> 8) & 0xFF;

    return Buffer.from([
      'S'.charCodeAt(0), 'A'.charCodeAt(0), 'M'.charCodeAt(0), 'P'.charCodeAt(0),
      ipParts[0], ipParts[1], ipParts[2], ipParts[3],
      portLow, portHigh,
      'i'.charCodeAt(0) // opcode 'i' para informações básicas
    ]);
  } catch (err) {
    throw new Error('Erro ao construir pacote: ' + err.message);
  }
}

/**
 * Parse da resposta SA-MP
 */
function parseSAMPResponse(buffer) {
  try {
    if (buffer.length < 11) {
      throw new Error('Resposta muito curta');
    }

    let offset = 11; // Pula header "SAMP" + IP + Port + opcode

    // Password protected
    if (offset >= buffer.length) throw new Error('Buffer insuficiente');
    const password = buffer.readUInt8(offset);
    offset += 1;

    // Players
    if (offset + 2 > buffer.length) throw new Error('Buffer insuficiente');
    const players = buffer.readUInt16LE(offset);
    offset += 2;

    // Max players
    if (offset + 2 > buffer.length) throw new Error('Buffer insuficiente');
    const maxplayers = buffer.readUInt16LE(offset);
    offset += 2;

    // Hostname length + string
    if (offset + 4 > buffer.length) throw new Error('Buffer insuficiente');
    const hostnameLen = buffer.readUInt32LE(offset);
    offset += 4;
    
    if (offset + hostnameLen > buffer.length) throw new Error('Hostname incompleto');
    const hostname = buffer.toString('utf8', offset, offset + hostnameLen);
    offset += hostnameLen;

    // Gamemode length + string
    if (offset + 4 > buffer.length) {
      return {
        password: password === 1,
        players,
        maxplayers,
        hostname,
        gamemode: 'N/A',
        mapname: 'San Andreas',
        rules: {},
        playerList: []
      };
    }
    const gamemodeLen = buffer.readUInt32LE(offset);
    offset += 4;
    
    if (offset + gamemodeLen > buffer.length) throw new Error('Gamemode incompleto');
    const gamemode = buffer.toString('utf8', offset, offset + gamemodeLen);
    offset += gamemodeLen;

    // Mapname length + string
    if (offset + 4 > buffer.length) {
      return {
        password: password === 1,
        players,
        maxplayers,
        hostname,
        gamemode,
        mapname: 'San Andreas',
        rules: {},
        playerList: []
      };
    }
    const mapnameLen = buffer.readUInt32LE(offset);
    offset += 4;
    
    if (offset + mapnameLen > buffer.length) throw new Error('Mapname incompleto');
    const mapname = buffer.toString('utf8', offset, offset + mapnameLen);

    return {
      password: password === 1,
      players,
      maxplayers,
      hostname,
      gamemode,
      mapname,
      rules: {},
      playerList: []
    };
  } catch (err) {
    throw new Error('Erro ao parsear resposta: ' + err.message);
  }
  }
