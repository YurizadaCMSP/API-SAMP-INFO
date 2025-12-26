// src/controllers/query.controller.js
const sampService = require('../services/samp.service');
const statusUtil = require('../utils/status.util');
const validator = require('../utils/validator.util');

exports.queryServer = async (req, res) => {
  const { ip, port } = req.query;

  // Validação usando utility
  const validation = validator.validateIpPort(ip, port);
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Parâmetros inválidos',
      message: validation.message,
      example: '/query?ip=127.0.0.1&port=7777'
    });
  }

  const portNum = parseInt(port);

  try {
    const startTime = Date.now();
    
    // Consulta o servidor SA-MP
    const serverData = await sampService.queryServer(ip, portNum);
    
    const responseTime = Date.now() - startTime;
    
    // Infere o status
    const status = statusUtil.inferStatus(serverData, responseTime);

    // Monta resposta completa
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
      passworded: serverData.password || false,
      from_cache: serverData.fromCache || false,
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime,
        api_version: '1.0.0'
      }
    };

    res.json(response);

  } catch (error) {
    console.error(`Erro ao consultar ${ip}:${port}:`, error.message);
    
    // Servidor offline ou erro de conexão
    res.json({
      online: false,
      status: 'offline',
      error: 'Falha na consulta',
      message: error.message || 'Não foi possível conectar ao servidor',
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: Date.now() - (req._startTime || Date.now())
      }
    });
  }
};
