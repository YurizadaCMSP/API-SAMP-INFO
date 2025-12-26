// app.js
const express = require('express');
const cors = require('cors');
const queryRoute = require('./routes/query.route');

const app = express();

// Middlewares
app.use(cors({
  origin: ['https://sampinfo.qzz.io', 'http://localhost:3000'],
  methods: ['GET'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/query', queryRoute);

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'SA-MP Info API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      query: '/query?ip=127.0.0.1&port=7777'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: ['/query']
  });
});

module.exports = app;
