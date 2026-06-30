// Configuração principal da aplicação Express
// Define: middleware global (helmet, cors, body parser), montagem das rotas, error handlers
// NOTA: O body parser é condicional — o webhook do Stripe requer raw body (não JSON)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();

// Middleware de segurança: define headers HTTP seguros
app.use(helmet());

// Middleware CORS: permite pedidos do frontend (cliente mobile/web)
app.use(cors({ origin: env.CLIENT_URL || '*', credentials: true }));

// Body parser condicional:
// - O webhook do Stripe precisa do body raw (para verificar assinatura)
// - Todos os outros endpoints usam JSON
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    express.raw({ type: '*/*' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// Confia no primeiro proxy (importante para rate limiting atrás de reverse proxy)
app.set('trust proxy', 1);

// Monta todas as rotas da API sob o prefixo /api
app.use('/api', apiRoutes);

// Error handlers globais (executam por ordem: primeiro o de erro, depois 404)
app.use(globalErrorHandler);
app.use(notFoundHandler);

module.exports = app;
