// services/samp.service.js
const dgram = require('dgram');

/**
 * Query SA-MP server via UDP
 * Implementação manual do protocolo SA-MP Query
 */
exports.queryServer = (ip, port) => {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('Timeout: servidor não respondeu em 3 segundos'));
    }, 3000);

    // Construir pacote de query SA-MP
    const packet = buildSAMPPacket(ip, port);

    client.on('message', (msg) => {
      clearTimeout(timeout);
      client.close();

      try {
        const data = parseSAMPResponse(msg);
        resolve(data);
      } catch (err) {
        reject(new Error('Erro ao interpretar resposta do servidor'));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    client.send(packet, port, ip);
  });
};

/**
 * Constrói o pacote UDP para query SA-MP (opcode 'i' - info)
 */
function buildSAMPPacket(ip, port) {
  const ipParts = ip.split('.').map(Number);
  const portLow = port & 0xFF;
  const portHigh = (port >> 8) & 0xFF;

  return Buffer.from([
    'S'.charCodeAt(0), 'A'.charCodeAt(0), 'M'.charCodeAt(0), 'P'.charCodeAt(0),
    ipParts[0], ipParts[1], ipParts[2], ipParts[3],
    portLow, portHigh,
    'i'.charCodeAt(0) // opcode 'i' para informações básicas
  ]);
}

/**
 * Parse da resposta SA-MP
 */
function parseSAMPResponse(buffer) {
  let offset = 11; // Pula header "SAMP" + IP + Port + opcode

  // Password protected
  const password = buffer.readUInt8(offset);
  offset += 1;

  // Players
  const players = buffer.readUInt16LE(offset);
  offset += 2;

  // Max players
  const maxplayers = buffer.readUInt16LE(offset);
  offset += 2;

  // Hostname length + string
  const hostnameLen = buffer.readUInt32LE(offset);
  offset += 4;
  const hostname = buffer.toString('utf8', offset, offset + hostnameLen);
  offset += hostnameLen;

  // Gamemode length + string
  const gamemodeLen = buffer.readUInt32LE(offset);
  offset += 4;
  const gamemode = buffer.toString('utf8', offset, offset + gamemodeLen);
  offset += gamemodeLen;

  // Mapname length + string
  const mapnameLen = buffer.readUInt32LE(offset);
  offset += 4;
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
}

/**
 * Query para pegar lista de jogadores (opcode 'd')
 * Opcional - pode ser implementado depois
 */
exports.queryPlayers = async (ip, port) => {
  // Implementação similar, mas com opcode 'd'
  return [];
};
