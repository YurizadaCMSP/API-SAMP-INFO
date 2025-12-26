const sampQuery = require('samp-query-async');
const NodeCache = require('node-cache');
const { inferStatus } = require('../utils/status.util');

// Cache de 10 segundos por servidor
const cache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 10 
});

class SampService {
  async queryServer(ip, port) {
    const cacheKey = `${ip}:${port}`;
    
    // Verifica cache
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return { ...cached, from_cache: true };
    }

    const timeout = parseInt(process.env.QUERY_TIMEOUT_MS) || 2000;
    const startTime = Date.now();

    try {
      // Cria uma promise com timeout
      const queryPromise = sampQuery({
        host: ip,
        port: port,
        timeout: timeout
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: servidor não respondeu em tempo hábil')), timeout);
      });

      // Race entre a query e o timeout
      const response = await Promise.race([queryPromise, timeoutPromise]);

      const ping = Date.now() - startTime;
      const status = inferStatus(response, ping);

      const serverData = {
        online: true,
        ping: ping,
        status: status,
        hostname: response.hostname || 'Desconhecido',
        gamemode: response.gamemode || 'Desconhecido',
        mapname: response.mapname || 'San Andreas',
        players: {
          online: response.players || 0,
          maxplayers: response.maxPlayers || 0,
          list: response.playerList || []
        },
        rules: this.normalizeRules(response.rules),
        passworded: response.password === 1 || response.password === true,
        from_cache: false
      };

      // Salva no cache
      cache.set(cacheKey, serverData);

      return serverData;

    } catch (error) {
      throw new Error(error.message || 'Falha ao conectar com o servidor SA-MP');
    }
  }

  normalizeRules(rules) {
    if (!rules || typeof rules !== 'object') {
      return {};
    }

    return {
      version: rules.version || rules.Version || 'Desconhecido',
      weather: rules.weather || rules.Weather || 'Desconhecido',
      worldtime: rules.worldtime || rules.Worldtime || 'Desconhecido',
      lagcomp: rules.lagcomp || rules.Lagcomp || 'Desconhecido',
      weburl: rules.weburl || rules.Weburl || '',
      ...rules
    };
  }
}

module.exports = new SampService();
