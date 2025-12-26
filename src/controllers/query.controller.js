const sampService = require('../services/samp.service');
const { validateIpPort } = require('../utils/validator.util');

class QueryController {
  async queryServer(req, res) {
    const startTime = Date.now();
    
    try {
      const { ip, port } = req.query;

      // Validação de parâmetros
      if (!ip || !port) {
        return res.status(400).json({
          error: 'Parâmetros inválidos',
          message: 'Informe o IP e a porta do servidor',
          example: '/query?ip=127.0.0.1&port=7777'
        });
      }

      // Validação de formato
      const validation = validateIpPort(ip, port);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: validation.message
        });
      }

      // Consulta o servidor SA-MP
      const serverData = await sampService.queryServer(ip, parseInt(port));

      // Adiciona metadados da requisição
      const responseTime = Date.now() - startTime;
      serverData.meta = {
        queried_at: new Date().toISOString(),
        response_time_ms: responseTime,
        api_version: '1.0.0'
      };

      res.json(serverData);

    } catch (error) {
      console.error('Erro na consulta:', error);
      
      const responseTime = Date.now() - startTime;
      
      res.status(503).json({
        online: false,
        status: 'offline',
        error: 'Falha na consulta',
        message: error.message || 'Não foi possível conectar ao servidor',
        meta: {
          queried_at: new Date().toISOString(),
          response_time_ms: responseTime
        }
      });
    }
  }
}

module.exports = new QueryController();
