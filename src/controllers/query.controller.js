// src/controllers/query.controller.js - v2.0.1
const sampService = require('../services/samp.service');
const statusUtil = require('../utils/status.util');
const validator = require('../utils/validator.util');

const API_INFO = {
  name: 'SA-MP INFO API',
  url: 'https://api.sampinfo.qzz.io',
  version: '2.0.1',
  description: 'API profissional para consulta de servidores SA-MP - Agora com suporte a hostnames!'
};

exports.queryServer = async (req, res) => {
  const startTime = Date.now();
  const { ip, port } = req.query;

  // Validação (agora aceita IP ou hostname)
  const validation = validator.validateHostPort(ip, port);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros inválidos',
      message: validation.message,
      details: validation.details,
      example: {
        ipv4: 'https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777',
        hostname: 'https://api.sampinfo.qzz.io/query?ip=servidor.com.br&port=7777'
      },
      supported_formats: {
        ipv4: 'Ex: 127.0.0.1',
        hostname: 'Ex: servidor.com.br, play.servidor.com'
      },
      api_info: API_INFO,
      timestamp: new Date().toISOString()
    });
  }

  const portNum = parseInt(port);
  const host = ip.trim();
  const hostInfo = validator.getHostInfo(host);

  try {
    console.log(`🔍 Consultando servidor: ${host}:${portNum} (${hostInfo.type})`);
    
    const serverData = await sampService.queryServer(host, portNum);
    const responseTime = Date.now() - startTime;
    const status = statusUtil.inferStatus(serverData, responseTime);

    const response = {
      success: true,
      online: true,
      server: {
        host: host,
        port: portNum,
        address: `${host}:${portNum}`,
        type: hostInfo.type,
        ...(serverData.originalHost && { original_hostname: serverData.originalHost })
      },
      status: {
        state: status,
        ping: serverData.ping || responseTime,
        latency_ms: serverData.ping || responseTime,
        quality: statusUtil.getQualityLevel(serverData.ping || responseTime)
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
      query: {
        method: serverData.queryMethod || 'unknown',
        attempts: 1,
        fallback_used: serverData.queryMethod !== 'GameDig'
      },
      meta: {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime,
        query_success: true,
        host_type: hostInfo.type
      },
      api_info: API_INFO
    };

    // Adiciona avisos se houver
    if (validation.warnings && validation.warnings.length > 0) {
      response.warnings = validation.warnings;
    }

    res.json(response);

    console.log(`✅ Consulta bem-sucedida: ${host}:${portNum} (${responseTime}ms via ${serverData.queryMethod})`);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`❌ Erro ao consultar ${host}:${portNum}:`, error.message);
    
    res.json({
      success: false,
      online: false,
      server: {
        host: host,
        port: portNum,
        address: `${host}:${portNum}`,
        type: hostInfo.type
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
        possible_causes: hostInfo.type === 'hostname' 
          ? [
              'Servidor está offline',
              'Hostname não resolve para um IP válido',
              'Servidor não está respondendo a queries',
              'Firewall bloqueando queries UDP',
              'Porta incorreta',
              'Servidor em manutenção'
            ]
          : [
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
        query_success: false,
        host_type: hostInfo.type
      },
      api_info: API_INFO
    });
  }
};
