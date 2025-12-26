// src/controllers/query.controller.js
const sampService = require('../services/samp.service');
const statusUtil = require('../utils/status.util');
const validator = require('../utils/validator.util');

const API_INFO = {
  name: 'SA-MP INFO API',
  url: 'https://api.sampinfo.qzz.io',
  version: '2.0.0',
  description: 'API profissional para consulta de servidores SA-MP em tempo real'
};

exports.queryServer = async (req, res) => {
  const startTime = Date.now();
  const { ip, port } = req.query;

  const validation = validator.validateIpPort(ip, port);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros inválidos',
      message: validation.message,
      details: validation.details,
      example: {
        url: 'https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777',
        parameters: {
          ip: 'Endereço IPv4 válido',
          port: 'Porta entre 1 e 65535'
        }
      },
      api_info: API_INFO,
      timestamp: new Date().toISOString()
    });
  }

  const portNum = parseInt(port);

  try {
    const serverData = await sampService.queryServer(ip, portNum);
    const responseTime = Date.now() - startTime;
    const status = statusUtil.inferStatus(serverData, responseTime);

    const response = {
      success: true,
      online: true,
      server: {
        ip: ip,
        port: portNum,
        address: `${ip}:${portNum}`
      },
      status: {
        state: status,
        ping: responseTime,
        latency_ms: responseTime,
        quality: statusUtil.getQualityLevel(responseTime)
      },
      info: {
        hostname: serverData.hostname || 'Unknown Server',
        gamemode: serverData.gamemode || 'Unknown',
        mapname: serverData.mapname || 'San Andreas',
        language: serverData.rules?.language || serverData.rules?.lang || 'Unknown',
        version: serverData.rules?.version || 'Unknown',
        weather: serverData.rules?.weather || 'Unknown',
        worldtime: serverData.rules?.worldtime || 'Unknown',
        weburl: serverData.rules?.weburl || serverData.rules?.website || null,
        discord: serverData.rules?.discord || null
      },
      players: {
        online: serverData.players || 0,
        max: serverData.maxplayers || 0,
        percentage: serverData.maxplayers > 0 
          ? Math.round((serverData.players / serverData.maxplayers) * 100) 
          : 0,
        list: serverData.playerList || []
      },
      security: {
        password: serverData.password || false,
        lagcomp: serverData.rules?.lagcomp === 'On',
      },
      rules: serverData.rules || {},
      cache: {
        from_cache: serverData.fromCache || false,
        cache_ttl_seconds: parseInt(process.env.CACHE_TTL_SECONDS) || 10
      },
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime,
        query_success: true
      },
      api_info: API_INFO
    };

    res.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`❌ Erro ao consultar ${ip}:${portNum}:`, error.message);
    
    res.json({
      success: false,
      online: false,
      server: {
        ip: ip,
        port: portNum,
        address: `${ip}:${portNum}`
      },
      status: {
        state: 'offline',
        ping: responseTime,
        latency_ms: responseTime,
        quality: 'unavailable'
      },
      error: {
        code: 'SERVER_OFFLINE',
        message: 'Servidor não respondeu',
        details: error.message || 'Não foi possível estabelecer conexão com o servidor',
        possible_causes: [
          'Servidor está offline',
          'Servidor não está respondendo a queries',
          'Firewall bloqueando queries UDP',
          'IP ou porta incorretos',
          'Servidor em manutenção'
        ]
      },
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime,
        query_success: false
      },
      api_info: API_INFO
    });
  }
};
