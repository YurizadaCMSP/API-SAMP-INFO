const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query.controller');
const rateLimitMiddleware = require('../middlewares/rateLimit');

// Aplica rate limit de 1 requisição a cada 5 minutos por IP
router.get('/', rateLimitMiddleware, queryController.queryServer);

module.exports = router;
