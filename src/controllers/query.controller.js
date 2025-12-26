// controllers/query.controller.js
const sampService = require('../services/samp.service');
const statusUtil = require('../utils/status.util');

exports.queryServer = async (req, res) => {
  const { ip, port } = req.query;

  // Validação de parâmetros
  if (!ip || !port) {
    return res.status(400).json({
      error: 'Parâmetros obrigatórios: ip e port',
      example: '/query?ip=127.0.0.1&port=7777'
    });
  }

  // Validação de IP
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(ip)) {
    return res.status(400).json({
      error: 'IP inválido',
      provided: ip
    });
  }

  // Validação de porta
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return res.status(400).json({
      error: 'Porta inválida (deve ser entre 1 e 65535)',
      provided: port
    });
  }

  try {
    const startTime = Date.now();
    
    // Consulta o servidor SA-MP
    const serverData = await sampService.queryServer(ip, portNum);
    
    const responseTime = Date.now() - startTime;
    
    // Infere o status
    const status = statusUtil.inferStatus(serverData, responseTime);

    // Monta resposta
    const response = {
      online: true,
      ping: responseTime,
      status: status,
      hostname: serverData.hostname || 'N/A',
      gamemode: serverData.gamemode || 'N/A',
      mapname: serverData.mapname || 'San Andreas',
      players: {
        online: serverData.players || 0,
        maxplayers: serverData.maxplayers || 0,
        list: serverData.playerList || []
      },
      rules: serverData.rules || {},
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime
      }
    };

    res.json(response);

  } catch (error) {
    // Servidor offline ou erro de conexão
    res.json({
      online: false,
      status: 'offline',
      error: error.message || 'Servidor não respondeu',
      meta: {
        queried_at: new Date().toISOString()
      }
    });
  }
};
