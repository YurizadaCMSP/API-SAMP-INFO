const samp = require('samp-query');
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

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: servidor não respondeu em tempo hábil'));
      }, timeout);

      const options = {
        host: ip,
        port: port
      };

      // Inicia a query
      samp(options, (error, response) => {
        clearTimeout(timeoutId);
        
        if (error) {
          return reject(error);
        }

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
            online: response.online || 0,
            maxplayers: response.maxplayers || 0,
            list: response.players || []
          },
          rules: this.normalizeRules(response.rules),
          passworded: response.password === 1 || response.password === true,
          from_cache: false
        };

        // Salva no cache
        cache.set(cacheKey, serverData);

        resolve(serverData);
      });
    });
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
